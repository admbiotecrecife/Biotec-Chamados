-- Tabela para gerenciar as equipes e seu status atual
CREATE TABLE IF NOT EXISTS equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_equipe TEXT NOT NULL, -- Ex: "Victor", "Aldiclei & Sérgio"
    tecnico_principal TEXT NOT NULL,
    ajudante TEXT,
    local_atual TEXT, -- Nome do condomínio ou "Base"
    status TEXT DEFAULT 'Disponível', -- 'Disponível', 'Em Atendimento', 'Emergência', 'Deslocamento'
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para registros de Manutenção Preventiva
CREATE TABLE IF NOT EXISTS preventivas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condominio TEXT NOT NULL,
    data_visita TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tecnico_responsavel TEXT NOT NULL,
    equipe_id UUID REFERENCES equipes(id),
    itens_verificados JSONB, -- Lista de itens checados
    observacoes TEXT,
    proxima_visita DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir as equipes iniciais
INSERT INTO equipes (nome_equipe, tecnico_principal, ajudante) 
VALUES 
('Victor', 'Victor', NULL),
('Aldiclei & Sérgio', 'Aldiclei', 'Sérgio')
ON CONFLICT DO NOTHING;
