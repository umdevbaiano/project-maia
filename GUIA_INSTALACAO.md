# 🚀 Guia de Instalação do VettaLaw MVP

## Passo 1: Download do Projeto

**Link para Download:**
```
https://dede3phc22dgx.cloudfront.net/creao2/3932ea59-bcbe-4d82-ab0d-240e65df5f61/182193b0-60d1-701d-7102-0b198bb91867/08fa1d36-e071-4254-9180-6c95e70e7249/vettalaw-mvp.tar.gz
```

## Passo 2: Extrair o Arquivo

### No Linux/Mac:
```bash
tar -xzf vettalaw-mvp.tar.gz
cd vettalaw
```

### No Windows:
1. Use o 7-Zip ou WinRAR para extrair o arquivo `.tar.gz`
2. Abra o terminal no diretório extraído

## Passo 3: Obter Chave da API do Google Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

## Passo 4: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env a partir do exemplo
cp .env.example .env

# Editar o arquivo .env (use seu editor preferido)
nano .env
# ou
code .env
# ou
notepad .env  # Windows
```

Adicione sua chave da API:
```
GEMINI_API_KEY=sua_chave_aqui_substituir
```

## Passo 5: Instalar Docker (se ainda não tiver)

### Windows:
1. Baixe: https://www.docker.com/products/docker-desktop
2. Instale o Docker Desktop
3. Inicie o Docker Desktop

### Mac:
```bash
brew install --cask docker
```
Ou baixe: https://www.docker.com/products/docker-desktop

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

## Passo 6: Iniciar o Projeto

### Opção A: Usando o Script Automático (Recomendado)
```bash
./start.sh
```

### Opção B: Manualmente
```bash
docker-compose up -d
```

## Passo 7: Acessar a Aplicação

Aguarde cerca de 30 segundos para todos os serviços iniciarem, então acesse:

- **Frontend (Interface)**: http://localhost:5173
- **Backend (API)**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs

## 📋 Verificar se Está Funcionando

1. Abra http://localhost:5173 no navegador
2. Você verá o Dashboard do VettaLaw
3. Clique no botão azul pulsante no canto inferior direito (ChatWidget)
4. Digite uma pergunta jurídica, por exemplo: "Qual o prazo para contestação?"
5. A Maia (IA) deve responder

## 🐛 Solução de Problemas

### Erro: "Docker não está rodando"
**Solução**: Inicie o Docker Desktop e tente novamente

### Erro: "Porta já em uso"
**Solução**: Verifique se não há outras aplicações usando as portas 5173, 8000 ou 27017
```bash
# Linux/Mac
lsof -i :5173
lsof -i :8000
lsof -i :27017

# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :8000
netstat -ano | findstr :27017
```

### Erro: "AI not configured"
**Solução**: Verifique se adicionou a `GEMINI_API_KEY` no arquivo `.env`
```bash
# Verificar configuração
cat .env

# Reiniciar containers
docker-compose down
docker-compose up -d
```

### Frontend não carrega ou mostra erro
**Solução**: Aguarde mais tempo (pode levar até 1-2 minutos) ou verifique os logs
```bash
docker-compose logs frontend
```

### Backend não responde
**Solução**: Verifique os logs do backend
```bash
docker-compose logs backend
```

## 🔍 Comandos Úteis

### Ver status dos containers
```bash
docker-compose ps
```

### Ver logs em tempo real
```bash
docker-compose logs -f
```

### Parar todos os serviços
```bash
docker-compose down
```

### Reiniciar tudo
```bash
docker-compose restart
```

### Limpar tudo (incluindo dados do MongoDB)
```bash
docker-compose down -v
```

## 💻 Desenvolvimento Local (Sem Docker)

Se preferir rodar sem Docker:

### Backend:
```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure as variáveis de ambiente
export MONGODB_URL="mongodb://localhost:27017"
export GEMINI_API_KEY="sua_chave_aqui"

# Instale o MongoDB localmente primeiro
# https://www.mongodb.com/try/download/community

# Inicie o servidor
uvicorn main:app --reload
```

### Frontend:
```bash
cd client
npm install
npm run dev
```

## 🎯 Próximos Passos

1. **Explore o Dashboard**: Veja os KPIs, gráficos e prazos
2. **Teste a Maia**: Use tanto o widget flutuante quanto a página full
3. **Navegue pelas páginas**: Dashboard, Chat, Clientes, Documentos
4. **Leia a documentação**: Abra http://localhost:8000/docs para ver a API

## 📚 Estrutura do Projeto

```
vettalaw/
├── server/           # Backend Python (FastAPI)
├── client/           # Frontend React (TypeScript)
├── docker-compose.yml
├── start.sh         # Script de inicialização
└── README.md        # Documentação completa
```

## 🆘 Precisa de Ajuda?

1. Verifique o arquivo `README.md` para documentação completa
2. Leia o `PROJECT_SUMMARY.md` para detalhes técnicos
3. Veja os logs dos containers: `docker-compose logs -f`

---

**Pronto para começar! 🎉**

Após seguir estes passos, você terá o VettaLaw rodando localmente em sua máquina.
