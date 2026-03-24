// Utilities compartilhadas entre o Server Component (page.tsx) e o Client Component (ganhos-client.tsx)
// NÃO marcar como 'use client' — precisa funcionar no servidor

const PLATAFORMAS_LIST = [
  { valor: 'uber',    label: 'Uber' },
  { valor: '99',      label: '99' },
  { valor: 'ifood',   label: 'iFood' },
  { valor: 'indrive', label: 'Indrive' },
  { valor: 'outro',   label: 'Outro' },
]

export const BADGE: Record<string, string> = {
  uber:    'bg-black text-white',
  '99':    'bg-yellow-400 text-yellow-900',
  ifood:   'bg-red-500 text-white',
  indrive: 'bg-emerald-600 text-white',
  outro:   'bg-gray-400 text-white',
}

export function labelPlataforma(valor: string) {
  return PLATAFORMAS_LIST.find(p => p.valor === valor)?.label ?? valor
}

export function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
