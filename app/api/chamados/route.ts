import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('chamados')
      .select('id, created_at, created_by, condominio, bloco, apto, problem_type, descricao, resolucao, status, prioridade, feedback_rating, feedback_comment')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // As imagens base64 não são enviadas na listagem para salvar banda e evitar consumos excessivos de Egress Vercel/Supabase.
    // Para identificar se a imagem existe sem baixar toda a string do banco (que gera 11GB+ egress), fazemos duas consultas leves:
    let hasImageSet = new Set();
    let hasResImageSet = new Set();
    
    const ids = (data || []).map(c => c.id);
    if (ids.length > 0) {
      const [imgIds, resImgIds] = await Promise.all([
        supabase.from('chamados').select('id').not('image_url', 'is', null).in('id', ids),
        supabase.from('chamados').select('id').not('resolution_image_url', 'is', null).in('id', ids)
      ]);
      
      hasImageSet = new Set((imgIds.data || []).map(x => x.id));
      hasResImageSet = new Set((resImgIds.data || []).map(x => x.id));
    }

    // Retornamos apenas flags booleanas para que a UI saiba onde existem imagens.
    const summaryData = (data || []).map(c => ({
      ...c,
      has_image: hasImageSet.has(c.id),
      has_resolution_image: hasResImageSet.has(c.id),
      image_url: null,
      resolution_image_url: null
    }));

    return NextResponse.json(summaryData);
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
        prioridade: data.prioridade || 'Média',
        created_by: data.createdBy || 'Sistema',
        created_at: data.createdAt || new Date().toISOString(),
        image_url: data.imageUrl || null,
        resolution_image_url: data.resolutionImageUrl || null
      }])
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json(newChamado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
