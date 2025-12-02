"""
Backend API Module for GAIA
Proxy layer for secure database access without exposing Supabase credentials to frontend

Security Implementation: PATCH-1 (Critical Security Fixes)
- All database access goes through FastAPI backend
- Supabase credentials never exposed to frontend
- Comprehensive request/response logging
- RBAC enforcement on all endpoints
"""

__all__ = ["hazards", "public", "realtime"]
