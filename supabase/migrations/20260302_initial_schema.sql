-- Initial Schema for Biotec Chamados

-- Table for Users (Condos and Master)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login TEXT UNIQUE NOT NULL,
  pass TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'condo',
  condominio TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Chamados (Tickets)
CREATE TABLE IF NOT EXISTS chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio TEXT NOT NULL,
  bloco TEXT NOT NULL,
  apto TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  descricao TEXT NOT NULL,
  resolucao TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  prioridade TEXT NOT NULL DEFAULT 'Média',
  created_by TEXT NOT NULL,
  image_url TEXT,
  resolution_image_url TEXT,
  feedback_rating INTEGER,
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial master admin
-- Note: In production, you should use Supabase Auth for passwords
-- This schema matches the current in-memory logic for simplicity
INSERT INTO users (login, pass, role, condominio)
VALUES ('admin@biotec.com', '123456', 'master', 'Biotec Central')
ON CONFLICT (login) DO NOTHING;

-- Insert a test condo user
INSERT INTO users (login, pass, role, condominio)
VALUES ('condominioteste', 'teste', 'condo', 'Condomínio Teste')
ON CONFLICT (login) DO NOTHING;

-- Trigger to update updated_at on chamados
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chamados_updated_at
BEFORE UPDATE ON chamados
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
