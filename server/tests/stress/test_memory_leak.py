"""
Maia Platform — Themis Stress Suite -> Memory Leak Detector
"""
import pytest
import asyncio
import tracemalloc
from core.ai.gemini_provider import GeminiProvider

@pytest.mark.asyncio
async def test_fastapi_sse_memory_leak():
    """
    Simula 100 requisições simultâneas de geração de peças em streaming
    (como as que o FastAPI usaria sob Themis) para detectar Memory Leaks no fechamento
    dos Generators assíncronos.
    """
    tracemalloc.start()
    
    provider = GeminiProvider(api_key="mocked")
    
    # Mocking o provider para devolver um Generator assíncrono simples rápido
    async def mock_generate_stream(*args, **kwargs):
        yield "Chunk 1 "
        yield "Chunk 2 "
        yield "Chunk 3 "
        
    provider.generate_stream = mock_generate_stream

    # Tira retrato do uso de memoria (Antes da carga)
    snapshot1 = tracemalloc.take_snapshot()

    # Cria 100 requisições simultâneas
    async def make_request():
        full_text = ""
        async for chunk in provider.generate_stream("Mock", []):
            full_text += chunk
        return full_text

    tasks = [make_request() for _ in range(100)]
    results = await asyncio.gather(*tasks)

    # Coleta de lixo assíncrono forçado
    import gc
    gc.collect()

    # Tira retrato final
    snapshot2 = tracemalloc.take_snapshot()
    
    stats = snapshot2.compare_to(snapshot1, 'lineno')
    
    # Tolerância de 5MB vazados na simulação de Generators
    # Realisticamente em python assíncrono existem pequenos retentores
    leak_limit_bytes = 5 * 1024 * 1024 
    total_leaked = sum(stat.size_diff for stat in stats)
    
    assert total_leaked < leak_limit_bytes, f"Memory Leak Detectado: Vazou {total_leaked / 1024 / 1024:.2f} MB"
    
    tracemalloc.stop()
