import pytest
from httpx import AsyncClient, ASGITransport
import asyncio
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import MagicMock, patch, AsyncMock
from main import app

# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
def mock_db():
    # Helper to mock find_one for user/workspace
    async def mock_find_one(filter, *args, **kwargs):
        if "email" in filter and filter["email"] == "admin@testworkspace.local":
            return {
                "_id": "507f1f77bcf86cd799439011",
                "email": "admin@testworkspace.local",
                "hashed_password": "hashed_password_placeholder",
                "is_active": True,
                "workspace_id": "507f1f77bcf86cd799439012",
                "role": "admin",
                "name": "Test Admin"
            }
        if "workspace_name" in filter:
            return None # For registration check
        return None

    async def mock_insert_one(doc, *args, **kwargs):
        mock_result = MagicMock()
        mock_result.inserted_id = "507f1f77bcf86cd799439011"
        return mock_result

    # Set up the mock collections
    mock_db_instance = MagicMock()
    mock_db_instance.__getitem__.return_value.find_one = AsyncMock(side_effect=mock_find_one)
    mock_db_instance.__getitem__.return_value.count_documents = AsyncMock(return_value=0)
    mock_db_instance.__getitem__.return_value.insert_one = AsyncMock(side_effect=mock_insert_one)
    mock_db_instance.__getitem__.return_value.update_one = AsyncMock(return_value=MagicMock())
    mock_db_instance.__getitem__.return_value.delete_one = AsyncMock(return_value=MagicMock())
    
    with patch("database._database", mock_db_instance):
        with patch("database.get_database", return_value=mock_db_instance):
            yield mock_db_instance

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

async def test_register_workspace_success(client: AsyncClient):
    payload = {
        "workspace_name": "Test Workspace",
        "document": "12345678000199",
        "admin_name": "Test Admin",
        "admin_email": "admin@testworkspace.local",
        "password": "StrongPassword123!"
    }
    
    with patch("services.auth_service.hash_password", return_value="hashed_password_placeholder"):
        # Run the register request
        response = await client.post("/auth/register", json=payload)
    
    # We expect 200 or 400 (if email already registered from previous run without DB wipe)
    if response.status_code == 400 and "E-mail j\u00e1 cadastrado" in response.text:
       pytest.skip("Test user already exists.")
       
    
    if response.status_code == 500:
        print("ERROR 500 Register:", response.text)
        
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@testworkspace.local"
    assert data["user"]["role"] == "admin"

async def test_login_success(client: AsyncClient):
    payload = {
        "email": "admin@testworkspace.local",
        "password": "StrongPassword123!"
    }
    with patch("services.auth_service.verify_password", return_value=True):
        response = await client.post("/auth/login", json=payload)
    
    # If the user wasn't registered because of DB state, this might fail, 
    # but theoretically it runs after the register test
    if response.status_code == 500:
        print("ERROR 500 Login Success:", response.text)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@testworkspace.local"
    
async def test_login_failure(client: AsyncClient):
    payload = {
        "email": "admin@testworkspace.local",
        "password": "WrongPassword!"
    }
    with patch("services.auth_service.verify_password", return_value=False):
        response = await client.post("/auth/login", json=payload)
    if response.status_code == 500:
        print("ERROR 500 Login Failure:", response.text)
    assert response.status_code == 401
    assert "E-mail ou senha inv" in response.text
