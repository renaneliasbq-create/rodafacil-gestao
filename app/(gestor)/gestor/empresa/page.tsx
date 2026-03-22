export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Building2 } from 'lucide-react'
import { NovoGastoCnpjForm } from './nova-form'
import { DeleteGasto } from './delete-btn'
import { EditarGasto } from './editar-gasto'

const LABEL: Record<string, string> = {
  'contador':            'Contador',
  'alvara':              'Alvará',
  'certificado_digital': 'Cert. Digital',
  'software':            'Software',
  'telefone_internet':   'Tel./Internet',
  'aluguel':             'Aluguel',
  'imposto':             'Imposto',
  'bancario':            'Bancário',
  'outro':               'Outro',
}

const COLOR: Record<string, string> = {
  'contador':            'bg-blue-100 text-blue-700',
  'alvara':              'bg-purple-100 text-purple-700',
  'certificado_digital': 'bg-teal-100 text-teal-700',
  'software':            'bg-indigo-100 text-indigo-700',
  'telefone_internet':   'bg-cyan-100 text-cyan-700',
  'aluguel':             'bg-orange-100 text-orange-700',
  'imposto':             'bg-red-100 text-red-700',
  'bancario':            'bg-yellow-100 text-yellow-700',
  'outro':               'bg-gray-100 text-gray-500',
}

function extractCategoria(descricao: string | null): string {
  if (!descricao) return 'outro'
  const match = descricao.match(/^\[CNPJ\] ([^:]+):/)
  return match ? match[1].trim() : 'outro'
}

function extractDescricao(descricao: string | null): string {
  if (!descricao) return '—'
  const match = descricao.match(/^\[CNPJ\] [^:]+: ?(.*)$/)
  return match?.[1]?.trim() || '—'
}

export default async function EmpresaPage() {
  const supabase = createClient()

  const { data: gastos } = await supabase
    .from('despesas')
    .select('*')
    .eq('categoria', 'administrativa')
    .is('veiculo_id', null)
    .is('motorista_id', null)
    .like('descricao', '[CNPJ]%')
    .order('data', { ascending: false })

  const totalGeral = (gastos ?? []).reduce((s, g) => s + g.valor, 0)

  // Totais por categoria
  const porCategoria: Record<string, number> = {}
  ;(gastos ?? []).forEach(g => {
    const cat = extractCategoria(g.descricao)
    porCategoria[cat] = (porCategoria[cat] ?? 0) + g.valor
  })

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Gastos do CNPJ</h1>
          <p className="text-gray-500 text-sm mt-0.5">Despesas administrativas da empresa · Total: {formatCurrency(totalGeral)}</p>
        </div>
        <NovoGastoCnpjForm />
      </div>

      {/* Totais por categoria */}
      {Object.keys(porCategoria).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(porCategoria) as [string, number][])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cat, val]) => (
              <div key={cat} className="card p-3">
                <span className={`badge text-xs ${COLOR[cat] ?? 'bg-gray-100 text-gray-500'}`}>
                  {LABEL[cat] ?? cat}
                </span>
                <p className="text-base font-bold text-gray-900 mt-2">{formatCurrency(val)}</p>
              </div>
            ))}
        </div>
      )}

      {/* Lista */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Todos os gastos</h2>
          <span className="ml-auto text-xs text-gray-400">{gastos?.length ?? 0} registros</span>
        </div>

        {gastos && gastos.length > 0 ? (
          <>
            <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <span>Data</span>
              <span>Categoria</span>
              <span>Descrição</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-gray-50">
              {gastos.map(g => {
                const cat = extractCategoria(g.descricao)
                const desc = extractDescricao(g.descricao)
                return (
                  <div key={g.id}>
                    {/* Mobile */}
                    <div className="sm:hidden px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className={`badge text-xs ${COLOR[cat] ?? 'bg-gray-100 text-gray-500'}`}>{LABEL[cat] ?? cat}</span>
                          <p className="text-sm text-gray-700 mt-1">{desc}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(g.data)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(g.valor)}</p>
                          <EditarGasto gasto={{ id: g.id, valor: g.valor, data: g.data, categoria: cat, descricao: desc }} />
                          <DeleteGasto id={g.id} />
                        </div>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-4 gap-4 items-center px-5 py-3">
                      <p className="text-sm text-gray-600">{formatDate(g.data)}</p>
                      <span className={`badge w-fit text-xs ${COLOR[cat] ?? 'bg-gray-100 text-gray-500'}`}>
                        {LABEL[cat] ?? cat}
                      </span>
                      <p className="text-sm text-gray-700">{desc}</p>
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(g.valor)}</p>
                        <EditarGasto gasto={{ id: g.id, valor: g.valor, data: g.data, categoria: cat, descricao: desc }} />
                        <DeleteGasto id={g.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="py-14 text-center">
            <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhum gasto registrado</p>
            <p className="text-xs text-gray-300 mt-1">Registre aqui as despesas administrativas do seu CNPJ</p>
          </div>
        )}
      </div>
    </div>
  )
}
