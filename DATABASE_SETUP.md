# 🔗 Conectando ao Supabase

## ✅ Passo 1: Credenciais já estão configuradas

O arquivo `.env` já foi atualizado com:
```
SUPABASE_URL=https://bhmnvzhryfnucktsugsl.supabase.co
DATABASE_URL=postgresql://postgres:D30h70$!@db.bhmnvzhryfnucktsugsl.supabase.co:5432/postgres
```

## 📦 Passo 2: Instalar Dependências

```bash
cd backend
npm install
```

Isso instalará o cliente PostgreSQL (`pg`) necessário para conectar ao banco.

## 🗄️ Passo 3: Inicializar o Banco de Dados

Execute o script para criar todas as tabelas:

```bash
npm run db:init
```

Isso irá:
- ✅ Conectar ao Supabase
- ✅ Executar todo o arquivo `schema.sql`
- ✅ Criar todas as tabelas
- ✅ Criar índices para performance
- ✅ Criar views úteis
- ✅ Inserir dados de teste

## 🧪 Passo 4: Testar a Conexão

```bash
npm run db:test
```

Este script verifica:
- ✅ Se consegue conectar ao banco
- ✅ Quantas tabelas existem
- ✅ Lista todas as tabelas criadas
- ✅ Mostra dados de teste inseridos

## 📊 Esperado após inicialização:

```
✅ Conexão estabelecida com sucesso!
⏰ Horário do servidor: 2025-11-30 12:34:56...
📊 Tabelas no banco: 5

📋 Tabelas existentes:
  • admin
  • cliente
  • empresa
  • produto
  • verificacao

👤 Administradores: 1
```

## 🚀 Próximos Passos

### No Backend

Para usar o Supabase no seu backend, importe a classe `SupabaseService`:

```typescript
import { SupabaseService } from './services/SupabaseService';

// Exemplo: Login de admin
const admin = await SupabaseService.loginAdmin(
  'admin@example.com',
  'admin123'
);

// Exemplo: Criar empresa
const empresa = await SupabaseService.criarEmpresa({
  nome: 'Minha Empresa',
  email: 'empresa@test.com',
  senha: hashedPassword,
  cnpj: '12.345.678/0001-00',
  // ... outros campos
});
```

### No Frontend

Use o cliente Supabase para fazer queries:

```typescript
import { supabase } from '../config/supabase';

// Exemplo: Listar clientes
const { data, error } = await supabase
  .from('cliente')
  .select('*')
  .eq('verificado', true);
```

## 📚 Referências de Dados de Teste

### Admin
- Email: `admin@example.com`
- Senha: `admin123` (hash: `$2b$10$YIjlrLxJ7.7Z6e5VQm5J9uF5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5`)

### Empresa
- Email: `empresa@example.com`
- Senha: `empresa123` (hash: `$2b$10$YIjlrLxJ7.7Z6e5VQm5J9uF5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5`)
- CNPJ: `12.345.678/0001-00`

### Produto
- Nome: `Produto Demo`
- Empresa: `Empresa Demo`

## 🔧 Troubleshooting

### Erro: "password authentication failed"
```bash
# Verifique se a senha está correta
# Atualize em .env:
DATABASE_URL=postgresql://postgres:SENHA_CORRETA@db.bhmnvzhryfnucktsugsl.supabase.co:5432/postgres
```

### Erro: "ECONNREFUSED"
```bash
# Pode ser problema de SSL. Tente desabilitar:
# Na pasta backend, crie um arquivo .pgpass com:
db.bhmnvzhryfnucktsugsl.supabase.co:5432:postgres:postgres:D30h70$!
chmod 600 .pgpass
```

### Erro: "relation does not exist"
```bash
# Significa que as tabelas ainda não foram criadas
npm run db:init
```

### Erro: "Table already exists"
```bash
# Se receber este aviso ao executar db:init, é normal
# O schema usa ON CONFLICT DO NOTHING para evitar duplicatas
```

## 📝 Logs

Para ver logs detalhados durante a inicialização:

```bash
# Linux/Mac
DEBUG=* npm run db:init

# Windows
set DEBUG=* && npm run db:init
```

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- A senha está no `.env` - NUNCA commite este arquivo
- Use variáveis de ambiente em produção
- A string de conexão nunca deve ser expostas em código público
- O arquivo `.env` está no `.gitignore`

## ✨ Sucesso!

Se todos os testes passarem, seu projeto SaaS está pronto para:
- ✅ Usar Supabase como banco de dados
- ✅ Fazer queries com SupabaseService
- ✅ Gerenciar dados de múltiplos usuários
- ✅ Escalar sem limites do Supabase

Happy coding! 🚀
