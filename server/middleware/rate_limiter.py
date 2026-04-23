import time
import logging
from fastapi import Request, HTTPException
import redis.asyncio as redis

logger = logging.getLogger(__name__)

# Instância global conectada ao start
redis_client: redis.Redis = None

def get_redis_client() -> redis.Redis:
    global redis_client
    if redis_client is None:
        # Usamos o banco 1 para não colidir com os hashes do DLP Proxy
        redis_client = redis.from_url("redis://maia-redis-dlp:6379/1", decode_responses=True)
    return redis_client

class RateLimiter:
    """
    Dependência de Rate Limiter (Camada L7) no FastAPI.
    Controla TPS (Transactions per Second) por Rota + ID do Usuário/Token.
    Ideal para proteger rotas pesadas de IA do abuso e drenagem financeira.
    """
    def __init__(self, requests: int, window_seconds: int):
        self.requests = requests
        self.window = window_seconds

    async def __call__(self, request: Request):
        try:
            client = get_redis_client()
            
            # Extrai o token JWT (Authorization Header) para ser o identificador do User-ID.
            # Se não houver, cai pro IP para evitar spoofing.
            auth_token = request.headers.get("Authorization")
            identifier = auth_token.split(" ")[1] if auth_token else request.client.host
            
            route = request.url.path
            key = f"rate_limit:{route}:{identifier}"
            
            current_time = time.time()
            window_start = current_time - self.window
            
            # Utilizamos Pipeline (Atomic) com ZSETs para o algoritmo "Sliding Window Log"
            async with client.pipeline(transaction=True) as pipe:
                # 1. Remove entradas fora da janela
                pipe.zremrangebyscore(key, 0, window_start)
                # 2. Conta os elementos na janela
                pipe.zcard(key)
                # 3. Adiciona a request atual
                pipe.zadd(key, {str(current_time): current_time})
                # 4. Renova a expiração da chave inteira
                pipe.expire(key, self.window)
                
                results = await pipe.execute()
                
            request_count = results[1]
            
            if request_count >= self.requests:
                raise HTTPException(
                    status_code=429, 
                    detail=f"Muitas requisições (Limite: {self.requests} a cada {self.window}s). Tente novamente mais tarde."
                )
        except redis.RedisError as e:
            # Em caso de falha do Redis, fail-open (deixa passar) para não derrubar a operação core
            logger.error(f"Falha no Redis Rate Limiter: {e}")
