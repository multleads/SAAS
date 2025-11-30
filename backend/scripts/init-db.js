#!/usr/bin/env node

/**
 * Script para inicializar o banco de dados no Supabase
 * Executa o schema.sql e cria todas as tabelas
 * 
 * Uso: node backend/scripts/init-db.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não está configurada no .env');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Necessário para Supabase
  },
});

async function initDatabase() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o arquivo schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('\n📋 Executando schema SQL...\n');
    
    // Dividir em queries individuais (separadas por ;)
    const queries = schema
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    let executedCount = 0;
    for (const query of queries) {
      try {
        await client.query(query);
        executedCount++;
        // Mostrar apenas queries importantes
        if (query.includes('CREATE TABLE') || query.includes('CREATE INDEX') || query.includes('CREATE VIEW') || query.includes('INSERT')) {
          const preview = query.split('\n')[0].substring(0, 60);
          console.log(`  ✓ ${preview}...`);
        }
      } catch (error) {
        // Ignorar erros de "já existe" (já que estamos usando CREATE IF NOT EXISTS em alguns casos)
        if (!error.message.includes('already exists') && !error.message.includes('CONFLITO')) {
          console.warn(`  ⚠ ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Database inicializado com sucesso!`);
    console.log(`📊 Total de queries executadas: ${executedCount}`);

    // Verificar tabelas criadas
    console.log('\n📈 Tabelas criadas:');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    result.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
initDatabase();
