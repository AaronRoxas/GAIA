"""
Integration test for config update propagation.

Verifies that:
1. A system config update is persisted and logged to audit_logs.
2. RSS processing reads the updated threshold from system_config.
3. The updated threshold is actually passed into classification.
"""

from __future__ import annotations

import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../backend/python'))

from backend.python import admin_api
from backend.python.lib.config_manager import ConfigManager
from backend.python.lib import config_manager as config_manager_module
from backend.python.middleware import rbac
from backend.python.pipeline.rss_processor_enhanced import RSSProcessorEnhanced


class FakeSupabase:
    def __init__(self):
        self.system_config = {
            "confidence_threshold_rss": {
                "config_key": "confidence_threshold_rss",
                "config_value": "0.70",
                "value_type": "number",
                "min_value": 0.0,
                "max_value": 1.0,
            },
            "confidence_threshold_citizen": {
                "config_key": "confidence_threshold_citizen",
                "config_value": "0.50",
                "value_type": "number",
                "min_value": 0.0,
                "max_value": 1.0,
            },
        }
        self.audit_logs = []
        self._table = None
        self._operation = None
        self._filters = []
        self._update_payload = None
        self._insert_payload = None

    def schema(self, _name):
        return self

    def from_(self, table_name):
        self._table = table_name
        self._operation = None
        self._filters = []
        self._update_payload = None
        self._insert_payload = None
        return self

    def table(self, table_name):
        return self.from_(table_name)

    def select(self, *_args, **_kwargs):
        self._operation = "select"
        return self

    def update(self, payload):
        self._operation = "update"
        self._update_payload = payload
        return self

    def insert(self, payload):
        self._operation = "insert"
        self._insert_payload = payload
        return self

    def eq(self, field, value):
        self._filters.append(("eq", field, value))
        return self

    def in_(self, field, values):
        self._filters.append(("in", field, values))
        return self

    def gte(self, field, value):
        self._filters.append(("gte", field, value))
        return self

    def lte(self, field, value):
        self._filters.append(("lte", field, value))
        return self

    def lt(self, field, value):
        self._filters.append(("lt", field, value))
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def single(self):
        return self

    def rpc(self, *_args, **_kwargs):
        return self

    def execute(self):
        if self._table == "system_config" and self._operation == "select":
            keys = None
            for op, field, value in self._filters:
                if op == "eq" and field == "config_key":
                    keys = [value]
                    break
                if op == "in" and field == "config_key":
                    keys = list(value)
                    break

            if keys is None:
                data = [
                    value.copy()
                    for value in self.system_config.values()
                ]
            else:
                data = [
                    self.system_config[key].copy()
                    for key in keys
                    if key in self.system_config
                ]

            return SimpleNamespace(data=data, count=len(data))

        if self._table == "system_config" and self._operation == "update":
            config_key = None
            for op, field, value in self._filters:
                if op == "eq" and field == "config_key":
                    config_key = value
                    break

            if config_key is not None:
                self.system_config[config_key]["config_value"] = self._update_payload["config_value"]

            row = {
                "config_key": config_key,
                "config_value": self.system_config.get(config_key, {}).get("config_value"),
                "value_type": self.system_config.get(config_key, {}).get("value_type"),
                "min_value": self.system_config.get(config_key, {}).get("min_value"),
                "max_value": self.system_config.get(config_key, {}).get("max_value"),
                "modified_by": self._update_payload.get("modified_by"),
                "modified_at": self._update_payload.get("modified_at"),
            }
            return SimpleNamespace(data=[row], count=1)

        if self._table == "audit_logs" and self._operation == "insert":
            self.audit_logs.append(self._insert_payload)
            return SimpleNamespace(data=[self._insert_payload], count=1)

        return SimpleNamespace(data=[], count=0)


@pytest.mark.asyncio
async def test_config_update_reaches_rss_classification_and_audit_logs(monkeypatch):
    fake_supabase = FakeSupabase()

    # Route all backend config + audit writes through the same fake store.
    monkeypatch.setattr(admin_api, "supabase", fake_supabase)
    monkeypatch.setattr(config_manager_module, "supabase", fake_supabase)
    monkeypatch.setattr(rbac, "supabase", fake_supabase)
    monkeypatch.setattr(ConfigManager, "_redis_client", None)

    # Avoid incidental external side effects.
    monkeypatch.setattr(admin_api.ActivityLogger, "log_config_change", AsyncMock(return_value=None))

    current_user = SimpleNamespace(
        user_id="admin-1",
        email="admin@example.com",
        role=SimpleNamespace(value="master_admin"),
    )
    request = SimpleNamespace(
        headers={"User-Agent": "pytest"},
        client=SimpleNamespace(host="127.0.0.1"),
    )

    # 1) Update config via the real backend endpoint logic.
    update_request = admin_api.UpdateSystemConfigRequest(config_value="0.85")
    response = await admin_api.update_system_config(
        config_key="confidence_threshold_rss",
        config_update=update_request,
        request=request,
        current_user=current_user,
    )

    assert response["config_key"] == "confidence_threshold_rss"
    assert response["config_value"] == "0.85"
    assert fake_supabase.system_config["confidence_threshold_rss"]["config_value"] == "0.85"
    assert len(fake_supabase.audit_logs) == 1
    assert fake_supabase.audit_logs[0]["event_type"] == "SYSTEM_CONFIG_UPDATED"

    # 2) Run one RSS processing pass and prove the updated threshold is applied.
    processor = RSSProcessorEnhanced(classification_threshold=0.5)
    processor.set_feeds(["https://example.com/feed.xml"])

    fake_entry = {
        "title": "Flooding reported in Manila after heavy rain",
        "summary": "Flooding was reported across several districts in Manila.",
        "link": "https://example.com/article-1",
        "published": "2026-04-30T01:00:00+08:00",
    }
    fake_feed = SimpleNamespace(bozo=False, entries=[fake_entry])

    classification_thresholds = []

    def fake_classify(text, threshold):
        classification_thresholds.append(threshold)
        return {"is_hazard": True, "hazard_type": "flooding", "score": 0.91}

    monkeypatch.setattr("backend.python.pipeline.rss_processor_enhanced.feedparser.parse", lambda _url: fake_feed)
    monkeypatch.setattr("backend.python.pipeline.rss_processor_enhanced.classifier.classify", fake_classify)
    monkeypatch.setattr(
        "backend.python.pipeline.rss_processor_enhanced.geo_ner.extract_locations",
        lambda _text: [
            {
                "latitude": 14.5995,
                "longitude": 120.9842,
                "location_name": "Manila",
                "region": "NCR",
                "province": "Metro Manila",
                "city": "Manila",
            }
        ],
    )
    monkeypatch.setattr(RSSProcessorEnhanced, "_check_duplicate", AsyncMock(return_value=(False, None)))
    monkeypatch.setattr(RSSProcessorEnhanced, "_save_hazard_to_db", AsyncMock(return_value="hazard-1"))

    results = await processor.process_all_feeds()

    assert len(results) == 1
    assert results[0]["status"] == "success"
    assert classification_thresholds == [0.85]
