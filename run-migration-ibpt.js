const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'db.wxtincvnlpawfvmzjnpx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'pCz9tNYNaXUdXzFl',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Conectado ao Supabase PostgreSQL');

    const sql = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '017_ibpt_aliquotas.sql'),
      'utf8'
    );

    console.log('Executando migration 017_ibpt_aliquotas.sql...');
    await client.query(sql);
    console.log('Migration executada com sucesso!');

    console.log('\n=== TABELAS IBPT CRIADAS ===');
    console.log('- ibpt_aliquotas (NCM - Produtos)');
    console.log('- ibpt_servicos (NBS - Servicos)');
    console.log('- ibpt_importacoes (Controle)');

  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
