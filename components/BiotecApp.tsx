'use client';

import * as React from 'react';
import { 
  Building2, 
  Home, 
  Ticket, 
  Bell,
  LayoutGrid,
  DoorOpen,
  Send,
  Info,
  Phone,
  Tv,
  MoreHorizontal,
  Building,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  History,
  Download,
  Filter,
  Calendar,
  Users,
  UserPlus,
  Key,
  Camera,
  Image as ImageIcon,
  Paperclip,
  Maximize2,
  Menu,
  Eye,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type ProblemType = 'interfone' | 'tv' | 'outro' | null;
type View = 'list' | 'create' | 'edit' | 'history' | 'condos';

interface User {
  login: string;
  pass: string;
  role: 'master' | 'condo';
  condominio?: string;
}

interface Chamado {
  id: string;
  condominio: string;
  bloco: string;
  apto: string;
  problemType: ProblemType;
  descricao: string;
  resolucao?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  createdAt: string;
  createdBy: string;
  imageUrl?: string;
  resolutionImageUrl?: string;
}

interface BiotecAppProps {
  user: string;
  onLogout: () => void;
}

export default function BiotecApp({ user, onLogout }: BiotecAppProps) {
  const isMaster = user.toLowerCase() === 'admin@biotec.com';
  const [view, setView] = React.useState<View>(isMaster ? 'list' : 'create');
  const [chamados, setChamados] = React.useState<Chamado[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // Current User Info
  const [currentUserInfo, setCurrentUserInfo] = React.useState<User | null>(null);

  // Users State
  const [users, setUsers] = React.useState<User[]>([]);
  const [newUserLogin, setNewUserLogin] = React.useState('');
  const [newUserPass, setNewUserPass] = React.useState('');
  const [newUserCondo, setNewUserCondo] = React.useState('');
  const [isCreatingUser, setIsCreatingUser] = React.useState(false);

  // History Filters
  const [historyMonth, setHistoryMonth] = React.useState<number | 'all'>(new Date().getMonth());
  const [historyYear, setHistoryYear] = React.useState(new Date().getFullYear());
  const [historyCondo, setHistoryCondo] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('Todos');

  // Form State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [problemType, setProblemType] = React.useState<ProblemType>(null);
  const [condominio, setCondominio] = React.useState('');
  const [bloco, setBloco] = React.useState('');
  const [apto, setApto] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [resolucao, setResolucao] = React.useState('');
  const [status, setStatus] = React.useState<'Pendente' | 'Em Andamento' | 'Concluído'>('Pendente');
  const [isAreaComum, setIsAreaComum] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [resolutionImageUrl, setResolutionImageUrl] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null); // For modal view
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const isLocked = !isMaster && view === 'edit' && status === 'Concluído';

  const fetchChamados = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chamados');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar chamados');
      
      const mappedData = (Array.isArray(data) ? data : []).map((c: any) => ({
        ...c,
        createdAt: c.created_at || c.createdAt || new Date().toISOString(),
        createdBy: c.created_by || c.createdBy || 'Sistema',
        problemType: c.problem_type || c.problem_type || c.problemType || 'outro',
        imageUrl: c.image_url || c.imageUrl || '',
        resolutionImageUrl: c.resolution_image_url || c.resolutionImageUrl || ''
      }));
      
      setChamados(mappedData);
    } catch (error: any) {
      console.error('Erro ao buscar chamados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar usuários');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  React.useEffect(() => {
    fetchChamados();
    const init = async () => {
      try {
        const res = await fetch('/api/users');
        const allUsers = await res.json();
        if (!res.ok) throw new Error(allUsers.error || 'Erro ao inicializar');
        
        if (Array.isArray(allUsers)) {
          const info = allUsers.find((u: User) => u.login.toLowerCase() === user.toLowerCase());
          if (info) {
            setCurrentUserInfo(info);
            if (!isMaster) {
              setCondominio(info.condominio || '');
            }
          }
          if (isMaster) setUsers(allUsers);
        }
      } catch (error: any) {
        console.error('Erro ao inicializar:', error);
      }
    };
    init();

    // Polling para atualizar chamados automaticamente a cada 30 segundos
    const interval = setInterval(fetchChamados, 30000);
    return () => clearInterval(interval);
  }, [isMaster, user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserLogin || !newUserPass || !newUserCondo) return;
    
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login: newUserLogin.trim(), 
          pass: newUserPass.trim(), 
          condominio: newUserCondo.trim() 
        }),
      });
      
      if (res.ok) {
        setNewUserLogin('');
        setNewUserPass('');
        setNewUserCondo('');
        fetchUsers();
        alert('Usuário criado com sucesso!');
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (login: string) => {
    if (!confirm(`Deseja realmente excluir o usuário ${login}?`)) return;
    
    try {
      const res = await fetch(`/api/users/${login}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const filteredChamados = React.useMemo(() => {
    let base = isMaster 
      ? chamados 
      : chamados.filter(c => c.createdBy === user || (currentUserInfo?.condominio && c.condominio === currentUserInfo.condominio));
    if (statusFilter !== 'Todos') {
      base = base.filter(c => c.status === statusFilter);
    }
    return base;
  }, [chamados, isMaster, user, statusFilter, currentUserInfo]);

  const historyChamados = React.useMemo(() => {
    const base = isMaster 
      ? chamados 
      : chamados.filter(c => c.createdBy === user || (currentUserInfo?.condominio && c.condominio === currentUserInfo.condominio));
    return base.filter(c => {
      const date = new Date(c.createdAt);
      const matchesMonth = historyMonth === 'all' || date.getMonth() === historyMonth;
      const matchesYear = date.getFullYear() === historyYear;
      const matchesCondo = historyCondo === 'all' || c.condominio === historyCondo;
      return matchesMonth && matchesYear && matchesCondo;
    });
  }, [chamados, isMaster, user, historyMonth, historyYear, historyCondo, currentUserInfo]);

  const stats = React.useMemo(() => {
    const total = filteredChamados.length;
    const pendentes = filteredChamados.filter(c => c.status === 'Pendente').length;
    const emAndamento = filteredChamados.filter(c => c.status === 'Em Andamento').length;
    const concluidos = filteredChamados.filter(c => c.status === 'Concluído').length;
    
    // Group by condominium
    const byCondo: Record<string, number> = {};
    filteredChamados.forEach(c => {
      byCondo[c.condominio] = (byCondo[c.condominio] || 0) + 1;
    });

    return { total, pendentes, emAndamento, concluidos, byCondo };
  }, [filteredChamados]);

  const resetForm = () => {
    setProblemType(null);
    setCondominio(isMaster ? '' : (currentUserInfo?.condominio || ''));
    setBloco('');
    setApto('');
    setIsAreaComum(false);
    setDescricao('');
    setResolucao('');
    setStatus('Pendente');
    setEditingId(null);
    setSubmitted(false);
    setImageUrl('');
    setResolutionImageUrl('');
  };

  const handleCreate = () => {
    resetForm();
    setView('create');
  };

  const handleEdit = (chamado: Chamado) => {
    setEditingId(chamado.id);
    setProblemType(chamado.problemType);
    setCondominio(chamado.condominio);
    setBloco(chamado.bloco);
    setApto(chamado.apto);
    setDescricao(chamado.descricao);
    setResolucao(chamado.resolucao || '');
    setStatus(chamado.status);
    setImageUrl(chamado.imageUrl || '');
    setResolutionImageUrl(chamado.resolutionImageUrl || '');
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este chamado?')) return;
    
    try {
      await fetch(`/api/chamados/${id}`, { method: 'DELETE' });
      fetchChamados();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'problem' | 'resolution') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem é muito grande. Por favor, use uma imagem de até 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'problem') setImageUrl(base64String);
        else setResolutionImageUrl(base64String);
        setIsUploading(true); // Keep it true for a moment to show "loading" effect if needed
        setTimeout(() => setIsUploading(false), 500);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setIsUploading(false);
      alert('Erro ao carregar imagem.');
    }
  };

  const removeImage = (type: 'problem' | 'resolution') => {
    if (type === 'problem') setImageUrl('');
    else setResolutionImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se for área comum e não tiver tipo, assume 'outro'
    let finalProblemType = problemType;
    if (isAreaComum && !finalProblemType) {
      finalProblemType = 'outro';
    }

    if (!finalProblemType) {
      alert('Por favor, selecione o tipo de problema.');
      return;
    }
    if (!condominio) {
      alert('Por favor, selecione ou informe o condomínio.');
      return;
    }
    if (!bloco || !apto) {
      alert('Por favor, informe o bloco e o apartamento (ou marque Área Comum).');
      return;
    }
    if (!descricao) {
      alert('Por favor, descreva o problema.');
      return;
    }

    setIsSubmitting(true);
    const payload: any = { 
      condominio, 
      bloco, 
      apto, 
      problemType: finalProblemType, 
      descricao, 
      resolucao, 
      status,
      imageUrl,
      resolutionImageUrl
    };
    
    // Só envia createdBy na criação para não sobrescrever o dono original no edit
    if (view === 'create') {
      payload.createdBy = user;
    }
    
    try {
      if (view === 'edit' && editingId) {
        await fetch(`/api/chamados/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/chamados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      setSubmitted(true);
      fetchChamados();
      
      setTimeout(() => {
        setView('list');
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    try {
      if (historyChamados.length === 0) {
        alert('Não há chamados no período selecionado para exportar.');
        return;
      }
      const headers = ['Data', 'Condominio', 'Bloco', 'Apto', 'Tipo', 'Status', 'Descricao', 'Resolucao', 'Tem Foto Problema', 'Tem Foto Resolucao'];
      const rows = historyChamados.map(c => [
        new Date(c.createdAt).toLocaleDateString('pt-BR'),
        c.condominio,
        c.bloco,
        c.apto,
        c.problemType,
        c.status,
        c.descricao.replace(/\n/g, ' ').replace(/,/g, ';'),
        (c.resolucao || '').replace(/\n/g, ' ').replace(/,/g, ';'),
        c.imageUrl ? 'Sim' : 'Não',
        c.resolutionImageUrl ? 'Sim' : 'Não'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const monthLabel = historyMonth === 'all' ? 'todos' : historyMonth + 1;
      link.setAttribute('download', `relatorio_biotec_${monthLabel}_${historyYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao gerar CSV: ' + error.message);
    }
  };

  const exportPDF = () => {
    try {
      if (historyChamados.length === 0) {
        alert('Não há chamados no período selecionado para exportar.');
        return;
      }
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 168, 89); // Biotec Green
      doc.text('Biotec - Relatório de Chamados', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const monthName = historyMonth === 'all' ? 'Todos os Meses' : ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][historyMonth];
      doc.text(`Período: ${monthName} / ${historyYear}`, 14, 30);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);
      if (historyCondo !== 'all') {
        doc.text(`Condomínio: ${historyCondo}`, 14, 40);
      }

      const tableColumn = ["Data", "Condomínio", "Local", "Tipo", "Status", "Resolução"];
      const tableRows = historyChamados.map(c => [
        new Date(c.createdAt).toLocaleDateString('pt-BR'),
        c.condominio,
        `Bl ${c.bloco} - Apt ${c.apto}`,
        c.problemType === 'interfone' ? 'Interfone' : c.problemType === 'tv' ? 'TV' : 'Outro',
        c.status,
        c.resolucao || '-'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        headStyles: { fillColor: [0, 168, 89] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 45 },
      });

      // Add images if they exist
      const chamadosWithImages = historyChamados.filter(c => c.imageUrl || c.resolutionImageUrl);
      if (chamadosWithImages.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(0, 168, 89);
        doc.text('Anexo: Fotos dos Chamados', 14, 22);
        
        let yPos = 35;
        chamadosWithImages.forEach((c, index) => {
          if (yPos > 240) {
            doc.addPage();
            yPos = 22;
          }
          
          doc.setFontSize(10);
          doc.setTextColor(50);
          doc.setFont('helvetica', 'bold');
          doc.text(`${c.condominio} - Bl ${c.bloco} Apt ${c.apto} (${new Date(c.createdAt).toLocaleDateString('pt-BR')})`, 14, yPos);
          yPos += 5;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`ID: ${c.id.substring(0, 8)} - ${c.problemType === 'interfone' ? 'Interfone' : c.problemType === 'tv' ? 'TV' : 'Outro'}`, 14, yPos);
          yPos += 10;

          const imgWidth = 80;
          const imgHeight = 60;

          if (c.imageUrl) {
            try {
              doc.addImage(c.imageUrl, 'JPEG', 14, yPos, imgWidth, imgHeight);
              doc.text('Foto do Problema', 14, yPos + imgHeight + 5);
            } catch (e) {
              console.error('Erro ao adicionar imagem do problema ao PDF', e);
            }
          }

          if (c.resolutionImageUrl) {
            try {
              doc.addImage(c.resolutionImageUrl, 'JPEG', 100, yPos, imgWidth, imgHeight);
              doc.text('Foto da Resolução', 100, yPos + imgHeight + 5);
            } catch (e) {
              console.error('Erro ao adicionar imagem da resolução ao PDF', e);
            }
          }

          yPos += imgHeight + 20;
        });
      }

      const monthLabel = historyMonth === 'all' ? 'todos' : historyMonth + 1;
      doc.save(`relatorio_biotec_${monthLabel}_${historyYear}.pdf`);
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f7f8] text-slate-900 relative">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform duration-300 md:static md:flex md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00a859] text-white font-bold text-2xl">
              b
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#00a859]">Biotec</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-2">
          <NavItem 
            icon={<Home size={20} />} 
            label={isMaster ? "Dashboard Master" : "Início"} 
            active={view === 'list'} 
            onClick={() => { setView('list'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Ticket size={20} />} 
            label="Abertura de Chamado" 
            active={view === 'create'} 
            onClick={() => { handleCreate(); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Histórico" 
            active={view === 'history'} 
            onClick={() => { setView('history'); setIsSidebarOpen(false); }}
          />
          {isMaster && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Condomínios" 
              active={view === 'condos'} 
              onClick={() => { setView('condos'); setIsSidebarOpen(false); }}
            />
          )}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-200 border-2 border-[#00a859]">
                <Image 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoOZ4EKNq6ArvKItkJw0T9JwxlVE3scy_T9fj4jEiw_FEZ5cMUzgJdYRUO0tP1h6Rz-pe1545z-sfzz2o6on15u0_tnJj7FG-XTbaDm2z2U64LpUIvp268XQr_diY_apMVtXAWuFAMbPtghKN5UmlqHeX_jrB4KG25p181qYgRjzvMmsTuVlwMLpydNjmiyKf_4LSPNmro1IDdud2SCNsKUXgO-oysRtOxRuAMYVVveN9oKHtpJezSDulc8JzELitWRMZ-4Gcybv0"
                  alt={user}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-bold">{user.split('@')[0]}</p>
                <p className="truncate text-[10px] font-bold uppercase text-[#00a859]">
                  {isMaster ? 'Master Admin' : 'Condomínio Admin'}
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 md:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold md:text-xl truncate max-w-[200px] sm:max-w-none">
              {view === 'list' ? (isMaster ? 'Visão Geral Biotec' : 'Dashboard de Chamados') : 
               view === 'create' ? 'Novo Chamado' : 
               view === 'history' ? 'Histórico e Relatórios' : 'Editar Chamado'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isMaster && (
              <div className="hidden lg:flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#00a859] border border-green-100">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#00a859]" />
                Monitorando {Object.keys(stats.byCondo).length} Condomínios
              </div>
            )}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <Bell size={20} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#00a859]"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col gap-8"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total de Chamados" value={stats.total} icon={<Ticket className="text-blue-500" />} />
                  <StatCard label="Pendentes" value={stats.pendentes} icon={<Clock className="text-amber-500" />} />
                  <StatCard label="Em Andamento" value={stats.emAndamento} icon={<AlertCircle className="text-indigo-500" />} />
                  <StatCard label="Concluídos" value={stats.concluidos} icon={<CheckCircle2 className="text-green-500" />} />
                </div>

                {isMaster && Object.keys(stats.byCondo).length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
                      <Building2 size={20} className="text-[#00a859]" />
                      Chamados por Condomínio
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {Object.entries(stats.byCondo).map(([condo, count]) => (
                        <div key={condo} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
                          <span className="text-sm font-medium text-slate-700 truncate mr-2">{condo}</span>
                          <span className="rounded-full bg-[#00a859] px-2 py-0.5 text-[10px] font-bold text-white">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold md:text-3xl">
                      {isMaster ? 'Todos os Chamados' : 'Seus Chamados'}
                    </h2>
                    <p className="mt-1 text-slate-600">
                      {isMaster ? 'Gerencie as solicitações de todos os condomínios atendidos.' : 'Acompanhe e gerencie todos os tickets de manutenção.'}
                    </p>
                  </div>
                  <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-lg bg-[#00a859] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all"
                  >
                    <Ticket size={18} />
                    Novo Chamado
                  </button>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {['Todos', 'Pendente', 'Em Andamento', 'Concluído'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                        statusFilter === s 
                          ? 'bg-[#00a859] text-white shadow-md' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-[#00a859] hover:text-[#00a859]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00a859] border-t-transparent" />
                  </div>
                ) : filteredChamados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                    <AlertCircle size={48} className="mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-900">Nenhum chamado encontrado</h3>
                    <p className="text-slate-500">Aguardando novas solicitações de manutenção.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredChamados.map((chamado) => (
                      <ChamadoCard 
                        key={chamado.id} 
                        chamado={chamado} 
                        onEdit={() => handleEdit(chamado)}
                        onDelete={() => handleDelete(chamado.id)}
                        showCondo={isMaster}
                        isMaster={isMaster}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : view === 'history' ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Histórico de Chamados</h2>
                    <p className="text-slate-600">Filtre por período e gere relatórios detalhados.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={exportCSV}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Download size={18} />
                      Exportar CSV
                    </button>
                    <button 
                      onClick={exportPDF}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#00a859] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all"
                    >
                      <Download size={18} />
                      Exportar PDF
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Mês</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                        value={historyMonth}
                        onChange={(e) => setHistoryMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 pl-10 text-sm focus:border-[#00a859] focus:ring-[#00a859]"
                      >
                        <option value="all">Todos os Meses</option>
                        {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                          <option key={m} value={i}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Ano</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                        value={historyYear}
                        onChange={(e) => setHistoryYear(parseInt(e.target.value))}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 pl-10 text-sm focus:border-[#00a859] focus:ring-[#00a859]"
                      >
                        {[2024, 2025, 2026].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {isMaster && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Condomínio</label>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                          value={historyCondo}
                          onChange={(e) => setHistoryCondo(e.target.value)}
                          className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 pl-10 text-sm focus:border-[#00a859] focus:ring-[#00a859]"
                        >
                          <option value="all">Todos os Condomínios</option>
                          {Object.keys(stats.byCondo).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Condomínio</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyChamados.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                              Nenhum registro encontrado para este período.
                            </td>
                          </tr>
                        ) : (
                          historyChamados.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                {c.condominio}
                                <div className="text-[10px] text-slate-400">Bloco {c.bloco} • Apt {c.apto}</div>
                              </td>
                              <td className="px-6 py-4 capitalize">
                                {c.problemType}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  c.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                                  c.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button 
                                  onClick={() => handleEdit(c)}
                                  className="text-[#00a859] hover:underline font-bold"
                                >
                                  Ver Detalhes
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : view === 'condos' ? (
              <motion.div 
                key="condos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-8"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Gestão de Condomínios</h2>
                    <p className="text-slate-600">Cadastre e gerencie os acessos dos condomínios.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Create User Form */}
                  <div className="lg:col-span-1">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
                        <UserPlus size={20} className="text-[#00a859]" />
                        Novo Condomínio
                      </h3>
                      <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Login / Usuário</label>
                          <input 
                            type="text"
                            value={newUserLogin}
                            onChange={(e) => setNewUserLogin(e.target.value)}
                            placeholder="ex: condomino_alpha"
                            className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-[#00a859] focus:ring-[#00a859]"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Senha</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                              type="password"
                              value={newUserPass}
                              onChange={(e) => setNewUserPass(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-[#00a859] focus:ring-[#00a859]"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Nome do Condomínio</label>
                          <input 
                            type="text"
                            value={newUserCondo}
                            onChange={(e) => setNewUserCondo(e.target.value)}
                            placeholder="Nome do Condomínio"
                            className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-[#00a859] focus:ring-[#00a859]"
                            required
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={isCreatingUser}
                          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00a859] py-3 font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isCreatingUser ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Criar Acesso'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <tr>
                              <th className="px-6 py-4">Usuário</th>
                              <th className="px-6 py-4">Condomínio</th>
                              <th className="px-6 py-4">Tipo</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {users.map((u) => (
                              <tr key={u.login} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{u.login}</td>
                                <td className="px-6 py-4 text-slate-600">{u.condominio || 'Biotec Central'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === 'master' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {u.login !== 'admin@biotec.com' && (
                                    <button 
                                      onClick={() => handleDeleteUser(u.login)}
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">{view === 'create' ? 'Abertura de Chamado - Biotec' : 'Editar Chamado'}</h2>
                  <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Sucesso!</h3>
                      <p className="mt-2 text-slate-600">As informações foram salvas com sucesso.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      {isLocked && (
                        <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 flex items-center gap-3 text-amber-800">
                          <Lock size={20} />
                          <p className="text-sm font-medium">Este chamado foi concluído e não pode mais ser alterado por segurança.</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="condominio">Condomínio</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          {isMaster ? (
                            <select 
                              className={`w-full rounded-lg border-slate-200 py-3 pl-10 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859] ${isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                              id="condominio"
                              value={condominio}
                              onChange={(e) => setCondominio(e.target.value)}
                              disabled={isLocked}
                              required
                            >
                              <option value="">Selecione um Condomínio</option>
                              {users.filter(u => u.role === 'condo').map(u => (
                                <option key={u.login} value={u.condominio}>{u.condominio}</option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              className="w-full rounded-lg border-slate-200 bg-slate-100 cursor-not-allowed py-3 pl-10 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859]"
                              id="condominio"
                              placeholder="Nome do Condomínio"
                              value={condominio}
                              disabled
                              required
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo de Problema</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <ProblemOption 
                            id="interfone"
                            icon={<Phone size={24} />}
                            label="Interfone Ruim"
                            selected={problemType === 'interfone'}
                            onClick={() => setProblemType('interfone')}
                            disabled={isLocked}
                          />
                          <ProblemOption 
                            id="tv"
                            icon={<Tv size={24} />}
                            label="Sinal de TV"
                            selected={problemType === 'tv'}
                            onClick={() => setProblemType('tv')}
                            disabled={isLocked}
                          />
                          <ProblemOption 
                            id="outro"
                            icon={<MoreHorizontal size={24} />}
                            label="Outro"
                            selected={problemType === 'outro'}
                            onClick={() => setProblemType('outro')}
                            disabled={isLocked}
                          />
                        </div>
                      </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="areaComum"
                            checked={isAreaComum}
                            disabled={isLocked}
                            onChange={(e) => {
                              setIsAreaComum(e.target.checked);
                              if (e.target.checked) {
                                setBloco('Área Comum');
                                setApto('N/A');
                                // Se não houver tipo de problema selecionado, define como 'outro' por padrão para área comum
                                if (!problemType) setProblemType('outro');
                              } else {
                                setBloco('');
                                setApto('');
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#00a859] focus:ring-[#00a859] disabled:opacity-50"
                          />
                        <label htmlFor="areaComum" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Problema em Área Comum
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="bloco">Bloco</label>
                          <div className="relative">
                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              className={`w-full rounded-lg border-slate-200 py-3 pl-10 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859] ${isAreaComum || isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                              id="bloco"
                              placeholder="Ex: A"
                              value={bloco}
                              onChange={(e) => setBloco(e.target.value)}
                              disabled={isAreaComum || isLocked}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="apto">Apartamento</label>
                          <div className="relative">
                            <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              className={`w-full rounded-lg border-slate-200 py-3 pl-10 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859] ${isAreaComum || isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                              id="apto"
                              placeholder="Ex: 101"
                              value={apto}
                              onChange={(e) => setApto(e.target.value)}
                              disabled={isAreaComum || isLocked}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {view === 'edit' && (
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="status">Status</label>
                          <select 
                            id="status"
                            className={`w-full rounded-lg border-slate-200 py-3 px-4 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859] ${isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            disabled={isLocked}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Concluído">Concluído</option>
                          </select>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="descricao">Descrição do Chamado</label>
                        <textarea 
                          className={`w-full rounded-lg border-slate-200 p-4 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859] min-h-[100px] ${isLocked ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                          id="descricao"
                          placeholder="Descreva detalhadamente o seu problema aqui..."
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          disabled={isLocked}
                          required
                        />
                      </div>

                      {/* Image Upload for Problem */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Foto do Problema (Opcional)</label>
                        <div className="flex flex-wrap gap-4">
                          {imageUrl ? (
                            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200">
                              <Image src={imageUrl} alt="Problema" fill className="object-cover" />
                              {!isLocked && (
                                <button 
                                  type="button"
                                  onClick={() => removeImage('problem')}
                                  className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                                >
                                  <X size={12} />
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => setSelectedImage(imageUrl)}
                                className="absolute left-1 top-1 rounded-full bg-black/50 p-1 text-white shadow-md hover:bg-black/70"
                              >
                                <Maximize2 size={12} />
                              </button>
                            </div>
                          ) : !isLocked && (
                            <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-[#00a859] hover:bg-[#00a859]/5 hover:text-[#00a859]">
                              <Camera size={24} />
                              <span className="text-[10px] font-bold uppercase">Anexar Foto</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(e, 'problem')}
                                disabled={isUploading}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {isMaster && view === 'edit' && (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="resolucao">Resolução / Notas Técnicas</label>
                            <textarea 
                              className="w-full rounded-lg border-emerald-100 bg-emerald-50/30 p-4 text-slate-900 focus:border-[#00a859] focus:ring-[#00a859] min-h-[100px]"
                              id="resolucao"
                              placeholder="Descreva o que foi feito para resolver este chamado..."
                              value={resolucao}
                              onChange={(e) => setResolucao(e.target.value)}
                            />
                          </div>

                          {/* Image Upload for Resolution */}
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Foto da Resolução (Opcional)</label>
                            <div className="flex flex-wrap gap-4">
                              {resolutionImageUrl ? (
                                <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-slate-200">
                                  <Image src={resolutionImageUrl} alt="Resolução" fill className="object-cover" />
                                  <button 
                                    type="button"
                                    onClick={() => removeImage('resolution')}
                                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                                  >
                                    <X size={12} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setSelectedImage(resolutionImageUrl)}
                                    className="absolute left-1 top-1 rounded-full bg-black/50 p-1 text-white shadow-md hover:bg-black/70"
                                  >
                                    <Maximize2 size={12} />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-[#00a859] hover:bg-[#00a859]/5 hover:text-[#00a859]">
                                  <Camera size={24} />
                                  <span className="text-[10px] font-bold uppercase">Foto do Serviço</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(e, 'resolution')}
                                    disabled={isUploading}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {!isMaster && view === 'edit' && (resolucao || resolutionImageUrl) && (
                        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100 flex flex-col gap-3">
                          {resolucao && (
                            <div>
                              <label className="text-[10px] font-bold uppercase text-emerald-600 mb-1 block">Resposta da Biotec</label>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{resolucao}</p>
                            </div>
                          )}
                          {resolutionImageUrl && (
                            <div>
                              <label className="text-[10px] font-bold uppercase text-emerald-600 mb-1 block">Foto do Serviço Concluído</label>
                              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-emerald-200 cursor-pointer" onClick={() => setSelectedImage(resolutionImageUrl)}>
                                <Image src={resolutionImageUrl} alt="Resolução" fill className="object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                                  <Maximize2 size={20} className="text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setView('list')}
                          className={`${isLocked ? 'flex-1' : 'flex-1'} rounded-lg border border-slate-200 py-4 text-base font-bold text-slate-600 hover:bg-slate-50 transition-all`}
                        >
                          {isLocked ? 'Voltar' : 'Cancelar'}
                        </button>
                        {!isLocked && (
                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-[#00a859] py-4 text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <Send size={20} />
                                {view === 'edit' ? 'Salvar Alterações' : 'Enviar Chamado'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image Modal */}
          <AnimatePresence>
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                onClick={() => setSelectedImage(null)}
              >
                <button 
                  className="absolute right-6 top-6 text-white hover:text-slate-300"
                  onClick={() => setSelectedImage(null)}
                >
                  <X size={32} />
                </button>
                <div className="relative h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                  <Image 
                    src={selectedImage} 
                    alt="Visualização" 
                    fill 
                    className="object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className="rounded-lg bg-slate-50 p-2">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
        active ? 'bg-[#00a859]/10 text-[#00a859]' : 'text-slate-600 hover:bg-[#00a859]/10 hover:text-[#00a859]'
      }`}
    >
      {icon}
      <p className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{label}</p>
    </div>
  );
}

function ProblemOption({ id, icon, label, selected, onClick, disabled }: { id: string, icon: React.ReactNode, label: string, selected: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'
      } ${
        selected ? 'border-[#00a859] bg-[#00a859]/5 text-[#00a859]' : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {selected && (
        <div className="absolute inset-0 rounded-lg border-2 border-[#00a859]" />
      )}
    </div>
  );
}

function ChamadoCard({ chamado, onEdit, onDelete, showCondo, isMaster }: { chamado: Chamado, onEdit: () => void, onDelete: () => void, showCondo?: boolean, isMaster?: boolean }) {
  const statusColors = {
    'Pendente': 'bg-amber-100 text-amber-700 border-amber-200',
    'Em Andamento': 'bg-blue-100 text-blue-700 border-blue-200',
    'Concluído': 'bg-green-100 text-green-700 border-green-200'
  };

  const icons = {
    'interfone': <Phone size={16} />,
    'tv': <Tv size={16} />,
    'outro': <MoreHorizontal size={16} />
  };

  const isLocked = !isMaster && chamado.status === 'Concluído';

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider w-fit ${statusColors[chamado.status]}`}>
            {chamado.status === 'Pendente' && <Clock size={10} />}
            {chamado.status === 'Em Andamento' && <AlertCircle size={10} />}
            {chamado.status === 'Concluído' && <CheckCircle2 size={10} />}
            {chamado.status}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Calendar size={10} />
            {new Date(chamado.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#00a859]">
            {isLocked ? <Eye size={16} /> : <Edit3 size={16} />}
          </button>
          {isMaster && (
            <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-[#00a859]">
        {icons[chamado.problemType || 'outro']}
        <span className="text-sm font-bold capitalize">{chamado.problemType === 'interfone' ? 'Interfone' : chamado.problemType === 'tv' ? 'Sinal de TV' : 'Outro'}</span>
      </div>

      <h3 className="mb-1 text-base font-bold text-slate-900 truncate">{chamado.condominio}</h3>
      <p className="mb-4 text-xs text-slate-500">Bloco {chamado.bloco} • Apt {chamado.apto}</p>
      
      <p className="mb-4 line-clamp-2 text-sm text-slate-600 flex-1">
        {chamado.descricao}
      </p>

      {(chamado.imageUrl || chamado.resolutionImageUrl) && (
        <div className="mb-4 flex gap-2">
          {chamado.imageUrl && (
            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <Image src={chamado.imageUrl} alt="Problema" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <Paperclip size={10} className="text-white" />
              </div>
            </div>
          )}
          {chamado.resolutionImageUrl && (
            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50">
              <Image src={chamado.resolutionImageUrl} alt="Resolução" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                <CheckCircle2 size={10} className="text-emerald-600" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-medium">ID: {chamado.id.substring(0, 8)}</span>
        <span>{new Date(chamado.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
