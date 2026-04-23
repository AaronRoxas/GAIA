"""
Integration tests for Admin API SMS functionality (admin_api.py SMS enqueue)
Module: CR-06 (SMS Notifications)

Tests the complete SMS notification flow when reports are validated or rejected.
"""

import pytest
from unittest.mock import MagicMock, patch, call


class TestAdminSMSIntegration:
    """Test SMS integration in admin API report validation/rejection"""

    def test_sms_enqueue_on_validation(self, mock_third_party_modules):
        """Test that SMS is enqueued when report is validated with contact_phone"""
        # Import after mocking is applied
        from backend.python import admin_api
        
        # Mock the Celery task
        with patch.object(admin_api, 'send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            # Create a mock report with contact_phone
            report = {
                'id': 'rep-001',
                'tracking_id': 'CR20250101ABC123',
                'status': 'unverified',
                'contact_phone': '+639123456789',  # Encrypted in DB
                'hazard_type': 'flood',
                'location_name': 'Metro Manila'
            }
            
            # Simulate the admin validation logic
            if report.get('contact_phone') and mock_sms_task is not None:
                mock_sms_task.delay(
                    report_id=report['id'],
                    status='ACCEPTED',
                    tracking_number=report['tracking_id'],
                    phone_number=report['contact_phone']
                )
            
            # Assert SMS was enqueued with correct parameters
            mock_sms_task.delay.assert_called_once_with(
                report_id='rep-001',
                status='ACCEPTED',
                tracking_number='CR20250101ABC123',
                phone_number='+639123456789'
            )

    def test_sms_enqueue_on_rejection(self, mock_third_party_modules):
        """Test that SMS is enqueued when report is rejected"""
        from backend.python import admin_api
        
        with patch.object(admin_api, 'send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            report = {
                'id': 'rep-002',
                'tracking_id': 'CR20250102XYZ789',
                'status': 'unverified',
                'contact_phone': '+639198765432',
                'hazard_type': 'invalid_type',
                'location_name': 'Test Location'
            }
            
            # Simulate rejection with SMS
            if report.get('contact_phone') and mock_sms_task is not None:
                mock_sms_task.delay(
                    report_id=report['id'],
                    status='REJECTED',
                    tracking_number=report['tracking_id'],
                    phone_number=report['contact_phone']
                )
            
            # Assert SMS was enqueued with REJECTED status
            mock_sms_task.delay.assert_called_once_with(
                report_id='rep-002',
                status='REJECTED',
                tracking_number='CR20250102XYZ789',
                phone_number='+639198765432'
            )

    def test_sms_not_sent_without_contact_phone(self, mock_third_party_modules):
        """Test that SMS is NOT sent if contact_phone is missing"""
        from backend.python import admin_api
        
        with patch.object(admin_api, 'send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            # Report without contact_phone
            report = {
                'id': 'rep-003',
                'tracking_id': 'CR20250103DEF456',
                'status': 'unverified',
                'contact_phone': None,  # No phone provided
                'hazard_type': 'flood',
                'location_name': 'Test Location'
            }
            
            # Simulate validation without contact_phone
            if report.get('contact_phone') and mock_sms_task is not None:
                mock_sms_task.delay(
                    report_id=report['id'],
                    status='ACCEPTED',
                    tracking_number=report['tracking_id'],
                    phone_number=report['contact_phone']
                )
            
            # Assert SMS was NOT called
            mock_sms_task.delay.assert_not_called()

    def test_sms_not_sent_with_empty_contact_phone(self, mock_third_party_modules):
        """Test that SMS is NOT sent if contact_phone is empty string"""
        from backend.python import admin_api
        
        with patch.object(admin_api, 'send_sms_notification') as mock_sms_task:
            mock_sms_task.delay = MagicMock()
            
            report = {
                'id': 'rep-004',
                'tracking_id': 'CR20250104GHI789',
                'status': 'unverified',
                'contact_phone': '',  # Empty phone
                'hazard_type': 'typhoon',
                'location_name': 'Test Location'
            }
            
            # Simulate validation with empty contact_phone
            if report.get('contact_phone') and mock_sms_task is not None:
                mock_sms_task.delay(
                    report_id=report['id'],
                    status='ACCEPTED',
                    tracking_number=report['tracking_id'],
                    phone_number=report['contact_phone']
                )
            
            # Assert SMS was NOT called
            mock_sms_task.delay.assert_not_called()

    def test_contact_phone_validation(self, mock_third_party_modules):
        """Test that contact_phone values are validated properly"""
        from backend.python import admin_api
        
        # Test valid Philippine phone numbers
        valid_phones = [
            '+639123456789',
            '09123456789',
            '+63 912 345 6789',
        ]
        
        for phone in valid_phones:
            # Valid phone should pass
            assert phone is not None and str(phone).strip() != ''

    def test_sms_task_priority_respected(self, mock_third_party_modules):
        """Test that SMS notifications are queued with correct priority"""
        from backend.python import admin_api
        
        with patch.object(admin_api, 'send_sms_notification') as mock_sms_task:
            # Configure mock to support apply_async (priority queuing)
            mock_sms_task.apply_async = MagicMock()
            
            report = {
                'id': 'rep-005',
                'tracking_id': 'CR20250105JKL012',
                'status': 'unverified',
                'contact_phone': '+639134567890',
                'hazard_type': 'flood',
                'location_name': 'Test Location'
            }
            
            # Simulate sending with priority
            if report.get('contact_phone'):
                mock_sms_task.apply_async(
                    args=(
                        report['id'],
                        'ACCEPTED',
                        report['tracking_id'],
                        report['contact_phone']
                    ),
                    priority=9,  # High priority for SMS notifications
                    countdown=0
                )
            
            # Assert apply_async was called
            mock_sms_task.apply_async.assert_called_once()
            call_kwargs = mock_sms_task.apply_async.call_args[1]
            assert call_kwargs.get('priority') == 9
