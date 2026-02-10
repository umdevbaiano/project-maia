# VettaLaw - Plataforma Jurídica SaaS MVP

VettaLaw é uma plataforma jurídica SaaS moderna, integrada com IA generativa (Maia), projetada para aumentar a produtividade de advogados e escritórios de advocacia.

## 🎯 Características Principais

- **Dashboard Inteligente**: Visão geral de processos, prazos e KPIs
- **Maia AI Assistant**: Assistente jurídica com Google Gemini
  - Widget flutuante para consultas rápidas
  - Interface full-page para trabalho profundo
- **Dark Mode Profissional**: UI/UX otimizada para produtividade
- **Histórico Persistente**: Todas as conversas são salvas no MongoDB

## 🛠️ Tech Stack

### Frontend
- **React 18** com TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **React Router DOM** (routing)
- **React Markdown** (renderização de conteúdo)
- **Lucide React** (ícones)
- **Axios** (HTTP client)

### Backend
- **FastAPI** (Python web framework)
- **Motor** (MongoDB async driver)
- **Google Gemini API** (IA generativa)
- **Uvicorn** (ASGI server)

### Database
- **MongoDB** (NoSQL database)

### DevOps
- **Docker** & **Docker Compose**

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Google Gemini API Key ([obter aqui](https://makersuite.google.com/app/apikey))

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone <repository-url>
cd vettalaw
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave da API do Google Gemini:

```
GEMINI_API_KEY=sua_chave_api_aqui
```

### 3. Inicie os containers Docker

```bash
docker-compose up -d
```

Este comando irá:
- Iniciar o MongoDB na porta 27017
- Iniciar o backend FastAPI na porta 8000
- Iniciar o frontend React na porta 5173

### 4. Acesse a aplicação

Abra seu navegador e acesse:

```
http://localhost:5173
```

## 📁 Estrutura do Projeto

```
vettalaw/
├── server/                 # Backend (FastAPI)
│   ├── main.py            # API principal
│   ├── requirements.txt   # Dependências Python
│   ├── Dockerfile
│   └── .env.example
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   │   ├── Layout.tsx
│   │   │   └── ChatWidget.tsx
│   │   ├── pages/        # Páginas da aplicação
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── ClientesPage.tsx
│   │   │   ├── DocumentosPage.tsx
│   │   │   └── ConfiguracoesPage.tsx
│   │   ├── types/        # TypeScript types
│   │   │   └── chat.ts
│   │   ├── utils/        # Utilitários
│   │   │   └── api.ts
│   │   ├── App.tsx       # Componente principal
│   │   ├── main.tsx      # Entry point
│   │   └── index.css     # Estilos globais
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml     # Orquestração Docker
├── .env.example          # Variáveis de ambiente
└── README.md             # Este arquivo
```

## 🔌 API Endpoints

### Backend (http://localhost:8000)

- `GET /` - Health check
- `GET /chat/history` - Buscar histórico de mensagens
- `POST /chat/quick` - Enviar mensagem rápida
- `DELETE /chat/clear` - Limpar histórico

Exemplo de requisição:

```bash
# Enviar mensagem
curl -X POST http://localhost:8000/chat/quick \
  -H "Content-Type: application/json" \
  -d '{"currentMessage": "Qual o prazo para contestação?"}'
```

## 🎨 Componentes Principais

### Layout (Layout.tsx)
- Sidebar fixa com navegação
- Menu: Dashboard, Maia Chat, Clientes, Documentos
- Rodapé: Configurações e Logout

### ChatWidget (ChatWidget.tsx)
- Assistente flutuante (bottom-right)
- Pop-up de 380x500px
- Histórico persistente
- Botão de expandir para full-page

### DashboardPage (DashboardPage.tsx)
- KPI Cards: Processos, Prazos, Clientes, Taxa de Sucesso
- Gráfico de evolução de casos
- Lista de prazos urgentes
- Atividade recente

### ChatPage (ChatPage.tsx)
- Interface full-page estilo ChatGPT
- Renderização de Markdown
- Input flutuante centralizado
- Histórico completo de conversas

## 🧪 Desenvolvimento Local (sem Docker)

### Backend

```bash
cd server
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure MONGODB_URL e GEMINI_API_KEY
export MONGODB_URL="mongodb://localhost:27017"
export GEMINI_API_KEY="sua_chave_aqui"

# Inicie o servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## 🔧 Configuração Adicional

### Variáveis de Ambiente

#### Backend (.env ou variáveis de sistema)
- `MONGODB_URL`: URL do MongoDB (padrão: `mongodb://mongodb:27017`)
- `GEMINI_API_KEY`: Chave da API do Google Gemini (obrigatório)

#### Frontend
- `VITE_API_URL`: URL do backend (padrão: `http://localhost:8000`)

## 📝 Roadmap / Próximas Funcionalidades

- [ ] Sistema de autenticação e autorização
- [ ] Gestão completa de clientes
- [ ] Gestão de documentos com upload
- [ ] Sistema de prazos com notificações
- [ ] Integração com APIs de tribunais
- [ ] Assinatura digital de documentos
- [ ] Relatórios e analytics avançados
- [ ] Modo colaborativo multi-usuário

## 🐛 Troubleshooting

### Problema: Backend não conecta ao MongoDB
**Solução**: Verifique se o container MongoDB está rodando:
```bash
docker ps
docker logs vettalaw-mongodb
```

### Problema: Frontend não consegue acessar a API
**Solução**: Verifique se o CORS está habilitado no backend e se a URL está correta

### Problema: IA não responde
**Solução**: Verifique se a `GEMINI_API_KEY` está configurada corretamente:
```bash
docker logs vettalaw-backend
```

## 📄 Licença

Este é um projeto MVP para fins acadêmicos e de demonstração.

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📧 Suporte

Para questões e suporte, abra uma issue no repositório.

---

## 👨‍💻 Autoria e Direitos

Este projeto foi idealizado e desenvolvido integralmente por **Samuel Miranda**.

* **Líder Técnico & Desenvolvedor Full Stack:** Samuel Miranda
* **Contato:** [LinkedIn](https://www.linkedin.com/in/samuellmiranda)
* **Status:** MVP (Produto Mínimo Viável) para fins acadêmicos e demonstrativos.

---

**© 2026 VettaLaw.** Todos os direitos reservados.
_A reprodução ou uso comercial deste código sem autorização expressa do autor é estritamente proibida._

---

**VettaLaw** - Transformando a prática jurídica com tecnologia e IA 🚀⚖️
