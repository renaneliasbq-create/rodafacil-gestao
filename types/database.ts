// ============================================================
// Tipos TypeScript espelhando o schema do Supabase
// ============================================================

export type UserTipo = 'motorista' | 'gestor'
export type VeiculoStatus = 'alugado' | 'disponivel' | 'manutencao'
export type ContratoStatus = 'ativo' | 'suspenso' | 'encerrado'
export type PagamentoStatus = 'pago' | 'pendente' | 'atrasado'
export type FormaPagamento = 'pix' | 'boleto' | 'dinheiro' | 'transferencia'
export type Periodicidade = 'semanal' | 'quinzenal' | 'mensal'
export type MultaStatus = 'paga' | 'pendente'
export type DocumentoTipo = 'cnh' | 'contrato' | 'crlv' | 'outro'
export type DespesaCategoria =
  | 'manutencao' | 'emplacamento' | 'ipva' | 'seguro'
  | 'multa' | 'combustivel' | 'administrativa' | 'outro'

export interface User {
  id: string
  nome: string
  email: string
  tipo: UserTipo
  telefone?: string
  cpf?: string
  cnh?: string
  endereco?: string
  foto_url?: string
  created_at: string
  updated_at: string
}

export interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string
  ano: number
  cor?: string
  chassi?: string
  status: VeiculoStatus
  foto_url?: string
  km_atual?: number
  created_at: string
  updated_at: string
}

export interface Contrato {
  id: string
  motorista_id: string
  veiculo_id: string
  valor_aluguel: number
  periodicidade: Periodicidade
  data_inicio: string
  data_fim?: string
  status: ContratoStatus
  caucao_valor?: number
  caucao_pago?: boolean
  observacoes?: string
  created_at: string
  updated_at: string
  // Joins
  motorista?: User
  veiculo?: Veiculo
}

export interface Pagamento {
  id: string
  contrato_id: string
  motorista_id: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: PagamentoStatus
  forma_pagamento?: FormaPagamento
  referencia?: string
  observacao?: string
  created_at: string
  // Joins
  motorista?: User
  contrato?: Contrato
}

export interface Manutencao {
  id: string
  veiculo_id: string
  tipo: string
  descricao?: string
  valor?: number
  quilometragem?: number
  data: string
  created_by?: string
  created_at: string
  // Joins
  veiculo?: Veiculo
}

export interface Quilometragem {
  id: string
  veiculo_id: string
  motorista_id?: string
  mes: number
  ano: number
  km_total: number
  created_at: string
}

export interface Multa {
  id: string
  veiculo_id: string
  motorista_id?: string
  data: string
  infracao: string
  valor: number
  status: MultaStatus
  created_at: string
  // Joins
  veiculo?: Veiculo
  motorista?: User
}

export interface Despesa {
  id: string
  categoria: DespesaCategoria
  valor: number
  data: string
  veiculo_id?: string
  motorista_id?: string
  descricao?: string
  created_by?: string
  created_at: string
  // Joins
  veiculo?: Veiculo
  motorista?: User
}

export interface Documento {
  id: string
  motorista_id?: string
  veiculo_id?: string
  tipo: DocumentoTipo
  nome: string
  url: string
  tamanho_bytes?: number
  created_at: string
}

// ── Tipos para o Dashboard ────────────────────────────────────

export interface DashboardMetrics {
  receitaMesAtual: number
  receitaMesAnterior: number
  totalMotoristasAtivos: number
  totalVeiculos: number
  inadimplenciaQtd: number
  inadimplenciaValor: number
  despesasMes: number
  lucroEstimado: number
}

export interface ReceitaDespesaMensal {
  mes: string
  receita: number
  despesa: number
}

export interface RankingMotorista {
  motorista: User
  totalPago: number
  totalAtrasado: number
  pontualidade: number // 0-100%
}
