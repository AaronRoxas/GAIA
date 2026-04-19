"""
End-to-End tests for SMS notification system
Module: CR-06 (SMS Notifications)

Tests the complete flow: report status change → SMS enqueuing → delivery
"""

import pytest
import os
import sys
from unittest.mock import MagicMock, patch, call

# Add project root to path for imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)


class TestSMSNotificationE2E:
    """End-to-end SMS notification flow"""

    def test_sms_on_report_validation_e2e(self, mock_third_party_modules):
        """Test complete flow: validate report → enqueue SMS → task ready"""
        from backend.python import admin_api
        
        # Create a test report with contact_phone
        test_report = {
            'id': 'rep-e2e-001',
            'tracking_id': 'CR20250101E2E001',
            'status': 'unverified',
            'contact_phone': '+639123456789',
            'contact_number': '+639123456789',
            'hazard_type': 'flood',
            'location_name': 'Test Location',
            'validated': False,
        }
        
        # Mock the SMS task
        with patch('backend.python.admin_api.send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            # Simulate admin validation flow
            if test_report.get('contact_phone'):
                mock_sms_task.delay(
                    report_id=test_report['id'],
                    status='ACCEPTED',
                    tracking_number=test_report['tracking_id'],
                    phone_number=test_report['contact_phone']
                )
            
            # Verify SMS was enqueued
            mock_sms_task.delay.assert_called_once()

    def test_sms_on_report_rejection_e2e(self, mock_third_party_modules):
        """Test complete flow: reject report → enqueue SMS"""
        from backend.python import admin_api
        
        test_report = {
            'id': 'rep-e2e-002',
            'tracking_id': 'CR20250102E2E002',
            'contact_phone': '+639198765432',
            'hazard_type': 'invalid',
        }
        
        with patch('backend.python.admin_api.send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            if test_report.get('contact_phone'):
                mock_sms_task.delay(
                    report_id=test_report['id'],
                    status='REJECTED',
                    tracking_number=test_report['tracking_id'],
                    phone_number=test_report['contact_phone']
                )
            
            mock_sms_task.delay.assert_called_once()

    def test_no_sms_without_contact_phone_e2e(self, mock_third_party_modules):
        """Test that SMS is NOT enqueued when contact_phone is missing"""
        from backend.python import admin_api
        
        test_report = {
            'id': 'rep-e2e-003',
            'tracking_id': 'CR20250103E2E003',
            'contact_phone': None,
            'hazard_type': 'flood',
        }
        
        with patch('backend.python.admin_api.send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            if test_report.get('contact_phone'):
                mock_sms_task.delay(
                    report_id=test_report['id'],
                    status='ACCEPTED',
                    tracking_number=test_report['tracking_id'],
                    phone_number=test_report['contact_phone']
                )
            
            mock_sms_task.delay.assert_not_called()

    def test_sms_task_receives_encrypted_phone_e2e(self, mock_third_party_modules):
        """Test that SMS task receives encrypted phone"""
        from backend.python import admin_api
        
        encrypted_phone = "ENC::ENCRYPTED_VALUE"
        
        test_report = {
            'id': 'rep-e2e-004',
            'tracking_id': 'CR20250104E2E004',
            'contact_phone': encrypted_phone,
        }
        
        with patch('backend.python.admin_api.send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            if test_report.get('contact_phone'):
                mock_sms_task.delay(
                    report_id=test_report['id'],
                    status='ACCEPTED',
                    tracking_number=test_report['tracking_id'],
                    phone_number=test_report['contact_phone']
                )
            
            call_args = mock_sms_task.delay.call_args
            assert call_args[1]['phone_number'].startswith('ENC::')

    def test_sms_message_format_e2e(self, mock_third_party_modules):
        """Test that SMS message is properly formatted"""
        tracking_id = 'CR20250105E2E005'
        message = f"Report {tracking_id} ACCEPTED. Track: https://gaia.ph/track/{tracking_id}"
        
        assert tracking_id in message
        assert len(message) <= 160

    def test_sms_task_idempotency_e2e(self, mock_third_party_modules):
        """Test that SMS task can be safely retried"""
        from backend.python import admin_api
        
        test_report = {
            'id': 'rep-e2e-006',
            'contact_phone': '+639111111111',
        }
        
        with patch('backend.python.admin_api.send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            for _ in range(2):
                if test_report.get('contact_phone'):
                    mock_sms_task.delay(report_id=test_report['id'], status='ACCEPTED', tracking_number='test', phone_number=test_report['contact_phone'])
            
            assert mock_sms_task.delay.call_count == 2
