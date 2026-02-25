import pytest
from httpx import AsyncClient, ASGITransport
import asyncio
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import connect_db, disconnect_db

# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(autouse=True)
async def setup_db():
    await connect_db()
    yield
    await disconnect_db()

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
    response = await client.post("/auth/login", json=payload)
    if response.status_code == 500:
        print("ERROR 500 Login Failure:", response.text)
    assert response.status_code == 401
    assert "E-mail ou senha inv" in response.text
