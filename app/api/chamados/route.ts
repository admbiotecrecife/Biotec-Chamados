import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('chamados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = getSupabaseAdmin();
    
    const { data: newChamado, error } = await supabase
      .from('chamados')
      .insert([{
        condominio: data.condominio,
        bloco: data.bloco,
        apto: data.apto,
        problem_type: data.problemType,
        descricao: data.descricao,
        resolucao: data.resolucao || '',
        status: 'Pendente',
        created_by: data.createdBy || 'Sistema'
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(newChamado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
