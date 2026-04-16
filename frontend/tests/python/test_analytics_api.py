from datetime import datetime, timedelta
import os
import sys
from types import SimpleNamespace

import pytest

# Add project root and backend/python so backend package and lib.* imports both resolve.
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
BACKEND_PY = os.path.join(PROJECT_ROOT, "backend", "python")
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, BACKEND_PY)

from backend.python import analytics_api


class _FakeQuery:
    def __init__(self, rows, count=None):
        self._rows = rows
        self.count = count

    def select(self, *_args, **kwargs):
        if kwargs.get("count") == "exact":
            return _FakeQuery(self._rows, count=len(self._rows))
        return self

    def gte(self, *_args, **_kwargs):
        return self

    def lte(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=self._rows, count=self.count)


class _FakeSupabase:
    def __init__(self, hazards):
        self.hazards = hazards

    def schema(self, *_args, **_kwargs):
        return self

    def from_(self, table):
        if table == "hazards":
            return _FakeQuery(self.hazards)
        return _FakeQuery([])

    def rpc(self, *_args, **_kwargs):
        # Simulate missing RPC in schema cache to exercise fallback path.
        raise Exception({
            "code": "PGRST202",
            "message": "Could not find the function gaia.get_source_breakdown",
            "details": "schema cache miss",
        })


@pytest.mark.asyncio
async def test_trends_include_current_day(monkeypatch):
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    
    monkeypatch.setattr(
        analytics_api,
        "supabase",
        _FakeSupabase(
            hazards=[
                {
                    "hazard_type": "flood",
                    "detected_at": (now - timedelta(hours=1)).isoformat(),
                    "source_type": "rss",
                }
            ]
        ),
    )

    async def passthrough(_key, fn, ttl=None):  # noqa: ARG001
        return await fn()

    monkeypatch.setattr(analytics_api, "get_or_set", passthrough)
    
    trends = await analytics_api.get_hazard_trends(days=7)
    
    assert len(trends) == 7
    assert trends[-1].date == today


@pytest.mark.asyncio
async def test_source_breakdown_returns_counts_and_percentages(monkeypatch):
    hazards = [
        {"source_type": "rss"},
        {"source_type": "rss"},
        {"source_type": "citizen_report"},
    ]

    monkeypatch.setattr(analytics_api, "supabase", _FakeSupabase(hazards=hazards))

    async def passthrough(_key, fn, ttl=None):  # noqa: ARG001
        return await fn()

    monkeypatch.setattr(analytics_api, "get_or_set", passthrough)

    breakdown = await analytics_api.get_source_breakdown()
    summary = {item.source_type: item for item in breakdown}

    assert summary["rss"].count == 2
    assert summary["citizen_report"].count == 1
    
    # Verify percentages (2 rss out of 3 total = 66.67%, 1 citizen out of 3 = 33.33%)
    assert abs(summary["rss"].percentage - 66.67) < 0.1
    assert abs(summary["citizen_report"].percentage - 33.33) < 0.1