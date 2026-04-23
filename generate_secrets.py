import secrets
import string
import os

def generate_secure_token(length=64):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

def generate_mongodb_password(length=32):
    # MongoDB passwords shouldn't have weird characters that break URLs easily
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

def create_env_file():
    print("🔐 Vetta Vault - Secure Environment Generator")
    print("Gerando chaves criptográficas de entropia militar...\n")
    
    jwt_secret = generate_secure_token(64)
    encryption_key = generate_secure_token(64) # Typically Fernandes/Fernet uses base64, but 64-char string is good for raw keys
    mongo_pass = generate_mongodb_password(24)
    
    # Check if user needs to input API Key manually or not
    gemini_key = input("Qual a sua GEMINI_API_KEY? (Pressione Enter para pular e preencher depois manualmente): ").strip()
    
    env_content = f"""# ========================================================= #
# CONFIGURAÇÃO DE PRODUÇÃO: MAIA PLATFORM (VETTA HUB)
# ========================================================= #

# [SECURITY & TOKENS]
JWT_SECRET={jwt_secret}
ENCRYPTION_KEY={encryption_key}
GEMINI_API_KEY={gemini_key if gemini_key else 'INSIRA_SUA_CHAVE_AQUI'}

# [DATABASE CONFIG]
MONGO_USER=maia_admin
MONGO_PASSWORD={mongo_pass}
MONGODB_URL=mongodb://maia_admin:{mongo_pass}@mongodb:27017/vettalaw?authSource=admin

# [SYSTEM CONFIG]
VITE_API_URL=https://maia.vettahub.com.br
CHROMA_URL=http://chromadb:8000
"""

    with open(".env.production", "w", encoding="utf-8") as f:
        f.write(env_content)
        
    print("✅ Sucesso! O arquivo '.env.production' foi gerado no diretório atual.")
    print("⚠️  AVISO LEGAL: Guarde o valor de ENCRYPTION_KEY com extrema cautela.")
    print("   Se você perder a ENCRYPTION_KEY, os dados criptografados no MongoDB ficarão permanentemente ilegíveis.\n")

if __name__ == "__main__":
    create_env_file()
