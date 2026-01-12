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
      path.join(__dirname, 'supabase', 'migrations', '018_config_desconto.sql'),
      'utf8'
    );

    console.log('Executando migration 018_config_desconto.sql...');
    await client.query(sql);
    console.log('Migration executada com sucesso!');

    console.log('\n=== CONFIGURACAO DE DESCONTO CRIADA ===');
    console.log('- config_desconto (configuracoes)');
    console.log('- Campos adicionados em venda_itens e vendas');

  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
