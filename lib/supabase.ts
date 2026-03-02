import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables (URL/Anon Key) are not configured. Please check your Secrets panel.');
    }

    // Detect if user swapped URL and Key
    if (supabaseUrl.startsWith('sb_') || supabaseUrl.startsWith('eyJ')) {
      throw new Error('Detectamos que você pode ter colado a CHAVE (Key) no campo da URL nos Secrets. Por favor, verifique se NEXT_PUBLIC_SUPABASE_URL contém o link (https://...) e NEXT_PUBLIC_SUPABASE_ANON_KEY contém a chave.');
    }

    if (!supabaseUrl.startsWith('http')) {
      throw new Error(`O formato da URL do Supabase é inválido: "${supabaseUrl}". Ela deve começar com http:// ou https://`);
    }

    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err: any) {
      console.error('Failed to initialize Supabase client:', err.message);
      throw new Error(`Erro ao inicializar Supabase: ${err.message}`);
    }
  }
  return supabaseInstance;
}

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      // Fallback to anon client if service key is missing
      try {
        return getSupabase();
      } catch (e: any) {
        throw new Error(`Supabase Service Role key is not configured: ${e.message}`);
      }
    }

    if (supabaseUrl.startsWith('sb_') || supabaseUrl.startsWith('eyJ')) {
      throw new Error('Detectamos que você pode ter colado a CHAVE (Key) no campo da URL nos Secrets.');
    }

    if (!supabaseUrl.startsWith('http')) {
      throw new Error(`O formato da URL do Supabase é inválido: "${supabaseUrl}"`);
    }

    try {
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
    } catch (err: any) {
      console.error('Failed to initialize Supabase Admin client:', err.message);
      throw new Error(`Erro ao inicializar Supabase Admin: ${err.message}`);
    }
  }
  return supabaseAdminInstance;
}
