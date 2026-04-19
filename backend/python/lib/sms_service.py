"""
SMS Service Abstraction Layer for GAIA
Handles SMS delivery via AWS SNS with Philippine phone number validation.

Module: CR-06 (SMS Notifications)
"""

import os
import re
import logging
from typing import Optional, Dict, Any

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    # For testing environments where boto3 might not be installed
    boto3 = None
    HAS_BOTO3 = False

    class ClientError(Exception):
        def __init__(self, error_response, operation_name):
            self.response = error_response
            self.operation_name = operation_name

logger = logging.getLogger(__name__)


class SMSService:
    """
    SMS delivery service using AWS SNS.
    Validates and normalizes Philippine phone numbers to +63 format.
    """

    # Philippine area codes (mobile)
    PH_MOBILE_PREFIXES = ['9']  # Mobile numbers start with 9 (after country code)

    def __init__(self):
        """Initialize AWS SNS client"""
        if HAS_BOTO3 and boto3:
            self.sns_client = boto3.client(
                'sns',
                region_name=os.getenv('AWS_SNS_REGION', 'ap-southeast-1')
            )
        else:
            self.sns_client = None

    def _mask_phone_for_logging(self, phone_number: Optional[str]) -> str:
        """
        Mask phone number for safe logging (PII protection).
        
        Args:
            phone_number: Phone number to mask (or None)
        
        Returns:
            Masked version showing only last 2 digits (e.g., "***9939") or "<redacted>"
        """
        if not phone_number:
            return "<redacted>"
        
        phone_str = str(phone_number).strip()
        if not phone_str:
            return "<redacted>"
        
        if len(phone_str) >= 2:
            return "*" * (len(phone_str) - 2) + phone_str[-2:]
        return "*" * len(phone_str)

    def validate_phone_number(self, phone_number: str) -> bool:
        """
        Validates if a phone number is a valid Philippine phone number.

        Args:
            phone_number: Phone number to validate (09XX XXX XXXX or +63 9XX XXX XXXX format)

        Returns:
            True if valid Philippine phone number, False otherwise
        """
        if not phone_number or not isinstance(phone_number, str):
            return False

        # Remove all spaces, dashes, parentheses
        cleaned = re.sub(r'[\s\-()]', '', phone_number)

        # Philippine mobile numbers: 09XX XXXXXX (11 digits starting with 09)
        mobile_pattern = re.compile(r'^09\d{9}$')

        # Philippine mobile numbers with +63: +639XX XXXXXX (13 chars starting with +639)
        international_mobile_pattern = re.compile(r'^\+639\d{9}$')

        # Philippine mobile numbers with 63: 639XX XXXXXX (12 digits starting with 639)
        intl_code_pattern = re.compile(r'^639\d{9}$')

        return bool(
            mobile_pattern.match(cleaned)
            or international_mobile_pattern.match(cleaned)
            or intl_code_pattern.match(cleaned)
        )

    def normalize_phone_number(self, phone_number: str) -> Optional[str]:
        """
        Normalizes a Philippine phone number to +63 format.

        Args:
            phone_number: Phone number to normalize

        Returns:
            Normalized phone number in +63 format, or None if invalid
        """
        if not self.validate_phone_number(phone_number):
            return None

        # Remove all non-digit and non-plus characters
        cleaned = re.sub(r'[^\d+]', '', phone_number)

        # If starts with 09, convert to +639
        if cleaned.startswith('09'):
            return f"+63{cleaned[1:]}"

        # If starts with 639, add +
        if cleaned.startswith('639') and not cleaned.startswith('+639'):
            return f"+{cleaned}"

        # If already +639, return as is
        if cleaned.startswith('+639'):
            return cleaned

        # Fallback: shouldn't reach here if validation passed
        return None

    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """
        Send SMS via AWS SNS.

        Args:
            phone_number: Recipient's Philippine phone number
            message: SMS message (max 160 characters)

        Returns:
            Dict with keys:
            - status: 'success' or 'failure'
            - message_id: SNS MessageId if successful
            - error: Error message if failed
        """
        # Validate phone number
        if not self.validate_phone_number(phone_number):
            masked = self._mask_phone_for_logging(phone_number)
            return {
                'status': 'failure',
                'message_id': None,
                'error': f'Invalid Philippine phone number: {masked}'
            }

        # Validate message length
        if not message or len(message) == 0:
            return {
                'status': 'failure',
                'message_id': None,
                'error': 'Message cannot be empty'
            }

        if len(message) > 160:
            return {
                'status': 'failure',
                'message_id': None,
                'error': f'Message exceeds 160 character limit (current: {len(message)})'
            }

        # Normalize phone number
        normalized_phone = self.normalize_phone_number(phone_number)
        if not normalized_phone:
            masked = self._mask_phone_for_logging(phone_number)
            return {
                'status': 'failure',
                'message_id': None,
                'error': f'Failed to normalize phone number: {masked}'
            }

        # Verify SNS client is initialized
        if not self.sns_client:
            logger.error("AWS SNS client is not initialized. Check AWS credentials and boto3 installation.")
            return {
                'status': 'failure',
                'message_id': None,
                'error': 'SMS service unavailable (SNS client not initialized)'
            }

        try:
            # Publish to SNS
            # Note: AWS.SNS.SMS.SmsType is a reserved attribute and cannot be set in MessageAttributes
            # AWS SNS will handle SMS type automatically. For transactional SMS, use the SMS pricing model.
            response = self.sns_client.publish(
                PhoneNumber=normalized_phone,
                Message=message
            )

            message_id = response.get('MessageId')
            logger.info(f'SMS sent successfully (MessageId: {message_id})')

            return {
                'status': 'success',
                'message_id': message_id,
                'error': None
            }

        except Exception as e:
            # Handle both ClientError and other exceptions
            error_message = str(e)
            masked_phone = self._mask_phone_for_logging(normalized_phone)
            
            # Check if it's a ClientError by looking at attributes
            if hasattr(e, 'response') and isinstance(getattr(e, 'response', None), dict):
                # This is a ClientError
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                error_text = e.response.get('Error', {}).get('Message', error_message)
                logger.error(f'AWS SNS error ({error_code}): {error_text} for phone {masked_phone}')
                return {
                    'status': 'failure',
                    'message_id': None,
                    'error': f'AWS SNS error: {error_text}'
                }
            else:
                # Generic exception
                logger.error(f'Unexpected error sending SMS to {masked_phone}: {error_message}')
                return {
                    'status': 'failure',
                    'message_id': None,
                    'error': f'Unexpected error: {error_message}'
                }
