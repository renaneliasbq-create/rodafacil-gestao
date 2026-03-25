/**
 * Utilitários compartilhados por todos os parsers de CSV.
 * Roda no browser — sem imports de server.
 */

/** Remove acentos e caracteres especiais, transforma em minúsculas */
export function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Encontra um header do CSV dentre uma lista de candidatos possíveis.
 * Usa matching parcial bidirecional (o header contém o candidato OU vice-versa).
 */
export function encontrarColuna(
  headers: string[],
  candidatos: string[],
): string | null {
  const normHeaders = headers.map(h => ({ original: h, norm: normalizar(h) }))
  for (const c of candidatos) {
    const norm = normalizar(c)
    const found = normHeaders.find(
      h => h.norm === norm || h.norm.includes(norm) || norm.includes(h.norm),
    )
    if (found) return found.original
  }
  return null
}

/**
 * Converte string de data em vários formatos para YYYY-MM-DD.
 * Suporta: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, "Jan 15 2024", ISO, etc.
 */
export function parsearData(str: string): string | null {
  if (!str || !str.trim()) return null
  const s = str.trim()

  // YYYY-MM-DD (já no formato correto)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmY = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (dmY) {
    const [, d, m, y] = dmY
    // Se o segundo grupo > 12, é dia — caso contrário pode ser MM/DD
    if (parseInt(d) > 12) return `${y}-${m}-${d}`
    // Ambíguo: assumimos DD/MM no Brasil
    return `${y}-${m}-${d}`
  }

  // M/D/YYYY ou MM/DD/YYYY (formato norte-americano da Uber)
  const mdY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (mdY) {
    const [, m, d, y] = mdY
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Fallback: Date.parse (cobre "January 15, 2024", ISO completo, etc.)
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]

  return null
}

/**
 * Converte string de valor monetário em número.
 * Remove R$, $, espaços, trata vírgula como separador decimal.
 */
export function parsearValor(str: string | undefined): number {
  if (!str) return 0
  // Remove símbolos monetários e espaços
  let clean = str.replace(/[R$\s€£¥]/g, '').trim()
  // Se tem vírgula E ponto, decide qual é o decimal pelo contexto
  if (clean.includes(',') && clean.includes('.')) {
    // "1.234,56" → ponto é milhar, vírgula é decimal
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.')
    } else {
      // "1,234.56" → vírgula é milhar, ponto é decimal
      clean = clean.replace(/,/g, '')
    }
  } else {
    // Só vírgula → separador decimal brasileiro
    clean = clean.replace(',', '.')
  }
  const n = parseFloat(clean)
  return isNaN(n) ? 0 : Math.abs(n) // sempre positivo
}

/**
 * Converte string de duração em horas decimais.
 * Suporta: "6:30" (HH:MM), "6.5", "390" (minutos se > 24).
 */
export function parsearHoras(str: string | undefined): number | null {
  if (!str || !str.trim()) return null
  const s = str.trim()
  if (s.includes(':')) {
    const parts = s.split(':').map(Number)
    const h = parts[0] ?? 0
    const m = parts[1] ?? 0
    const result = h + m / 60
    return result > 0 ? Math.round(result * 100) / 100 : null
  }
  const n = parseFloat(s.replace(',', '.'))
  if (isNaN(n) || n <= 0) return null
  // Se maior que 24, provavelmente são minutos
  return n > 24 ? Math.round((n / 60) * 100) / 100 : n
}

/** Chave única de duplicata: data|valorLiquido|plataforma */
export function chaveDuplicata(
  data: string,
  valor_liquido: number,
  plataforma: string,
): string {
  return `${data}|${valor_liquido.toFixed(2)}|${plataforma}`
}
