'use client';

import * as React from 'react';
import { Camera, CheckCircle2, AlertCircle, Phone, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { use } from 'react';

// O user passa um link ex: biotec.com.br/q/green-village
export default function GuestChamadoPage({ params }: { params: Promise<{ condominio: string }> }) {
  const resolvedParams = use(params);
  const rawCondominio = resolvedParams.condominio || '';
  
  // Condição para bloquear se não for green-village
  // Como as URLs vem em kebab-case, verificamos com hifens
  const isAuthorized = rawCondominio.toLowerCase() === 'green-village';
  
  const [bloco, setBloco] = React.useState('');
  const [apto, setApto] = React.useState('');
  const [nome, setNome] = React.useState('');
  const [telefone, setTelefone] = React.useState('');
  const [problemType, setProblemType] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setImageUrl(canvas.toDataURL('image/jpeg', 0.7));
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!bloco || !apto) {
      setErrorMsg('Por favor, informe seu bloco e apartamento.');
      return;
    }

    if (!problemType || problemType === 'outros') {
      return; // "Outros" não deve submeter chamados por aqui
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/public-chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condominio: 'Green Village', // Hardcoded for this MVP since URL is validated
          bloco,
          apto,
          nome,
          telefone,
          problemType,
          descricao,
          imageUrl
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar sua solicitação.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl max-w-sm w-full">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-lg font-bold text-slate-800">Condomínio não autorizado</h1>
          <p className="mt-2 text-sm text-slate-500">
            Este canal exclusivo está desativado ou o QR Code é inválido para essa região.
          </p>
        </div>
      </div>
    );
  }

  // Se o usuário selecionou "Outros", mostramos apenas o box do WhatsApp
  const requiresWhatsapp = problemType === 'outros';

  return (
    <div className="min-h-screen bg-[#f6f7f8] pb-12">
      {/* Visual Header */}
      <div className="bg-[#00a859] pt-12 pb-24 px-6 rounded-b-[40px] shadow-sm relative overflow-hidden">
        {/* Decorator Circles */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white opacity-10 blur-xl"></div>
        <div className="absolute -left-12 top-12 h-24 w-24 rounded-full bg-white opacity-10 blur-md"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#00a859] shadow-lg">
            <span className="text-3xl font-black">b</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Biotec</h1>
          <p className="mt-1 text-sm font-medium text-green-100 uppercase tracking-widest">
            Green Village
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-md px-4 -mt-16 relative z-20">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <Phone className="h-10 w-10 text-emerald-600" />
            </div>
            
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Abertura de Chamado</h2>
            
            <div className="mb-8 space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Estamos passando por uma <strong>manutenção em nosso servidor de chamados</strong> para melhorar nosso atendimento.
              </p>
              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 text-sm text-amber-800 font-medium">
                Para abrir seu chamado agora, entre em contato diretamente com nosso suporte técnico via WhatsApp.
              </div>
            </div>

            <a 
              href="https://wa.me/5581988431463?text=Olá,%20estou%20tentando%20abrir%20um%20chamado%20pelo%20site%20mas%20vi%20que%20está%20em%20manutenção.%20Poderia%20me%20ajudar?"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 w-full rounded-2xl bg-emerald-500 py-4 px-6 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Phone size={24} />
              Abrir Chamado via WhatsApp
            </a>
            
            <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Atendimento Biotec • (81) 98843-1463
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
          Sistema Operado por Biotec
        </p>
      </div>
    </div>
  );
}
