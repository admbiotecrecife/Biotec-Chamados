-- Tabela para gerenciar as equipes e seu status atual
CREATE TABLE IF NOT EXISTS equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_equipe TEXT NOT NULL, -- Ex: "Victor", "Aldiclei & Sérgio"
    tecnico_principal TEXT NOT NULL,
    ajudante TEXT,
    funcao TEXT, -- Ex: "Técnico", "Dono", "Gerente"
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
INSERT INTO equipes (nome_equipe, tecnico_principal, ajudante, funcao) 
VALUES 
('Victor', 'Victor', NULL, 'Técnico'),
('Aldiclei & Sérgio', 'Aldiclei', 'Sérgio', 'Técnico'),
('Wandell & Gabriel', 'Wandell', 'Gabriel', 'Dono / Técnico'),
('Patrick', 'Patrick', NULL, 'Gerente')
ON CONFLICT DO NOTHING;
