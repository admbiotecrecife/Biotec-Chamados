import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chamados')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Chamado não encontrado' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const supabase = getSupabaseAdmin();

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.prioridade) updateData.prioridade = data.prioridade;
    if (data.resolucao !== undefined) updateData.resolucao = data.resolucao;
    if (data.descricao) updateData.descricao = data.descricao;
    if (data.bloco) updateData.bloco = data.bloco;
    if (data.apto) updateData.apto = data.apto;
    if (data.problemType) updateData.problem_type = data.problemType;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.resolutionImageUrl !== undefined) updateData.resolution_image_url = data.resolutionImageUrl;
    if (data.feedbackRating !== undefined) updateData.feedback_rating = data.feedbackRating;
    if (data.feedbackComment !== undefined) updateData.feedback_comment = data.feedbackComment;

    const { data: updated, error } = await supabase
      .from('chamados')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: 'Chamado não encontrado' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chamados')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Chamado não encontrado' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
