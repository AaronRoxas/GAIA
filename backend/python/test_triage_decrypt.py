#!/usr/bin/env python3
"""Test decryption in triage endpoint"""
import sys
import os
sys.path.insert(0, '/app')
os.chdir('/app')

from backend.python.lib.supabase_client import supabase
from backend.python.utils.field_encryption import decrypt_pii_fields

# Simulate the triage endpoint
response = supabase.schema('gaia').from_('citizen_reports').select('*').eq('status', 'unverified').order('submitted_at', desc=False).limit(1).execute()

if response.data:
    report = response.data[0]
    print('Raw data from DB:')
    print(f"  name: {str(report.get('name', ''))[:60]}")
    print(f"  contact_number: {str(report.get('contact_number', ''))[:60]}")
    
    # Apply decrypt like the endpoint does
    decrypted_report = decrypt_pii_fields(report)
    print('\nAfter decrypt_pii_fields:')
    print(f"  name: {decrypted_report.get('name', '')}")
    print(f"  contact_number: {decrypted_report.get('contact_number', '')}")
    
    if report.get('name') == decrypted_report.get('name'):
        print('\nWARNING: Decryption did not change the name field!')
    else:
        print('\nSUCCESS: Decryption changed the name field')
else:
    print('No unverified reports found')
