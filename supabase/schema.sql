-- ============================================================
-- RODA FÁCIL — Schema completo do banco de dados
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TABELA: users (perfil público, vinculado ao auth.users) ──
CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  tipo        TEXT        NOT NULL CHECK (tipo IN ('motorista', 'gestor')),
  telefone    TEXT,
  cpf         TEXT        UNIQUE,
  cnh         TEXT,
  endereco    TEXT,
  foto_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: veiculos ──────────────────────────────────────────
CREATE TABLE public.veiculos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  placa       TEXT        NOT NULL UNIQUE,
  modelo      TEXT        NOT NULL,
  marca       TEXT        NOT NULL,
  ano         INTEGER     NOT NULL,
  cor         TEXT,
  chassi      TEXT        UNIQUE,
  status      TEXT        NOT NULL DEFAULT 'disponivel'
              CHECK (status IN ('alugado', 'disponivel', 'manutencao')),
  foto_url    TEXT,
  km_atual    INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: contratos ─────────────────────────────────────────
CREATE TABLE public.contratos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id    UUID        NOT NULL REFERENCES public.users(id),
  veiculo_id      UUID        NOT NULL REFERENCES public.veiculos(id),
  valor_aluguel   DECIMAL(10,2) NOT NULL,
  periodicidade   TEXT        NOT NULL CHECK (periodicidade IN ('semanal', 'quinzenal', 'mensal')),
  data_inicio     DATE        NOT NULL,
  data_fim        DATE,
  status          TEXT        NOT NULL DEFAULT 'ativo'
                  CHECK (status IN ('ativo', 'suspenso', 'encerrado')),
  caucao_valor    DECIMAL(10,2),
  caucao_pago     BOOLEAN     DEFAULT FALSE,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: pagamentos ────────────────────────────────────────
CREATE TABLE public.pagamentos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id       UUID        NOT NULL REFERENCES public.contratos(id),
  motorista_id      UUID        NOT NULL REFERENCES public.users(id),
  valor             DECIMAL(10,2) NOT NULL,
  data_vencimento   DATE        NOT NULL,
  data_pagamento    DATE,
  status            TEXT        NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pago', 'pendente', 'atrasado')),
  forma_pagamento   TEXT        CHECK (forma_pagamento IN ('pix', 'boleto', 'dinheiro', 'transferencia')),
  referencia        TEXT,
  observacao        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: manutencoes ───────────────────────────────────────
CREATE TABLE public.manutencoes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id      UUID        NOT NULL REFERENCES public.veiculos(id),
  tipo            TEXT        NOT NULL,
  descricao       TEXT,
  valor           DECIMAL(10,2),
  quilometragem   INTEGER,
  data            DATE        NOT NULL,
  created_by      UUID        REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: quilometragem ─────────────────────────────────────
CREATE TABLE public.quilometragem (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id      UUID        NOT NULL REFERENCES public.veiculos(id),
  motorista_id    UUID        REFERENCES public.users(id),
  mes             INTEGER     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano             INTEGER     NOT NULL,
  km_total        INTEGER     NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (veiculo_id, mes, ano)
);

-- ── TABELA: multas ────────────────────────────────────────────
CREATE TABLE public.multas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id      UUID        NOT NULL REFERENCES public.veiculos(id),
  motorista_id    UUID        REFERENCES public.users(id),
  data            DATE        NOT NULL,
  infracao        TEXT        NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('paga', 'pendente')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: despesas ──────────────────────────────────────────
CREATE TABLE public.despesas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria       TEXT        NOT NULL
                  CHECK (categoria IN (
                    'manutencao', 'emplacamento', 'ipva', 'seguro',
                    'multa', 'combustivel', 'administrativa', 'outro'
                  )),
  valor           DECIMAL(10,2) NOT NULL,
  data            DATE        NOT NULL,
  veiculo_id      UUID        REFERENCES public.veiculos(id),
  motorista_id    UUID        REFERENCES public.users(id),
  descricao       TEXT,
  created_by      UUID        REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABELA: documentos ────────────────────────────────────────
CREATE TABLE public.documentos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id    UUID        REFERENCES public.users(id),
  veiculo_id      UUID        REFERENCES public.veiculos(id),
  tipo            TEXT        NOT NULL
                  CHECK (tipo IN ('cnh', 'contrato', 'crlv', 'outro')),
  nome            TEXT        NOT NULL,
  url             TEXT        NOT NULL,
  tamanho_bytes   INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: atualizar updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_veiculos_updated_at
  BEFORE UPDATE ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TRIGGER: criar perfil em public.users ao cadastrar no auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nome, email, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'motorista')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Garante isolamento total entre motoristas no nível do banco
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quilometragem  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos     ENABLE ROW LEVEL SECURITY;

-- Helper: verificar se o usuário logado é gestor
CREATE OR REPLACE FUNCTION public.is_gestor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND tipo = 'gestor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── RLS: users ────────────────────────────────────────────────
-- Gestor vê todos; motorista vê apenas si mesmo
CREATE POLICY "gestor_select_all_users"   ON public.users FOR SELECT USING (public.is_gestor());
CREATE POLICY "motorista_select_own_user" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "gestor_insert_users"       ON public.users FOR INSERT WITH CHECK (public.is_gestor());
CREATE POLICY "gestor_update_users"       ON public.users FOR UPDATE USING (public.is_gestor());
CREATE POLICY "user_update_own"           ON public.users FOR UPDATE USING (id = auth.uid());

-- ── RLS: veiculos ─────────────────────────────────────────────
-- Gestor: acesso total. Motorista: vê apenas o veículo do seu contrato ativo
CREATE POLICY "gestor_all_veiculos" ON public.veiculos FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_select_veiculo" ON public.veiculos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contratos
    WHERE contratos.veiculo_id = veiculos.id
      AND contratos.motorista_id = auth.uid()
      AND contratos.status = 'ativo'
  )
);

-- ── RLS: contratos ────────────────────────────────────────────
CREATE POLICY "gestor_all_contratos"       ON public.contratos FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_own_contratos"    ON public.contratos FOR SELECT USING (motorista_id = auth.uid());

-- ── RLS: pagamentos ───────────────────────────────────────────
CREATE POLICY "gestor_all_pagamentos"      ON public.pagamentos FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_own_pagamentos"   ON public.pagamentos FOR SELECT USING (motorista_id = auth.uid());

-- ── RLS: manutencoes ──────────────────────────────────────────
CREATE POLICY "gestor_all_manutencoes"     ON public.manutencoes FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_see_manutencoes"  ON public.manutencoes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contratos
    WHERE contratos.veiculo_id = manutencoes.veiculo_id
      AND contratos.motorista_id = auth.uid()
  )
);

-- ── RLS: quilometragem ────────────────────────────────────────
CREATE POLICY "gestor_all_km"              ON public.quilometragem FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_own_km"           ON public.quilometragem FOR SELECT USING (motorista_id = auth.uid());

-- ── RLS: multas ───────────────────────────────────────────────
CREATE POLICY "gestor_all_multas"          ON public.multas FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_own_multas"       ON public.multas FOR SELECT USING (motorista_id = auth.uid());

-- ── RLS: despesas ─────────────────────────────────────────────
-- Apenas gestor vê despesas (dados financeiros internos)
CREATE POLICY "gestor_all_despesas"        ON public.despesas FOR ALL USING (public.is_gestor());

-- ── RLS: documentos ───────────────────────────────────────────
CREATE POLICY "gestor_all_docs"            ON public.documentos FOR ALL USING (public.is_gestor());
CREATE POLICY "motorista_own_docs"         ON public.documentos FOR SELECT USING (motorista_id = auth.uid());

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_contratos_motorista  ON public.contratos(motorista_id);
CREATE INDEX idx_contratos_veiculo    ON public.contratos(veiculo_id);
CREATE INDEX idx_contratos_status     ON public.contratos(status);
CREATE INDEX idx_pagamentos_motorista ON public.pagamentos(motorista_id);
CREATE INDEX idx_pagamentos_status    ON public.pagamentos(status);
CREATE INDEX idx_pagamentos_vencto    ON public.pagamentos(data_vencimento);
CREATE INDEX idx_manutencoes_veiculo  ON public.manutencoes(veiculo_id);
CREATE INDEX idx_multas_motorista     ON public.multas(motorista_id);
CREATE INDEX idx_multas_veiculo       ON public.multas(veiculo_id);
CREATE INDEX idx_despesas_data        ON public.despesas(data);
CREATE INDEX idx_km_veiculo_ano       ON public.quilometragem(veiculo_id, ano);
