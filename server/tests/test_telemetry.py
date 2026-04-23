"""
Maia Platform — Telemetry & Billing Tests
"""
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from mongomock_motor import AsyncMongoMockClient

from services.saas_service import record_ai_telemetry
from services.auth_service import WORKSPACES_COLLECTION
from bson import ObjectId

@pytest.fixture
def mock_db():
    client = AsyncMongoMockClient()
    return client.get_database("maia_test")

@pytest.mark.asyncio
async def test_billing_telemetry_accuracy(mock_db):
    """
    Verifica se a gravação de entrada e saída crua do modelo
    acionada pelo callback de billing resulta num cálculo total e update no DB correto.
    """
    workspace_id = str(ObjectId())
    
    # Insert dummy workspace
    await mock_db[WORKSPACES_COLLECTION].insert_one({
        "_id": ObjectId(workspace_id),
        "billing_tokens_used": 0
    })

    # Call recording
    await record_ai_telemetry(mock_db, workspace_id, input_tokens=400, output_tokens=150, route="chat_stream")

    # Verify Telemetry Log
    log = await mock_db["ai_telemetry"].find_one({"workspace_id": workspace_id})
    assert log is not None
    assert log["input_tokens"] == 400
    assert log["output_tokens"] == 150
    assert log["total_tokens"] == 550
    assert log["route"] == "chat_stream"

    # Verify Workspace Fast-aggregation update
    workspace = await mock_db[WORKSPACES_COLLECTION].find_one({"_id": ObjectId(workspace_id)})
    assert workspace["billing_tokens_used"] == 550
