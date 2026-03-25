/**
 * Parser do CSV de extrato do InDrive (inDriver).
 *
 * O InDrive exporta o histórico de corridas com colunas que variam
 * conforme a versão do app e idioma. O parser usa matching flexível.
 *
 * Formatos conhecidos:
 *  - PT: Data, Tipo de corrida, Valor total, Valor recebido, Distância (km), Duração
 *  - EN: Date, Trip type, Total amount, Your earnings, Distance, Duration
 *  - Variações com prefixos/sufixos ou colunas extras
 */
import Papa from 'papaparse'
import {
  encontrarColuna,
  normalizar,
  parsearData,
  parsearHoras,
  parsearKm,
  parsearValor,
} from './utils'
import type { RegistroImportado } from '../importar-extrato-modal'

const COL_DATA = [
  'data', 'date', 'data da corrida', 'data do servico', 'data do serviço',
  'data viagem', 'data hora', 'datetime', 'periodo', 'trip date', 'data de conclusao',
]
const COL_TIPO = [
  'tipo', 'tipo de corrida', 'tipo de servico', 'tipo de serviço', 'trip type',
  'categoria', 'descricao', 'description', 'type', 'servico', 'serviço',
]
const COL_BRUTO = [
  'valor total', 'total amount', 'valor bruto', 'tarifa', 'gross',
  'valor da corrida', 'fare', 'amount', 'gross fare', 'preco', 'preço',
]
const COL_LIQUIDO = [
  'valor recebido', 'your earnings', 'repasse', 'ganhos', 'net',
  'valor liquido', 'seus ganhos', 'net earnings', 'earnings', 'liquido',
  'valor pago', 'valor repassado', 'recebido',
]
const COL_DURACAO = [
  'duracao', 'duração', 'duration', 'tempo', 'time',
  'tempo de viagem', 'minutos', 'minutes', 'horas',
]
const COL_KM = [
  'distancia', 'distância', 'distance', 'km', 'quilometragem', 'quilometros',
  'distancia (km)', 'distance (km)', 'km da corrida', 'km percorridos',
  'km rodados', 'kilometers', 'quilômetros',
]

const TIPOS_IGNORAR = [
  'taxa', 'fee', 'cancelamento', 'cancellation',
  'ajuste', 'adjustment', 'reembolso', 'refund', 'estorno',
]

function detectarTipo(descricao: string): string {
  const n = normalizar(descricao)
  if (n.includes('gorjeta') || n.includes('tip')) return 'gorjeta'
  if (n.includes('bonus') || n.includes('bônus') || n.includes('incentivo')) return 'bônus'
  if (n.includes('entrega') || n.includes('delivery')) return 'entrega'
  return 'corrida'
}

function deveIgnorar(descricao: string): boolean {
  const n = normalizar(descricao)
  return TIPOS_IGNORAR.some(t => n.includes(normalizar(t)))
}

export function parsearInDrive(
  conteudo: string,
): Omit<RegistroImportado, 'duplicado'>[] {
  const result = Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(
      'Não conseguimos ler este arquivo. Verifique se é o extrato correto do InDrive em formato CSV.',
    )
  }

  const headers = result.meta.fields ?? []
  if (headers.length === 0) {
    throw new Error('Arquivo CSV sem cabeçalhos. Verifique se é o extrato do InDrive.')
  }

  const colData    = encontrarColuna(headers, COL_DATA)
  const colTipo    = encontrarColuna(headers, COL_TIPO)
  const colBruto   = encontrarColuna(headers, COL_BRUTO)
  const colLiquido = encontrarColuna(headers, COL_LIQUIDO)
  const colDuracao = encontrarColuna(headers, COL_DURACAO)
  const colKm      = encontrarColuna(headers, COL_KM)

  if (!colData || !colLiquido) {
    throw new Error(
      'Não conseguimos ler este arquivo. Verifique se é o extrato correto do InDrive em formato CSV.',
    )
  }

  const registros: Omit<RegistroImportado, 'duplicado'>[] = []

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]

    // Ignora linhas de totais/resumo
    const primeiro = Object.values(row)[0]?.trim() ?? ''
    if (normalizar(primeiro).startsWith('total') || normalizar(primeiro).startsWith('subtotal')) continue

    const descricao = colTipo ? (row[colTipo] ?? '') : ''
    if (deveIgnorar(descricao)) continue

    const data = parsearData(row[colData] ?? '')
    if (!data) continue

    const valor_liquido = parsearValor(row[colLiquido])
    if (valor_liquido <= 0) continue

    const valor_bruto = colBruto
      ? parsearValor(row[colBruto])
      : valor_liquido

    // Duração: InDrive pode exportar em minutos ou HH:MM
    let horas_trabalhadas: number | null = null
    if (colDuracao && row[colDuracao]) {
      const duracaoStr = row[colDuracao].trim()
      const somenteNum = duracaoStr.replace(/[^0-9:,\.]/g, '').trim()
      if (somenteNum.includes(':')) {
        const partes = somenteNum.split(':').map(Number)
        if (partes[0] !== undefined && partes[1] !== undefined) {
          horas_trabalhadas = partes[0] < 10 && partes[1] < 60
            ? partes[0] + partes[1] / 60
            : partes[0] / 60 + partes[1] / 3600
        }
      } else {
        const minutos = parseFloat(somenteNum.replace(',', '.'))
        if (!isNaN(minutos) && minutos > 0) {
          horas_trabalhadas = minutos > 24 ? minutos / 60 : minutos
        }
      }
      if (horas_trabalhadas !== null) {
        horas_trabalhadas = Math.round(horas_trabalhadas * 100) / 100
        if (horas_trabalhadas <= 0) horas_trabalhadas = null
      }
    }

    const km_rodados = parsearKm(colKm ? row[colKm] : undefined)

    registros.push({
      data,
      plataforma: 'indrive',
      tipo: detectarTipo(descricao),
      valor_bruto: valor_bruto > 0 ? valor_bruto : valor_liquido,
      valor_liquido,
      horas_trabalhadas,
      km_rodados,
      _linhaOriginal: i + 2,
    })
  }

  if (registros.length === 0) {
    throw new Error(
      'Nenhum registro de corrida encontrado no arquivo. ' +
      'Verifique se selecionou o período correto no InDrive.',
    )
  }

  return registros
}
