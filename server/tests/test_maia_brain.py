import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from core.ai.gemini_provider import GeminiProvider

@pytest.mark.asyncio
async def test_maia_brain_anti_hallucination_instruction():
    """Verify that the GeminiProvider uses the refined system prompt."""
    provider = GeminiProvider(api_key="mock_key")
    
    with patch("google.generativeai.GenerativeModel") as mock_model:
        mock_instance = mock_model.return_value
        # generate_content is a synchronous method in the SDK (we call it via to_thread)
        mock_instance.generate_content = MagicMock()
        mock_instance.generate_content.return_value.text = "Resposta simulada da Maia."
        provider._model = mock_instance  # Ensure provider uses the mock

        # Test basic generation
        prompt = "Qual o prazo para apelação no CPC?"
        await provider.generate(prompt)

        # Check if the prompt sent...
        mock_instance.generate_content.assert_called_once()
        args, _ = mock_instance.generate_content.call_args
        full_prompt = args[0]
        
        assert "vício absoluto pela verdade" in full_prompt
        assert "PROTOCOLO DE CONFIABILIDADE" in full_prompt
        assert "HIERARQUIA DE REFERÊNCIA" in full_prompt

@pytest.mark.asyncio
async def test_maia_brain_search_fallback():
    """Verify that web search is triggered when RAG returns no results."""
    provider = GeminiProvider(api_key="mock_key")
    
    with patch("core.ai.gemini_provider.search_legal_web", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [{"title": "STF - Prazo PJE", "url": "http://stf.jus.br", "content": "O prazo é 15 dias."}]
        
        with patch("google.generativeai.GenerativeModel") as mock_model:
            mock_instance = mock_model.return_value
            mock_instance.generate_content = MagicMock()
            mock_instance.generate_content.return_value.text = "Baseado na pesquisa, o prazo é 15 dias."
            provider._model = mock_instance

            # Simple prompt (more than 3 words to trigger search)
            prompt = "Quais as novidades sobre o ICMS no STF hoje?"
            await provider.generate(prompt, rag_context=[], legal_context=[])

            # Verify search was called
            mock_search.assert_called_once_with(prompt)
            
            # Verify results were injected into the prompt
            args, _ = mock_instance.generate_content.call_args
            full_prompt = args[0]
            assert "RESULTADOS DA PESQUISA WEB" in full_prompt
            assert "stf.jus.br" in full_prompt
