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
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-[#00a859]" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-slate-900">Tudo Certo!</h2>
              <p className="text-slate-600 mb-6">
                Sua solicitação de manutenção foi enviada com sucesso para a equipe técnica da Biotec.
              </p>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-500">
                Uma equipe fará a vistoria do seu apartamento/bloco o mais breve possível.
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-1">Abertura de Chamado</h2>
                <p className="text-xs text-slate-500 mb-6">Preencha os dados da sua residência para solicitar apoio técnico.</p>

                {errorMsg && (
                  <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <p className="text-xs font-medium text-red-800">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Bloco</label>
                      <input 
                        type="text" 
                        value={bloco} 
                        onChange={(e) => setBloco(e.target.value)}
                        placeholder="Ex: A"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-[#00a859] focus:bg-white focus:ring-1 focus:ring-[#00a859] transition-all"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Apartamento</label>
                      <input 
                        type="text" 
                        value={apto} 
                        onChange={(e) => setApto(e.target.value)}
                        placeholder="Ex: 302"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-[#00a859] focus:bg-white focus:ring-1 focus:ring-[#00a859] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Nome do Morador</label>
                    <input 
                      type="text" 
                      value={nome} 
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Identifique-se"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-[#00a859] focus:bg-white focus:ring-1 focus:ring-[#00a859] transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Seu Telefone/WhatsApp</label>
                    <input 
                      type="tel" 
                      value={telefone} 
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(81) 90000-0000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-[#00a859] focus:bg-white focus:ring-1 focus:ring-[#00a859] transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Qual o problema?</label>
                    <select 
                      value={problemType} 
                      onChange={(e) => setProblemType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-[#00a859] focus:bg-white focus:ring-1 focus:ring-[#00a859] transition-all"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="interfone">Problema no Interfone</option>
                      <option value="antena coletiva">Problema na Antena Coletiva</option>
                      <option value="outros">Outros tipos de problemas</option>
                    </select>
                  </div>

                  {/* Se for outros, a tela de forms se esconde e sugere Whatsapp */}
                  {requiresWhatsapp ? (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-4 border-t border-slate-100"
                    >
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center">
                        <Phone className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-800 mb-2">Central de Atendimento</h3>
                        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                          Para demandas complexas ou fora da cobertura de Interfonia e Antena, nosso time está à disposição para te entender melhor.
                        </p>
                        <a 
                          href="https://wa.me/5581988431463"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 py-3 px-4 font-bold text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          Chamar no WhatsApp
                        </a>
                      </div>
                    </motion.div>
                  ) : problemType ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="space-y-5"
                    >
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Descrição dos Sintomas</label>
                        <textarea 
                          value={descricao} 
                          onChange={(e) => setDescricao(e.target.value)}
                          placeholder="Ex: O interfone está completamente mudo."
                          rows={3}
                          maxLength={150}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-[#00a859] focus:bg-white focus:ring-1 focus:ring-[#00a859] transition-all resize-none"
                        />
                        <div className="text-[10px] text-slate-400 text-right mt-1 font-medium">{descricao.length}/150 caracteres</div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Foto Evidência (Opcional)</span>
                        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100">
                          {imageUrl ? (
                            <div className="relative mx-auto h-32 w-full max-w-[200px] overflow-hidden rounded-lg shadow-sm">
                              <img src={imageUrl} alt="Anexo" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setImageUrl('')}
                                className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg shadow-red-500/30"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center text-center">
                              <div className="mb-2 rounded-full bg-white p-3 shadow-sm text-slate-400">
                                {isUploading ? <Upload className="animate-bounce" size={20} /> : <Camera size={20} />}
                              </div>
                              <span className="text-xs font-semibold text-slate-600">Torque para abrir a câmera</span>
                              <span className="mt-1 text-[10px] text-slate-400">Ajude a equipe mandando uma foto</span>
                              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                          )}
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting || isUploading}
                        className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#00a859] py-3.5 font-bold text-white shadow-lg shadow-[#00a859]/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                      >
                        {isSubmitting ? 'Enviando...' : 'Pedir Assistência Hoje'}
                      </button>
                    </motion.div>
                  ) : null}
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="mt-8 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
          Sistema Operado por Biotec
        </p>
      </div>
    </div>
  );
}
