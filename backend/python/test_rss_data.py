#!/usr/bin/env python3
"""Check RSS feeds data"""
import sys
import os
sys.path.insert(0, '/app')
os.chdir('/app')

from backend.python.lib.supabase_client import supabase

# Get first 3 feeds with key columns
result = supabase.schema('gaia').from_('rss_feeds').select('feed_name, last_fetched_at, total_hazards_found, last_successful_fetch, total_fetches, total_errors').limit(3).execute()

print("RSS Feeds Data:")
print("=" * 80)
for feed in result.data:
    print(f"Feed: {feed['feed_name']}")
    print(f"  Last Fetched: {feed['last_fetched_at']}")
    print(f"  Total Hazards: {feed['total_hazards_found']}")
    print(f"  Last Successful: {feed['last_successful_fetch']}")
    print(f"  Total Fetches: {feed['total_fetches']}")
    print(f"  Total Errors: {feed['total_errors']}")
    print()
