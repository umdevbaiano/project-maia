import os
import httpx
import logging
import base64
from .base import SignatureProviderBase

logger = logging.getLogger(__name__)

class ClicksignProvider(SignatureProviderBase):
    """
    Clicksign API implementation for digital signatures.
    Requires CLICKSIGN_API_KEY and CLICKSIGN_URL in .env
    """

    def __init__(self):
        self.api_key = os.getenv("CLICKSIGN_API_KEY", "")
        self.base_url = os.getenv("CLICKSIGN_URL", "https://sandbox.clicksign.com").rstrip("/")
        
    async def create_envelope(self, document_base64: str, document_name: str, signers: list[dict]) -> dict:
        """
        Creates a document and adds signers on Clicksign.
        """
        if not self.api_key:
            logger.error("CLICKSIGN_API_KEY not found. Falling back to mock behavior.")
            return {"envelope_id": "mock_id", "signature_url": "https://clicksign.com/mock"}

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        params = {"access_token": self.api_key}

        try:
            async with httpx.AsyncClient() as client:
                # 1. Upload Document
                doc_payload = {
                    "document": {
                        "path": f"/{document_name}.pdf",
                        "content_base64": f"data:application/pdf;base64,{document_base64}",
                        "deadline_at": None,
                        "auto_close": True,
                        "locale": "pt-BR"
                    }
                }
                
                doc_resp = await client.post(
                    f"{self.base_url}/api/v1/documents", 
                    json=doc_payload, 
                    params=params, 
                    headers=headers
                )
                
                if doc_resp.status_code != 201:
                    logger.error(f"Clicksign Doc Error: {doc_resp.text}")
                    raise Exception(f"Clicksign Doc Error: {doc_resp.status_code}")

                doc_data = doc_resp.json()["document"]
                document_key = doc_data["key"]

                # 2. Add Signers
                signature_url = ""
                for s in signers:
                    signer_payload = {
                        "signer": {
                            "email": s["email"],
                            "auth_group": "email",
                            "name": s["name"],
                            "delivery": "email"
                        }
                    }
                    
                    signer_resp = await client.post(
                        f"{self.base_url}/api/v1/signers",
                        json=signer_payload,
                        params=params,
                        headers=headers
                    )
                    
                    if signer_resp.status_code == 201:
                        signer_key = signer_resp.json()["signer"]["key"]
                        
                        # 3. List Signer to Document
                        list_payload = {
                            "list": {
                                "document_key": document_key,
                                "signer_key": signer_key,
                                "sign_as": "witness" if "testemunha" in s["name"].lower() else "party"
                            }
                        }
                        
                        list_resp = await client.post(
                            f"{self.base_url}/api/v1/lists",
                            json=list_payload,
                            params=params,
                            headers=headers
                        )
                        
                        if list_resp.status_code == 201:
                            # In Clicksign, we usually get a specific URL for each signer
                            # For simplicity, we'll return the general doc link or the first signer link
                            signature_url = f"https://app.clicksign.com/documents/{document_key}"

                return {
                    "envelope_id": document_key,
                    "signature_url": signature_url
                }

        except Exception as e:
            logger.error(f"Clicksign Integration Error: {str(e)}")
            raise e

    async def check_status(self, envelope_id: str) -> str:
        """
        Check document status on Clicksign.
        """
        if not self.api_key:
            return "pending"

        params = {"access_token": self.api_key}
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/api/v1/documents/{envelope_id}", 
                params=params
            )
            if resp.status_code == 200:
                status = resp.json()["document"]["status"]
                # Clicksign statuses: draft, running, closed, canceled
                mapping = {"running": "pending", "closed": "signed", "canceled": "rejected"}
                return mapping.get(status, "pending")
            
            return "pending"
