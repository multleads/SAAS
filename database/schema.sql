-- ============================================
-- SaaS MultiLeads - Schema SQL para Supabase
-- ============================================

-- Tabela de Administradores
CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Empresas
CREATE TABLE empresa (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE produto (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE cliente (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produto(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  data_nascimento DATE,
  cnpj_cpf VARCHAR(18),
  estado VARCHAR(2),
  cidade VARCHAR(100),
  endereco TEXT,
  numero VARCHAR(10),
  complemento VARCHAR(255),
  cep VARCHAR(10),
  whatsapp VARCHAR(20),
  termos_aceitos BOOLEAN DEFAULT false,
  verificado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Verificações (WhatsApp/Email)
CREATE TABLE verificacao (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  tipo VARCHAR(50), -- 'whatsapp' ou 'email'
  codigo VARCHAR(6) NOT NULL,
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  expira_em TIMESTAMP NOT NULL,
  verificado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES para melhor performance
-- ============================================

-- Índices em admin
CREATE INDEX idx_admin_email ON admin(email);

-- Índices em empresa
CREATE INDEX idx_empresa_email ON empresa(email);
CREATE INDEX idx_empresa_cnpj ON empresa(cnpj);
CREATE INDEX idx_empresa_ativo ON empresa(ativo);

-- Índices em produto
CREATE INDEX idx_produto_empresa_id ON produto(empresa_id);
CREATE INDEX idx_produto_ativo ON produto(ativo);

-- Índices em cliente
CREATE INDEX idx_cliente_produto_id ON cliente(produto_id);
CREATE INDEX idx_cliente_email ON cliente(email);
CREATE INDEX idx_cliente_telefone ON cliente(telefone);
CREATE INDEX idx_cliente_verificado ON cliente(verificado);

-- Índices em verificacao
CREATE INDEX idx_verificacao_cliente_id ON verificacao(cliente_id);
CREATE INDEX idx_verificacao_codigo ON verificacao(codigo);
CREATE INDEX idx_verificacao_expira_em ON verificacao(expira_em);

-- ============================================
-- DADOS DE TESTE (Opcional)
-- ============================================

-- Inserir administrador de teste
INSERT INTO admin (email, senha, nome) 
VALUES ('admin@example.com', '$2b$10$YIjlrLxJ7.7Z6e5VQm5J9uF5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5', 'Administrador Principal')
ON CONFLICT (email) DO NOTHING;

-- Inserir empresa de teste
INSERT INTO empresa (nome, email, senha, cnpj, telefone, cidade, estado, descricao, ativo) 
VALUES (
  'Empresa Demo',
  'empresa@example.com',
  '$2b$10$YIjlrLxJ7.7Z6e5VQm5J9uF5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5',
  '12.345.678/0001-00',
  '(11) 99999-9999',
  'São Paulo',
  'SP',
  'Empresa de demonstração do SaaS',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Inserir produto de teste (usando RETURNING para obter o ID da empresa)
INSERT INTO produto (empresa_id, nome, descricao, ativo)
SELECT 
  id,
  'Produto Demo',
  'Produto de demonstração',
  true
FROM empresa
WHERE email = 'empresa@example.com'
AND NOT EXISTS (SELECT 1 FROM produto WHERE empresa_id = empresa.id AND nome = 'Produto Demo')
LIMIT 1;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Clientes com informações do Produto e Empresa
CREATE VIEW v_cliente_completo AS
SELECT 
  c.id,
  c.nome,
  c.email,
  c.telefone,
  c.data_nascimento,
  c.cnpj_cpf,
  c.estado,
  c.cidade,
  c.whatsapp,
  c.verificado,
  c.criado_em,
  p.id as produto_id,
  p.nome as produto_nome,
  p.logo_url as produto_logo,
  p.banner_url as produto_banner,
  e.id as empresa_id,
  e.nome as empresa_nome,
  e.logo_url as empresa_logo
FROM cliente c
JOIN produto p ON c.produto_id = p.id
JOIN empresa e ON p.empresa_id = e.id;

-- View: Estatísticas por Empresa
CREATE VIEW v_empresa_stats AS
SELECT 
  e.id,
  e.nome,
  COUNT(DISTINCT p.id) as total_produtos,
  COUNT(DISTINCT c.id) as total_clientes,
  COUNT(DISTINCT CASE WHEN c.verificado = true THEN c.id END) as clientes_verificados
FROM empresa e
LEFT JOIN produto p ON e.id = p.empresa_id
LEFT JOIN cliente c ON p.id = c.produto_id
GROUP BY e.id, e.nome;

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamp
CREATE TRIGGER trigger_admin_timestamp BEFORE UPDATE ON admin
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_empresa_timestamp BEFORE UPDATE ON empresa
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_produto_timestamp BEFORE UPDATE ON produto
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_cliente_timestamp BEFORE UPDATE ON cliente
FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - Supabase
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificacao ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode ver e editar admin (apenas a si mesmo)
CREATE POLICY "Admin pode ver sua própria conta" ON admin
  FOR SELECT USING (auth.uid()::text = id::text);

-- Política: Empresa pode ver seus próprios dados
CREATE POLICY "Empresa pode ver seus dados" ON empresa
  FOR SELECT USING (auth.uid()::text = id::text);

-- Política: Empresa pode ver seus próprios produtos
CREATE POLICY "Empresa pode ver seus produtos" ON produto
  FOR SELECT USING (
    empresa_id IN (
      SELECT id FROM empresa WHERE auth.uid()::text = id::text
    )
  );

-- Política: Qualquer um pode ver clientes públicos
CREATE POLICY "Clientes são públicos para leitura" ON cliente
  FOR SELECT USING (true);

-- Política: Verificações são privadas
CREATE POLICY "Verificações são privadas" ON verificacao
  FOR SELECT USING (auth.uid()::text = cliente_id::text);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
/*
1. SENHAS: Os valores de senha mostrados são exemplos. Use bcrypt para hash de senhas reais.
   Exemplo com bcrypt: $2b$10$... (10 rounds de salt)

2. SUPABASE:
   - Cole este SQL no Editor SQL do Supabase
   - Copie a URL e API Key da dashboard
   - Atualize as variáveis de ambiente no projeto

3. RLS (Row Level Security):
   - As políticas RLS precisam ser ajustadas conforme sua autenticação
   - Se não estiver usando Supabase Auth, desabilite RLS ou ajuste as políticas

4. VARIÁVEIS DE AMBIENTE (.env):
   SUPABASE_URL=https://[seu-projeto].supabase.co
   SUPABASE_ANON_KEY=seu-chave-publica
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada

5. CONEXÃO NO BACKEND:
   npm install @supabase/supabase-js
   
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
*/
