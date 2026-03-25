/**
 * Parser do CSV de extrato da Uber Driver.
 *
 * A Uber exporta CSVs com nomes de colunas que variam conforme
 * a versão do app e o idioma configurado. O parser usa matching
 * flexível para encontrar as colunas corretas.
 *
 * Formatos conhecidos:
 *  - EN: Date, Trip or Adjustment, Fare, Your Earnings, Online Hours
 *  - PT: Data, Tipo, Tarifa, Seus Ganhos, Horas Online
 *  - Variações com prefixos/sufixos adicionais
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

// Candidatos de nome de coluna por campo
const COL_DATA = [
  'date', 'data', 'trip date', 'data da corrida',
  'datetime', 'data hora', 'periodo', 'period',
]
const COL_TIPO = [
  'trip or adjustment', 'tipo', 'description', 'descricao',
  'type', 'categoria', 'trip type', 'tipo de corrida',
]
const COL_BRUTO = [
  'fare', 'tarifa', 'gross fare', 'valor bruto', 'total fare',
  'gross earnings', 'ganho bruto', 'amount', 'valor total',
]
const COL_LIQUIDO = [
  'your earnings', 'seus ganhos', 'net earnings', 'earnings',
  'ganhos', 'valor liquido', 'repasse', 'net', 'liquido',
  'driver earnings', 'ganhos do motorista',
]
const COL_HORAS = [
  'online hours', 'horas online', 'hours online', 'online time',
  'horas', 'hours', 'duration', 'duracao', 'tempo online',
]
const COL_KM = [
  'distance', 'distancia', 'trip distance', 'distancia da viagem',
  'distance (km)', 'distancia (km)', 'km', 'quilometragem',
  'kilometers', 'quilometros', 'km rodados', 'km percorridos',
]

// Tipos que devem ser ignorados (não são corridas reais)
const TIPOS_IGNORAR = [
  'fee', 'taxa', 'cancellation', 'cancelamento',
  'tolls', 'pedagio', 'refund', 'reembolso',
  'adjustment fee', 'taxa de ajuste',
]

/** Detecta o tipo de lançamento a partir da descrição */
function detectarTipo(descricao: string): string {
  const n = normalizar(descricao)
  if (n.includes('tip') || n.includes('gorjeta')) return 'gorjeta'
  if (n.includes('bonus') || n.includes('bônus') || n.includes('incentivo') || n.includes('boost')) return 'bônus'
  if (n.includes('pet') || n.includes('comfort') || n.includes('black') || n.includes('moto')) return 'corrida'
  if (n.includes('delivery') || n.includes('entrega') || n.includes('eats')) return 'entrega'
  if (n.includes('trip') || n.includes('corrida') || n.includes('viagem')) return 'corrida'
  return 'corrida'
}

/** Verifica se o registro deve ser ignorado */
function deveIgnorar(descricao: string): boolean {
  const n = normalizar(descricao)
  return TIPOS_IGNORAR.some(t => n.includes(normalizar(t)))
}

export function parsearUber(
  conteudo: string,
): Omit<RegistroImportado, 'duplicado'>[] {
  const result = Papa.parse<Record<string, string>>(conteudo, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(
      'Não conseguimos ler este arquivo. Verifique se é o extrato correto da Uber em formato CSV.',
    )
  }

  const headers = result.meta.fields ?? []
  if (headers.length === 0) {
    throw new Error(
      'Arquivo CSV sem cabeçalhos. Verifique se é o extrato da Uber.',
    )
  }

  const colData    = encontrarColuna(headers, COL_DATA)
  const colTipo    = encontrarColuna(headers, COL_TIPO)
  const colBruto   = encontrarColuna(headers, COL_BRUTO)
  const colLiquido = encontrarColuna(headers, COL_LIQUIDO)
  const colHoras   = encontrarColuna(headers, COL_HORAS)
  const colKm      = encontrarColuna(headers, COL_KM)

  // Data e líquido são obrigatórios — sem eles não conseguimos importar
  if (!colData || !colLiquido) {
    throw new Error(
      'Não conseguimos ler este arquivo. Verifique se é o extrato correto da Uber em formato CSV.',
    )
  }

  const registros: Omit<RegistroImportado, 'duplicado'>[] = []

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]

    // Ignora linhas de resumo/total no final do arquivo
    const primeiroValor = Object.values(row)[0]?.trim() ?? ''
    if (normalizar(primeiroValor).startsWith('total') || normalizar(primeiroValor).startsWith('subtotal')) continue

    const descricao = colTipo ? (row[colTipo] ?? '') : ''

    // Ignora taxas, cancelamentos e outros não-corridas
    if (deveIgnorar(descricao)) continue

    const data = parsearData(row[colData] ?? '')
    if (!data) continue

    const valor_liquido = parsearValor(row[colLiquido])
    if (valor_liquido <= 0) continue

    const valor_bruto = colBruto
      ? parsearValor(row[colBruto])
      : valor_liquido // fallback se coluna de bruto não existir

    const horas_trabalhadas = parsearHoras(colHoras ? row[colHoras] : undefined)
    const km_rodados        = parsearKm(colKm ? row[colKm] : undefined)
    const tipo = detectarTipo(descricao)

    registros.push({
      data,
      plataforma: 'uber',
      tipo,
      valor_bruto: valor_bruto > 0 ? valor_bruto : valor_liquido,
      valor_liquido,
      horas_trabalhadas,
      km_rodados,
      _linhaOriginal: i + 2, // +2 para compensar o cabeçalho e o índice 0
    })
  }

  if (registros.length === 0) {
    throw new Error(
      'Nenhum registro de corrida encontrado no arquivo. ' +
      'Verifique se selecionou o período correto na Uber.',
    )
  }

  return registros
}
