"""
Maia Platform — Hardware Stress Tester (Vault Edge)
Runs a simulated load of lawyers generating drafts/retrievals via RAG Websocket or API.
Target: Determine if 1x RTX 4060 Ti handles N concurrent streams under 15s.
"""
import time
import json
from locust import HttpUser, task, between, events

class LawyerUser(HttpUser):
    wait_time = between(2, 5) # Segundos entre cliques

    def on_start(self):
        """Mock the auth token in headers if required by FastAPI."""
        self.client.headers.update({"Authorization": "Bearer TEST_TOKEN_ENV"})
        
    @task
    def execute_rag_retrieval(self):
        """Simula o advogado perguntando na interface de chat e esperando RAG + LLM Stream."""
        start_time = time.time()
        
        # Hit full payload route (assumes /api/v1/chat/quick is available for non-streamed test or we can HTTP test it)
        # To strictly test streaming, we would need to mock the WS or read the Stream Response chunks in Locust.
        payload = {
            "currentMessage": "Com base nos autos, resuma a situação do cliente.",
            "caso_id": "mock_caso_id"
        }
        
        with self.client.post("/api/v1/chat/quick", json=payload, catch_response=True) as response:
            total_time = time.time() - start_time
            
            if response.status_code == 200:
                # O threshold do Arquitetura estabelece latências pesadas em Vetta Vault
                if total_time > 15.0:
                    response.failure(f"❌ LLM Demorou muito! ({total_time:.2f}s). Gargalo de VRAM ou Inferência.")
                else:
                    response.success()
            else:
                response.failure(f"HTTP ERROR {response.status_code}")

    # Outras rotas menores (Dashboards, Listagens, Oauth...)
    @task(3)
    def load_dashboard(self):
        self.client.get("/api/v1/casos/")
