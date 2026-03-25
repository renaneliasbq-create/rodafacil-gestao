/**
 * Parser do CSV de extrato do iFood (Portal do Entregador).
 *
 * O iFood exporta em Financeiro → Relatórios. O CSV costuma ter
 * colunas de Data, Descrição, Valor bruto e Valor líquido.
 * Não há coluna de horas — esse campo fica null.
 *
 * Formatos conhecidos:
 *  - PT: Data, Descrição, Valor bruto, Valor líquido
 *  - Variações: com "Tipo", "Pedido", "ID do pedido", valores negativos (estornos)
 */
import Papa from 'papaparse'
import {
  encontrarColuna,
  normalizar,
  parsearData,
  parsearValor,
} from './utils'
import type { RegistroImportado } from '../importar-extrato-modal'

const COL_DATA = [
  'data', 'date', 'data do pedido', 'data da entrega',
  'data hora', 'datetime', 'data de pagamento', 'data lancamento',
  'data lançamento', 'periodo', 'created at',
]
const COL_TIPO = [
  'descricao', 'descrição', 'description', 'tipo', 'type',
  'categoria', 'category', 'lancamento', 'lançamento',
  'historico', 'histórico', 'item',
]
const COL_BRUTO = [
  'valor bruto', 'gross', 'valor total', 'total', 'fare',
  'valor da entrega', 'gross amount', 'valor pedido',
]
const COL_LIQUIDO = [
  'valor liquido', 'valor líquido', 'net', 'net amount',
  'seus ganhos', 'ganhos', 'repasse', 'valor repassado',
  'earnings', 'liquido', 'líquido', 'valor pago',
]

// Lançamentos que devem ser ignorados (negativos = estornos, taxas)
const TIPOS_IGNORAR = [
  'estorno', 'chargeback', 'taxa', 'fee', 'desconto',
  'cancelamento', 'cancellation', 'multa', 'cobranca', 'cobrança',
  'ajuste negativo', 'negative adjustment',
]

// Lançamentos positivos que não são entregas reais mas devem ser importados
// (gorjeta, bônus) — mantidos com tipo correto
function detectarTipo(descricao: string): string {
  const n = normalizar(descricao)
  if (n.includes('gorjeta') || n.includes('tip')) return 'gorjeta'
  if (
    n.includes('bonus') || n.includes('bônus') ||
    n.includes('incentivo') || n.includes('programa') ||
    n.includes('recompensa')
  ) return 'bônus'
  if (n.includes('ajuste') || n.includes('adjustment')) return 'ajuste'
  // Padrão do iFood é entrega
  return 'entrega'
}

function deveIgnorar(descricao: string, valorLiquido: number): boolean {
  const n = normalizar(descricao)
  // Ignora estornos e taxas pelo nome
  if (TIPOS_IGNORAR.some(t => n.includes(normalizar(t)))) return true
  // Ignora valores negativos (estornos sem descrição clara)
  if (valorLiquido < 0) return true
  return false
}

export function parsearIfood(
  conteudo: string,
): Omit<RegistroImportado, 'duplicado'>[] {
  const result = Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(
      'Não conseguimos ler este arquivo. Verifique se é o extrato correto do iFood em formato CSV.',
    )
  }

  const headers = result.meta.fields ?? []
  if (headers.length === 0) {
    throw new Error('Arquivo CSV sem cabeçalhos. Verifique se é o extrato do iFood.')
  }

  const colData    = encontrarColuna(headers, COL_DATA)
  const colTipo    = encontrarColuna(headers, COL_TIPO)
  const colBruto   = encontrarColuna(headers, COL_BRUTO)
  const colLiquido = encontrarColuna(headers, COL_LIQUIDO)

  if (!colData || !colLiquido) {
    throw new Error(
      'Não conseguimos ler este arquivo. Verifique se é o extrato correto do iFood em formato CSV.',
    )
  }

  const registros: Omit<RegistroImportado, 'duplicado'>[] = []

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]

    // Ignora linhas de totais/resumo no rodapé
    const primeiro = Object.values(row)[0]?.trim() ?? ''
    const primNorm = normalizar(primeiro)
    if (
      primNorm.startsWith('total') ||
      primNorm.startsWith('subtotal') ||
      primNorm.startsWith('soma')
    ) continue

    const descricao     = colTipo ? (row[colTipo] ?? '') : ''
    const valor_liquido = parsearValor(row[colLiquido])

    if (deveIgnorar(descricao, valor_liquido)) continue
    if (valor_liquido <= 0) continue

    const data = parsearData(row[colData] ?? '')
    if (!data) continue

    const valor_bruto = colBruto
      ? parsearValor(row[colBruto])
      : valor_liquido

    registros.push({
      data,
      plataforma: 'ifood',
      tipo: detectarTipo(descricao),
      valor_bruto: valor_bruto > 0 ? valor_bruto : valor_liquido,
      valor_liquido,
      horas_trabalhadas: null, // iFood não exporta horas
      km_rodados: null,        // iFood não exporta km
      _linhaOriginal: i + 2,
    })
  }

  if (registros.length === 0) {
    throw new Error(
      'Nenhum registro de entrega encontrado no arquivo. ' +
      'Verifique se selecionou o período correto no iFood.',
    )
  }

  return registros
}
