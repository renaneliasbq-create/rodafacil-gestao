-- ============================================================
-- SEED: Dados de exemplo para desenvolvimento
-- Execute APÓS o schema.sql e APÓS criar o primeiro usuário gestor
-- Substitua o UUID abaixo pelo ID real do seu usuário gestor
-- ============================================================

-- Veículos de exemplo
INSERT INTO public.veiculos (placa, modelo, marca, ano, cor, status, km_atual) VALUES
  ('ABC-1234', 'Onix', 'Chevrolet', 2022, 'Branco', 'alugado', 45000),
  ('DEF-5678', 'HB20', 'Hyundai', 2021, 'Prata', 'alugado', 62000),
  ('GHI-9012', 'Argo', 'Fiat', 2023, 'Preto', 'disponivel', 12000),
  ('JKL-3456', 'Polo', 'Volkswagen', 2022, 'Azul', 'manutencao', 38000);
