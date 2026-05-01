#!/usr/bin/env python3
"""Quick script to check if data in database is encrypted"""
import sys
sys.path.insert(0, '/app')

from backend.python.lib.supabase_client import supabase

# Get the latest citizen report
result = supabase.schema('gaia').from_('citizen_reports').select('tracking_id, name, contact_number').order('created_at', desc=True).limit(1).execute()

if result.data:
    report = result.data[0]
    print(f"Tracking ID: {report['tracking_id']}")
    name = report.get('name', '')
    contact = report.get('contact_number', '')
    print(f"Name (first 80 chars): {str(name)[:80]}")
    print(f"Contact Number (first 80 chars): {str(contact)[:80]}")
    print(f"Name is encrypted: {'ENC::' in str(name)}")
    print(f"Contact Number is encrypted: {'ENC::' in str(contact)}")
else:
    print("No citizen reports found")
