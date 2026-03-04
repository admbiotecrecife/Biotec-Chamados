import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const condo = searchParams.get('condo');
    
    let query = supabase.from('preventivas').select('*').order('data_visita', { ascending: false });
    
    if (condo && condo !== 'all') {
      query = query.eq('condominio', condo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { data, error } = await supabase
      .from('preventivas')
      .insert([body])
      .select();

    if (error) throw error;
    return Response.json(data[0]);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
