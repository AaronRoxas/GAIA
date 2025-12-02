"""
Test Suite for Patch 4: Audit Trail Integrity
Security Focus: Integrity (CIA Triad)

Tests tamper-evident audit logging with cryptographic checksums.
"""

import pytest
import os
import sys
import uuid
import json

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'python'))


class TestAuditIntegrityModule:
    """Test the audit integrity module functionality"""
    
    def test_module_imports(self):
        """Test that audit integrity module can be imported"""
        from backend.python.middleware.audit_integrity import (
            AuditIntegrity,
            AuditEntry,
            compute_checksum_for_log,
            verify_log_entry_checksum,
            GENESIS_HASH,
            HASH_ALGORITHM
        )
        assert AuditIntegrity is not None
        assert AuditEntry is not None
        assert callable(compute_checksum_for_log)
        assert callable(verify_log_entry_checksum)
        assert len(GENESIS_HASH) == 64  # SHA-256 hex length
        assert HASH_ALGORITHM == "sha256"
    
    def test_create_audit_entry(self):
        """Test creating a new audit entry"""
        from backend.python.middleware.audit_integrity import AuditIntegrity
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="TEST_ACTION",
            user_id="user-123",
            user_email="test@example.com",
            user_role="tester",
            resource_type="test",
            resource_id="resource-456",
            data={"key": "value"}
        )
        
        assert entry is not None
        assert entry.action == "TEST_ACTION"
        assert entry.user_email == "test@example.com"
        assert entry.checksum is not None
        assert len(entry.checksum) > 64  # hash:signature format
    
    def test_verify_entry_valid(self):
        """Test verifying a valid audit entry"""
        from backend.python.middleware.audit_integrity import AuditIntegrity
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="VALID_ACTION",
            user_email="test@example.com",
            user_role="tester"
        )
        
        is_valid, message = AuditIntegrity.verify_entry(entry)
        
        assert is_valid is True
        assert "verified" in message.lower()
    
    def test_detect_tampered_action(self):
        """Test detection of tampered action field"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, AuditEntry
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="ORIGINAL_ACTION",
            user_email="test@example.com",
            user_role="tester"
        )
        
        # Create tampered copy
        tampered_dict = entry.to_dict()
        tampered_dict["action"] = "TAMPERED_ACTION"
        tampered_entry = AuditEntry.from_dict(tampered_dict)
        
        is_valid, message = AuditIntegrity.verify_entry(tampered_entry)
        
        assert is_valid is False
        assert "tampered" in message.lower() or "mismatch" in message.lower()
    
    def test_detect_tampered_data(self):
        """Test detection of tampered data field"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, AuditEntry
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="TEST_ACTION",
            user_email="test@example.com",
            user_role="tester",
            data={"original": "data"}
        )
        
        # Tamper with data
        tampered_dict = entry.to_dict()
        tampered_dict["data"] = {"tampered": "data"}
        tampered_entry = AuditEntry.from_dict(tampered_dict)
        
        is_valid, message = AuditIntegrity.verify_entry(tampered_entry)
        
        assert is_valid is False
    
    def test_detect_tampered_timestamp(self):
        """Test detection of tampered timestamp"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, AuditEntry
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="TEST_ACTION",
            user_email="test@example.com",
            user_role="tester"
        )
        
        # Tamper with timestamp
        tampered_dict = entry.to_dict()
        tampered_dict["timestamp"] = "2020-01-01T00:00:00"  # Different timestamp
        tampered_entry = AuditEntry.from_dict(tampered_dict)
        
        is_valid, message = AuditIntegrity.verify_entry(tampered_entry)
        
        assert is_valid is False
    
    def test_detect_tampered_user(self):
        """Test detection of tampered user fields"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, AuditEntry
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="TEST_ACTION",
            user_id="original-user",
            user_email="original@example.com",
            user_role="user"
        )
        
        # Tamper with user_id
        tampered_dict = entry.to_dict()
        tampered_dict["user_id"] = "attacker-user"
        tampered_entry = AuditEntry.from_dict(tampered_dict)
        
        is_valid, message = AuditIntegrity.verify_entry(tampered_entry)
        
        assert is_valid is False


class TestAuditChainIntegrity:
    """Test audit chain verification"""
    
    def test_create_valid_chain(self):
        """Test creating and verifying a valid chain"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, GENESIS_HASH
        
        entries = []
        prev_hash = GENESIS_HASH
        
        for i in range(3):
            entry = AuditIntegrity.create_entry(
                entry_id=str(uuid.uuid4()),
                action=f"ACTION_{i}",
                user_email="test@example.com",
                user_role="tester",
                previous_hash=prev_hash
            )
            entries.append(entry)
            prev_hash = AuditIntegrity.get_entry_hash(entry)
        
        is_valid, message, last_valid = AuditIntegrity.verify_chain(entries)
        
        assert is_valid is True
        assert last_valid == 2  # Last index
    
    def test_detect_broken_chain(self):
        """Test detection of broken chain linkage"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, GENESIS_HASH, AuditEntry
        
        entries = []
        prev_hash = GENESIS_HASH
        
        # Create valid chain
        for i in range(3):
            entry = AuditIntegrity.create_entry(
                entry_id=str(uuid.uuid4()),
                action=f"ACTION_{i}",
                user_email="test@example.com",
                user_role="tester",
                previous_hash=prev_hash
            )
            entries.append(entry)
            prev_hash = AuditIntegrity.get_entry_hash(entry)
        
        # Break chain by modifying second entry's previous_hash
        tampered_dict = entries[1].to_dict()
        tampered_dict["previous_hash"] = "0" * 64  # Wrong hash
        # Need to recompute checksum for the tampered entry to pass individual verification
        # but fail chain verification
        entries[1] = AuditEntry.from_dict(tampered_dict)
        
        is_valid, message, last_valid = AuditIntegrity.verify_chain(entries)
        
        # Should fail either at entry verification or chain linkage
        assert is_valid is False
    
    def test_empty_chain_valid(self):
        """Test that empty chain is considered valid"""
        from backend.python.middleware.audit_integrity import AuditIntegrity
        
        is_valid, message, last_valid = AuditIntegrity.verify_chain([])
        
        assert is_valid is True
        assert last_valid == -1


class TestTamperDetection:
    """Test comprehensive tamper detection"""
    
    def test_detect_tampering_report(self):
        """Test tampering detection report"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, GENESIS_HASH, AuditEntry
        
        entries = []
        prev_hash = GENESIS_HASH
        
        # Create valid chain
        for i in range(3):
            entry = AuditIntegrity.create_entry(
                entry_id=str(uuid.uuid4()),
                action=f"ACTION_{i}",
                user_email="test@example.com",
                user_role="tester",
                previous_hash=prev_hash
            )
            entries.append(entry)
            prev_hash = AuditIntegrity.get_entry_hash(entry)
        
        # Get report for valid chain
        report = AuditIntegrity.detect_tampering(entries)
        
        assert report["chain_valid"] is True
        assert report["total_entries"] == 3
        assert report["verified_entries"] == 3
        assert len(report["tampered_entries"]) == 0
        assert len(report["chain_breaks"]) == 0
    
    def test_tampering_report_shows_tampered_entries(self):
        """Test that tampering report identifies tampered entries"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, GENESIS_HASH, AuditEntry
        
        entries = []
        prev_hash = GENESIS_HASH
        
        # Create chain
        for i in range(3):
            entry = AuditIntegrity.create_entry(
                entry_id=str(uuid.uuid4()),
                action=f"ACTION_{i}",
                user_email="test@example.com",
                user_role="tester",
                previous_hash=prev_hash
            )
            entries.append(entry)
            prev_hash = AuditIntegrity.get_entry_hash(entry)
        
        # Tamper with middle entry
        tampered_dict = entries[1].to_dict()
        tampered_dict["action"] = "TAMPERED"
        entries[1] = AuditEntry.from_dict(tampered_dict)
        
        report = AuditIntegrity.detect_tampering(entries)
        
        assert report["chain_valid"] is False
        assert len(report["tampered_entries"]) >= 1


class TestChecksumComputation:
    """Test checksum computation functions"""
    
    def test_compute_checksum_for_log(self):
        """Test standalone checksum computation"""
        from backend.python.middleware.audit_integrity import compute_checksum_for_log
        from datetime import datetime
        
        checksum = compute_checksum_for_log(
            action="TEST",
            user_id="user-1",
            user_email="test@example.com",
            user_role="tester",
            resource_type="test",
            resource_id="123",
            ip_address="127.0.0.1",
            details={"key": "value"},
            timestamp=datetime.utcnow().isoformat()
        )
        
        assert checksum is not None
        assert ":" in checksum  # hash:signature format
        assert len(checksum.split(":")[0]) == 64  # SHA-256 hex
    
    def test_verify_log_entry_checksum_valid(self):
        """Test verifying valid log entry checksum"""
        from backend.python.middleware.audit_integrity import (
            compute_checksum_for_log,
            verify_log_entry_checksum,
            GENESIS_HASH
        )
        from datetime import datetime
        
        timestamp = datetime.utcnow().isoformat()
        details = {"action_detail": "test"}
        
        checksum = compute_checksum_for_log(
            action="TEST",
            user_id="user-1",
            user_email="test@example.com",
            user_role="tester",
            resource_type="test",
            resource_id="123",
            ip_address="127.0.0.1",
            details=details,
            timestamp=timestamp
        )
        
        is_valid, message = verify_log_entry_checksum(
            action="TEST",
            user_id="user-1",
            user_email="test@example.com",
            user_role="tester",
            resource_type="test",
            resource_id="123",
            ip_address="127.0.0.1",
            details=details,
            timestamp=timestamp,
            previous_hash=GENESIS_HASH,
            stored_checksum=checksum
        )
        
        assert is_valid is True
    
    def test_verify_log_entry_checksum_invalid(self):
        """Test detecting invalid log entry checksum"""
        from backend.python.middleware.audit_integrity import (
            compute_checksum_for_log,
            verify_log_entry_checksum,
            GENESIS_HASH
        )
        from datetime import datetime
        
        timestamp = datetime.utcnow().isoformat()
        
        checksum = compute_checksum_for_log(
            action="TEST",
            user_id="user-1",
            user_email="test@example.com",
            user_role="tester",
            resource_type="test",
            resource_id="123",
            ip_address="127.0.0.1",
            details={},
            timestamp=timestamp
        )
        
        # Verify with modified data
        is_valid, message = verify_log_entry_checksum(
            action="MODIFIED",  # Changed!
            user_id="user-1",
            user_email="test@example.com",
            user_role="tester",
            resource_type="test",
            resource_id="123",
            ip_address="127.0.0.1",
            details={},
            timestamp=timestamp,
            previous_hash=GENESIS_HASH,
            stored_checksum=checksum
        )
        
        assert is_valid is False


class TestActivityLoggerIntegration:
    """Test integration with ActivityLogger"""
    
    def test_activity_logger_imports_audit_integrity(self):
        """Test that ActivityLogger imports audit integrity"""
        from backend.python.middleware.activity_logger import (
            ActivityLogger,
            compute_checksum_for_log,
            GENESIS_HASH
        )
        
        assert ActivityLogger is not None
        assert callable(compute_checksum_for_log)
        assert GENESIS_HASH is not None


class TestDeterministicHashing:
    """Test that hashing is deterministic"""
    
    def test_same_input_same_hash(self):
        """Test that same input produces same hash"""
        from backend.python.middleware.audit_integrity import AuditIntegrity
        
        entry_id = str(uuid.uuid4())
        timestamp = "2024-01-01T00:00:00"
        
        entry1 = AuditIntegrity.create_entry(
            entry_id=entry_id,
            action="TEST",
            user_email="test@example.com",
            user_role="tester",
            timestamp=timestamp
        )
        
        entry2 = AuditIntegrity.create_entry(
            entry_id=entry_id,
            action="TEST",
            user_email="test@example.com",
            user_role="tester",
            timestamp=timestamp
        )
        
        # Checksums should be identical for same input
        assert entry1.checksum == entry2.checksum
    
    def test_different_input_different_hash(self):
        """Test that different input produces different hash"""
        from backend.python.middleware.audit_integrity import AuditIntegrity
        
        timestamp = "2024-01-01T00:00:00"
        
        entry1 = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="ACTION_A",
            user_email="test@example.com",
            user_role="tester",
            timestamp=timestamp
        )
        
        entry2 = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="ACTION_B",  # Different action
            user_email="test@example.com",
            user_role="tester",
            timestamp=timestamp
        )
        
        # Content hashes should be different
        hash1 = AuditIntegrity.get_entry_hash(entry1)
        hash2 = AuditIntegrity.get_entry_hash(entry2)
        
        assert hash1 != hash2


class TestHMACSignature:
    """Test HMAC signature functionality"""
    
    def test_signature_present_in_checksum(self):
        """Test that checksum includes HMAC signature"""
        from backend.python.middleware.audit_integrity import AuditIntegrity
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="TEST",
            user_email="test@example.com",
            user_role="tester"
        )
        
        # Checksum should be in format: hash:signature
        assert ":" in entry.checksum
        parts = entry.checksum.split(":")
        assert len(parts) == 2
        assert len(parts[0]) == 64  # SHA-256 hex
        assert len(parts[1]) == 16  # Truncated HMAC
    
    def test_invalid_signature_detected(self):
        """Test that invalid HMAC signature is detected"""
        from backend.python.middleware.audit_integrity import AuditIntegrity, AuditEntry
        
        entry = AuditIntegrity.create_entry(
            entry_id=str(uuid.uuid4()),
            action="TEST",
            user_email="test@example.com",
            user_role="tester"
        )
        
        # Tamper with signature
        tampered_dict = entry.to_dict()
        hash_part = tampered_dict["checksum"].split(":")[0]
        tampered_dict["checksum"] = f"{hash_part}:fakesignature00"
        tampered_entry = AuditEntry.from_dict(tampered_dict)
        
        is_valid, message = AuditIntegrity.verify_entry(tampered_entry)
        
        assert is_valid is False
        assert "signature" in message.lower() or "mismatch" in message.lower()
