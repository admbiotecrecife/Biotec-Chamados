import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('login, role, condominio, created_at')
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
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('login')
      .eq('login', data.login.trim().toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 });
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        login: data.login.trim().toLowerCase(),
        pass: data.pass.trim(),
        role: 'condo', 
        condominio: data.condominio.trim() || ''
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(newUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
