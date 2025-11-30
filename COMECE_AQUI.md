# 🚀 COMECE AQUI - SaaS MultiLeads

## ⚡ 3 Passos para Executar

### 1️⃣ Backend (Terminal 1)
```bash
cd backend
npm install
npm run prisma:migrate dev --name init
npm run seed
npm run dev
```
✅ Servidor rodando em: **http://localhost:3001**

### 2️⃣ Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
✅ Front-end rodando em: **http://localhost:3000**

### 3️⃣ Acesse no Navegador
```
http://localhost:3000
```

## 🔐 Credenciais de Teste

```
👤 Admin
  Email: admin@example.com
  Senha: admin123

🏢 Empresa
  Email: empresa@example.com
  Senha: empresa123
```

## 📱 O Que Você Pode Fazer

### Como Admin
1. Faça login com credenciais acima
2. Veja o dashboard com estatísticas
3. Crie uma nova empresa
4. Visualize todos os clientes

### Como Empresa
1. Faça login com credenciais acima
2. Crie um novo produto
3. Faça upload de logo e banner
4. Copie o link de cadastro do cliente
5. Visualize os clientes cadastrados

### Como Cliente
1. Acesse o link de cadastro do produto
2. **Veja a logo e banner do produto** ⭐
3. Valide seu telefone (qualquer código com 6 dígitos)
4. Preencha o formulário completo
5. Clique em "Salvar"

## 📊 Exemplo de Fluxo Completo

```
1. Acesse http://localhost:3000
   ↓
2. Clique "Entrar como Admin"
   ↓
3. Login: admin@example.com / admin123
   ↓
4. Crie uma empresa (clique "+ Nova Empresa")
   ↓
5. Volte e acesse "Entrar como Empresa"
   ↓
6. Login: empresa@example.com / empresa123
   ↓
7. Clique "+ Novo Produto"
   ↓
8. Preencha Nome e URL
   ↓
9. Faça upload de Logo (PNG/JPG) e Banner (PNG/JPG)
   ↓
10. Clique "Copiar Link"
    ↓
11. Abra o link em nova aba
    ↓
12. VER LOGO E BANNER NO TOPO! ⭐
    ↓
13. Preencha o cadastro completo
    ↓
14. Valide o telefone
    ↓
15. Clique "Salvar"
    ↓
16. Redirecionado para URL configurada ✅
```

## 🎨 Tela Especial: Cadastro com Logo e Banner

```
┌─────────────────────────────────────┐
│         [LOGO DO PRODUTO]           │ ← Visível no topo
│                                     │
│  ┌───────────────────────────────┐  │
│  │   BANNER DO PRODUTO           │  │ ← Visível logo abaixo
│  │   (Responsivo, com bordas)    │  │
│  └───────────────────────────────┘  │
│                                     │
│  Formulário de Cadastro             │
│  ┌─────────────────────────────────┐│
│  │ Nome: ______________________   ││
│  │ Data Nascimento: ____________  ││
│  │ Telefone: ______  [Validar]    ││
│  │ Estado: _____  Cidade: _____   ││
│  │ Email: ______________________  ││
│  │ CNPJ: _______________________  ││
│  │ ☐ Aceito a política           ││
│  │                   [Salvar]     ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 🔧 Troubleshooting Rápido

### Erro: "Cannot find module express"
```bash
npm install
```

### Erro: "Port 3001 already in use"
```bash
# Mude a porta no .env
PORT=3002
```

### Erro: "Cannot connect to database"
Verifique se PostgreSQL está rodando:
```bash
# macOS
brew services list | grep postgres

# Linux
sudo systemctl status postgresql
```

### Erro ao fazer upload de arquivo
Crie a pasta:
```bash
mkdir -p backend/uploads/{logos,banners}
```

## 📚 Documentação Completa

- **SETUP.md** - Setup detalhado passo a passo
- **API.md** - Todos os endpoints com exemplos CURL
- **README.md** - Arquitetura e visão geral
- **DEPLOY.md** - Como colocar em produção

## 🐳 Alternativa: Usar Docker

```bash
docker-compose up -d
```

Todos os serviços (PostgreSQL, Backend, Frontend) rodando em containers.

## ✨ Você está pronto!

Tudo que você precisa está funcionando. 

**Próximo passo:** Comece a testar! 🎉

---

**Desenvolvido com ❤️ para SaaS MultiLeads**
