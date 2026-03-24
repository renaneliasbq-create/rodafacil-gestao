/**
 * Definição dos planos disponíveis no Roda Fácil
 *
 * Preços em centavos (R$19,90 = 1990)
 * plano: chave única usada na tabela assinaturas
 */

export type PlanoId = 'motorista_pro' | 'gestor_starter' | 'gestor_pro' | 'gestor_frota'
export type Perfil = 'motorista' | 'gestor'

export interface Plano {
  id: PlanoId
  perfil: Perfil
  nome: string
  descricao: string
  preco_mensal: number   // centavos
  preco_anual: number    // centavos (por mês, cobrado anualmente)
  limite_veiculos: number | null   // null = ilimitado
  features: string[]
  destaque?: boolean
}

export const PLANOS: Plano[] = [
  {
    id: 'motorista_pro',
    perfil: 'motorista',
    nome: 'Motorista Pro',
    descricao: 'Controle completo dos seus ganhos e despesas',
    preco_mensal: 1990,      // R$ 19,90/mês
    preco_anual: 1590,       // R$ 15,90/mês (cobrado R$ 190,80/ano)
    limite_veiculos: null,
    features: [
      'Registro de ganhos diários',
      'Controle de despesas',
      'Metas mensais',
      'Relatórios de desempenho',
      'Histórico completo',
    ],
  },
  {
    id: 'gestor_starter',
    perfil: 'gestor',
    nome: 'Starter',
    descricao: 'Ideal para frotas pequenas',
    preco_mensal: 4990,      // R$ 49,90/mês
    preco_anual: 3990,       // R$ 39,90/mês (cobrado R$ 478,80/ano)
    limite_veiculos: 5,
    features: [
      'Até 5 veículos',
      'Controle de despesas',
      'Gestão de motoristas',
      'Vencimentos e alertas',
      'Relatórios básicos',
    ],
  },
  {
    id: 'gestor_pro',
    perfil: 'gestor',
    nome: 'Pro',
    descricao: 'Para frotas em crescimento',
    preco_mensal: 9990,      // R$ 99,90/mês
    preco_anual: 7990,       // R$ 79,90/mês (cobrado R$ 958,80/ano)
    limite_veiculos: 20,
    destaque: true,
    features: [
      'Até 20 veículos',
      'Tudo do Starter',
      'Contratos digitais',
      'Gestão de multas e parcelas',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  },
  {
    id: 'gestor_frota',
    perfil: 'gestor',
    nome: 'Frota',
    descricao: 'Frotas grandes sem limite',
    preco_mensal: 19990,     // R$ 199,90/mês
    preco_anual: 15990,      // R$ 159,90/mês (cobrado R$ 1.918,80/ano)
    limite_veiculos: null,
    features: [
      'Veículos ilimitados',
      'Tudo do Pro',
      'API de integração',
      'Onboarding dedicado',
      'Gerente de conta',
    ],
  },
]

export function getPlano(id: PlanoId): Plano {
  const plano = PLANOS.find(p => p.id === id)
  if (!plano) throw new Error(`Plano "${id}" não encontrado`)
  return plano
}

export function getPlanosPorPerfil(perfil: Perfil): Plano[] {
  return PLANOS.filter(p => p.perfil === perfil)
}

/** Retorna o preço em centavos conforme período */
export function precoDoPeriodo(plano: Plano, periodo: 'mensal' | 'anual'): number {
  return periodo === 'anual' ? plano.preco_anual * 12 : plano.preco_mensal
}

/** Formata centavos para R$ */
export function fmtPreco(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
