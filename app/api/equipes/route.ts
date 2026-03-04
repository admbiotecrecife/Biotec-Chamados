import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('equipes')
      .select('*')
      .order('nome_equipe', { ascending: true });

    if (error) throw error;
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) return Response.json({ error: 'ID da equipe é obrigatório' }, { status: 400 });

    const { data, error } = await supabase
      .from('equipes')
      .update({
        ...updates,
        ultima_atualizacao: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return Response.json(data[0]);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
