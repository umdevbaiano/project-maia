"""
Maia Platform — SaaS Configuration
Hardcoded limits and definitions for Workspace Tiers.
"""

SAAS_PLANS = {
    "basic": {
        "max_users": 3,
        "max_ai_calls": 20,
        "max_storage_mb": 500,
        "name": "Plano Básico"
    },
    "pro": {
        "max_users": 10,
        "max_ai_calls": 200,
        "max_storage_mb": 5000,
        "name": "Plano Pro"
    },
    "enterprise": {
        "max_users": 999999,
        "max_ai_calls": 999999,
        "max_storage_mb": 50000,
        "name": "Plano Enterprise"
    }
}

def get_plan_limits(plan_id: str) -> dict:
    return SAAS_PLANS.get(plan_id, SAAS_PLANS["basic"])
