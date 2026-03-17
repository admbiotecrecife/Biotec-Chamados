import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// Substitua pelos seus valores do novo Supabase que você obteve no passo anterior
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERRO: Você precisa definir as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função robusta para parsear CSV (lida com aspas e quebras de linha dentro de campos)
function parseCSV(content) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        row.push(cell);
        if (row.length > 1 || cell !== '') {
            rows.push(row);
        }
        row = [];
        cell = '';
        if (char === '\r') i++;
      } else {
        cell += char;
      }
    }
  }
  if (row.length || cell) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function importFile(filename, table) {
  if (!fs.existsSync(filename)) {
    console.warn(`Aviso: Arquivo ${filename} não encontrado. Pulando...`);
    return;
  }

  console.log(`Importando ${filename} para a tabela ${table}...`);
  const content = fs.readFileSync(filename, 'utf-8');
  const parsed = parseCSV(content);
  
  if (parsed.length < 2) {
    console.warn(`Arquivo ${filename} está vazio ou sem dados.`);
    return;
  }

  const headers = parsed[0];
  const data = parsed.slice(1);

  const entries = data
    .filter(row => row.length === headers.length)
    .map(row => {
      const entry = {};
      headers.forEach((header, index) => {
        let value = row[index];
        if (value === "" || value === undefined) {
          value = null;
        } else {
          value = value.trim();
          // Tentar converter JSON (ex: itens_verificados)
          if (value.startsWith('[') || value.startsWith('{')) {
            try { value = JSON.parse(value); } catch(e) {}
          }
        }
        entry[header.trim()] = value;
      });
      return entry;
    });

  // Dividir em lotes de 50 para evitar erros de payload grande
  const chunkSize = 50;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`Erro ao importar lote em ${table}:`, error.message);
    }
  }

  console.log(`Sucesso: ${entries.length} registros processados para ${table}.`);
}

async function main() {
  try {
    console.log('Iniciando migração de dados...');
    await importFile('users_rows.csv', 'users');
    await importFile('equipes_rows.csv', 'equipes');
    await importFile('preventivas_rows.csv', 'preventivas');
    await importFile('chamados_rows.csv', 'chamados');
    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro crítico na migração:', err.message);
  }
}

main();
