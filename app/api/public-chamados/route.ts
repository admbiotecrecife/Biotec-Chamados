import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Memória temporária de limite de acesso (Dura enquanto a Vercel function viver)
const rateLimit = new Map<string, { count: number, resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userData = rateLimit.get(ip);
  
  if (!userData) {
    rateLimit.set(ip, { count: 1, resetAt: now + 3600 * 1000 }); // Limpa o ciclo de 1h
    return false;
  }
  
  if (now > userData.resetAt) {
    // Passou 1 hora? Zera
    rateLimit.set(ip, { count: 1, resetAt: now + 3600 * 1000 });
    return false;
  }
  
  if (userData.count >= 2) {
    // Já abriu 2 chamados nesta hora
    return true; 
  }
  
  userData.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    // Pega o IP p/ evitar que a mesma pessoa flode o Supabase
    const ip = request.headers.get('x-forwarded-for') || 'ip-desconhecido';
    
    if (isRateLimited(ip)) {
      return NextResponse.json({ 
        error: 'Você já abriu a quantidade máxima de solicitações recentes. Se for muito urgente, contate a central por WhatsApp.' 
      }, { status: 429 });
    }

    const data = await request.json();
    
    // Segurança: Confirmar que só Green Village está rodando neste MVP
    if (!data.condominio || data.condominio.toLowerCase() !== 'green village') {
      return NextResponse.json({ error: 'Condomínio não credenciado.' }, { status: 403 });
    }

    // Só permitir os dois tipos definidos
    if (data.problemType !== 'interfone' && data.problemType !== 'antena coletiva') {
      return NextResponse.json({ error: 'Tipo de problema não suportado por este canal.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    const descFinal = data.nome && data.telefone
      ? `Contato: ${data.nome} (Tel: ${data.telefone})\n\nRelato: ${data.descricao || 'Sem descrição particular.'}`
      : (data.descricao || 'Solicitação via QR Code - Morador aguardando contato da equipe.');

    const { data: newChamado, error } = await supabase
      .from('chamados')
      .insert([{
        condominio: 'Green Village',
        bloco: data.bloco,
        apto: data.apto,
        problem_type: data.problemType,
        descricao: descFinal,
        status: 'Pendente',
        prioridade: 'Média',
        created_by: 'Convidado (QR Code)', // Aparecerá no dashboard como autor
        created_at: new Date().toISOString(),
        image_url: data.imageUrl || null
      }])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, chamadoId: newChamado.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
