import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { login, pass } = await request.json();
    
    if (!login || !pass) {
      return NextResponse.json({ error: 'Login e senha são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('login, role, condominio, pass')
      .eq('login', login.trim().toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.pass.trim() !== pass.trim()) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // Remove password from response
    const { pass: _, ...userWithoutPass } = user;

    return NextResponse.json({ 
      success: true, 
      user: userWithoutPass 
    });
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
