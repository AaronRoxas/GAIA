"""
Tests for SMS Service (lib/sms_service.py)
Module: CR-06 (SMS Notifications)
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock
import sys

# Add project root to path for imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Mock boto3 and botocore before importing sms_service
sys.modules['boto3'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()

from backend.python.lib.sms_service import SMSService, ClientError


class TestSMSServicePhoneValidation:
    """Test phone number validation"""

    def test_valid_09_format(self):
        """Test validation of 09XX XXX XXXX format"""
        service = SMSService()
        assert service.validate_phone_number('09123456789') is True
        assert service.validate_phone_number('09987654321') is True

    def test_valid_plus63_format(self):
        """Test validation of +63 9XX XXX XXXX format"""
        service = SMSService()
        assert service.validate_phone_number('+639123456789') is True
        assert service.validate_phone_number('+63 9 123 456 789') is True

    def test_valid_63_format(self):
        """Test validation of 63 9XX XXX XXXX format"""
        service = SMSService()
        assert service.validate_phone_number('639123456789') is True

    def test_invalid_phone_formats(self):
        """Test rejection of invalid phone formats"""
        service = SMSService()
        assert service.validate_phone_number('08123456789') is False  # Wrong prefix
        assert service.validate_phone_number('1234567890') is False  # Too short
        assert service.validate_phone_number('') is False  # Empty
        assert service.validate_phone_number(None) is False  # None
        assert service.validate_phone_number('invalid') is False  # Non-numeric

    def test_valid_phone_with_spaces_and_dashes(self):
        """Test phone validation with spaces and dashes - should be valid"""
        service = SMSService()
        assert service.validate_phone_number('09 123 456 789') is True
        assert service.validate_phone_number('09-123-456-789') is True
        assert service.validate_phone_number('+63 9 123 456 789') is True


class TestSMSServicePhoneNormalization:
    """Test phone number normalization to +63 format"""

    def test_normalize_09_format(self):
        """Test normalization of 09 format to +63 format"""
        service = SMSService()
        result = service.normalize_phone_number('09123456789')
        assert result == '+639123456789'

    def test_normalize_plus63_format(self):
        """Test normalization when already in +63 format"""
        service = SMSService()
        result = service.normalize_phone_number('+639123456789')
        assert result == '+639123456789'

    def test_normalize_63_format(self):
        """Test normalization of 63 format to +63 format"""
        service = SMSService()
        result = service.normalize_phone_number('639123456789')
        assert result == '+639123456789'

    def test_normalize_with_spaces(self):
        """Test normalization with spaces and dashes"""
        service = SMSService()
        result = service.normalize_phone_number('09 123 456 789')
        assert result == '+639123456789'

        result = service.normalize_phone_number('09-123-456-789')
        assert result == '+639123456789'

    def test_normalize_invalid_returns_none(self):
        """Test that invalid numbers return None"""
        service = SMSService()
        assert service.normalize_phone_number('08123456789') is None
        assert service.normalize_phone_number('invalid') is None
        assert service.normalize_phone_number('') is None
        assert service.normalize_phone_number(None) is None


class TestSMSServiceSendSMS:
    """Test SMS sending functionality"""

    @patch('backend.python.lib.sms_service.boto3.client')
    def test_send_sms_success(self, mock_boto3_client):
        """Test successful SMS sending"""
        # Setup mock
        mock_sns = MagicMock()
        mock_boto3_client.return_value = mock_sns
        mock_sns.publish.return_value = {'MessageId': 'msg-123456789'}

        # Test
        service = SMSService()
        result = service.send_sms('09123456789', 'Test message')

        # Assertions
        assert result['status'] == 'success'
        assert result['message_id'] == 'msg-123456789'
        assert result['error'] is None
        mock_sns.publish.assert_called_once()

    @patch('backend.python.lib.sms_service.boto3.client')
    def test_send_sms_with_plus63_format(self, mock_boto3_client):
        """Test SMS sending with +63 format"""
        mock_sns = MagicMock()
        mock_boto3_client.return_value = mock_sns
        mock_sns.publish.return_value = {'MessageId': 'msg-123456789'}

        service = SMSService()
        result = service.send_sms('+639123456789', 'Test message')

        assert result['status'] == 'success'
        assert result['message_id'] == 'msg-123456789'

    def test_send_sms_invalid_phone(self):
        """Test SMS sending with invalid phone number"""
        service = SMSService()
        result = service.send_sms('08123456789', 'Test message')

        assert result['status'] == 'failure'
        assert result['message_id'] is None
        assert 'Invalid Philippine phone number' in result['error']

    def test_send_sms_empty_message(self):
        """Test SMS sending with empty message"""
        service = SMSService()
        result = service.send_sms('09123456789', '')

        assert result['status'] == 'failure'
        assert result['message_id'] is None
        assert 'Message cannot be empty' in result['error']

    def test_send_sms_message_too_long(self):
        """Test SMS sending with message exceeding 160 characters"""
        service = SMSService()
        long_message = 'A' * 161

        result = service.send_sms('09123456789', long_message)

        assert result['status'] == 'failure'
        assert result['message_id'] is None
        assert 'exceeds 160 character limit' in result['error']

    @patch('backend.python.lib.sms_service.boto3')
    def test_send_sms_message_exactly_160_chars(self, mock_boto3_module):
        """Test SMS sending with message exactly 160 characters"""
        service = SMSService()
        exact_message = 'A' * 160
        
        # Verify message length
        assert len(exact_message) == 160
        
        # Mock SNS client
        mock_client = MagicMock()
        mock_boto3_module.client.return_value = mock_client
        mock_client.publish.return_value = {'MessageId': 'msg-123'}
        
        service.sns_client = mock_client
        
        # Should pass validation and return success (or handle based on SNS response)
        result = service.send_sms('09123456789', exact_message)
        
        # Should call publish since message is exactly at limit
        assert result['status'] == 'success'
        assert mock_client.publish.called

    @patch('backend.python.lib.sms_service.boto3')
    def test_send_sms_aws_error(self, mock_boto3_module):
        """Test SMS sending with AWS SNS error"""
        # Setup mock to raise exception
        mock_client = MagicMock()
        mock_boto3_module.client.return_value = mock_client

        error_response = {
            'Error': {
                'Code': 'InvalidParameterException',
                'Message': 'Invalid phone number'
            }
        }
        # Create exception with response attribute
        def raise_error(*args, **kwargs):
            exc = Exception('AWS SNS error')
            exc.response = error_response
            raise exc

        mock_client.publish.side_effect = raise_error

        service = SMSService()
        result = service.send_sms('09123456789', 'Test message')

        assert result['status'] == 'failure'
        assert result['message_id'] is None
        assert 'AWS SNS error' in result['error']

    @patch('backend.python.lib.sms_service.boto3.client')
    def test_send_sms_unexpected_error(self, mock_boto3_client):
        """Test SMS sending with unexpected error"""
        mock_sns = MagicMock()
        mock_boto3_client.return_value = mock_sns
        mock_sns.publish.side_effect = Exception('Network error')

        service = SMSService()
        result = service.send_sms('09123456789', 'Test message')

        assert result['status'] == 'failure'
        assert result['message_id'] is None
        assert 'Unexpected error' in result['error']

    @patch('backend.python.lib.sms_service.boto3.client')
    def test_send_sms_with_special_characters(self, mock_boto3_client):
        """Test SMS sending with special characters in message"""
        mock_sns = MagicMock()
        mock_boto3_client.return_value = mock_sns
        mock_sns.publish.return_value = {'MessageId': 'msg-123456789'}

        service = SMSService()
        message = 'Report #ABC123 ACCEPTED. Track: http://gaia.ph/track?id=123'
        result = service.send_sms('09123456789', message)

        assert result['status'] == 'success'
        assert result['message_id'] == 'msg-123456789'

    @patch('backend.python.lib.sms_service.boto3.client')
    def test_send_sms_sns_attributes(self, mock_boto3_client):
        """Test that SMS is sent without SNS attributes (AWS handles SMS type)"""
        mock_sns = MagicMock()
        mock_boto3_client.return_value = mock_sns
        mock_sns.publish.return_value = {'MessageId': 'msg-123456789'}

        service = SMSService()
        service.send_sms('09123456789', 'Test message')

        # Verify SMS is sent with correct parameters (no MessageAttributes needed)
        call_args = mock_sns.publish.call_args
        assert call_args.kwargs['PhoneNumber'] == '+639123456789'
        assert call_args.kwargs['Message'] == 'Test message'
        # AWS SNS handles SMS type automatically - no MessageAttributes needed


class TestSMSServiceIntegration:
    """Integration tests for SMS service"""

    def test_service_initialization(self):
        """Test that service initializes without error"""
        with patch('backend.python.lib.sms_service.boto3.client'):
            service = SMSService()
            assert service.sns_client is not None

    @patch('backend.python.lib.sms_service.boto3.client')
    def test_full_workflow_success(self, mock_boto3_client):
        """Test full SMS workflow: validate -> normalize -> send"""
        mock_sns = MagicMock()
        mock_boto3_client.return_value = mock_sns
        mock_sns.publish.return_value = {'MessageId': 'msg-123456789'}

        service = SMSService()

        # Step 1: Validate
        phone = '09 123 456 789'
        assert service.validate_phone_number(phone) is True

        # Step 2: Normalize
        normalized = service.normalize_phone_number(phone)
        assert normalized == '+639123456789'

        # Step 3: Send
        result = service.send_sms(phone, 'Report CR20250101ABC123 ACCEPTED')
        assert result['status'] == 'success'
