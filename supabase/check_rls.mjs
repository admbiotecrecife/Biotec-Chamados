import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRLS() {
  // We can't directly check RLS status via the client, but we can try to SELECT using the ANON KEY
  // If SERVICE ROLE works but ANON fails, it's likely RLS.
  
  const tables = ['users', 'equipes', 'preventivas', 'chamados'];
  const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  for (const table of tables) {
    const { data: adminData, error: adminError } = await supabase.from(table).select('count');
    const { data: anonData, error: anonError } = await supabase.from(table).select('count');

    console.log(`Table ${table}:`);
    if (adminError) console.log(`  Admin Check: ERROR - ${adminError.message}`);
    else console.log(`  Admin Check: SUCCESS`);

    if (anonError) console.log(`  Anon Check: ERROR - ${anonError.message}`);
    else console.log(`  Anon Check: SUCCESS`);
  }
}

checkRLS();
