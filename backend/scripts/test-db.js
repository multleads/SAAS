#!/usr/bin/env node

/**
 * Script para testar a conexão com o Supabase
 * Uso: node backend/scripts/test-db.js
 */

const { Client } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não está configurada no .env');
  process.exit(1);
}

async function testConnection() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔄 Testando conexão com Supabase...\n');
    
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar query simples
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Horário do servidor:', result.rows[0].now);

    // Contar tabelas
    const tablesResult = await client.query(`
      SELECT COUNT(*) as total
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Tabelas no banco:', tablesResult.rows[0].total);

    // Listar tabelas
    const listResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (listResult.rows.length > 0) {
      console.log('\n📋 Tabelas existentes:');
      listResult.rows.forEach(row => {
        console.log(`  • ${row.table_name}`);
      });
    } else {
      console.log('\n⚠️ Nenhuma tabela encontrada. Execute: npm run db:init');
    }

    // Testar dados de teste
    try {
      const adminResult = await client.query('SELECT COUNT(*) as total FROM admin');
      console.log(`\n👤 Administradores: ${adminResult.rows[0].total}`);
    } catch (e) {
      console.log('\n⚠️ Tabela admin não existe ainda');
    }

  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('  → Verifique se o servidor de banco está rodando');
    } else if (error.message.includes('password')) {
      console.error('  → Verifique as credenciais de acesso');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('  → Verifique o host do banco de dados');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Teste finalizado');
  }
}

testConnection();
