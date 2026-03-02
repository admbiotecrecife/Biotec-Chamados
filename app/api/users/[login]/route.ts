import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ login: string }> }
) {
  try {
    const { login } = await params;
    const supabase = getSupabaseAdmin();

    // Don't allow deleting the main master admin
    if (login === 'admin@biotec.com') {
      return NextResponse.json({ error: 'Não é possível excluir o administrador master' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('login', login)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
