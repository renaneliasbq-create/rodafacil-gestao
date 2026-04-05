/** Converte searchParams para intervalo de datas */
export function parsePeriodo(params: {
  de?: string
  ate?: string
  mes?: string
}): { de: string; ate: string } {
  if (params.de && params.ate) return { de: params.de, ate: params.ate }
  const hoje = new Date()
  const mesParam =
    params.mes ??
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [anoStr, mesStr] = mesParam.split('-')
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)
  return {
    de:  `${ano}-${String(mes).padStart(2, '0')}-01`,
    ate: new Date(ano, mes, 0).toISOString().split('T')[0],
  }
}

/** Label legível para o intervalo (ex: "Março 2026" ou "Jan – Mar 2026") */
export function labelPeriodo(de: string, ate: string): string {
  const d = new Date(de  + 'T12:00:00')
  const a = new Date(ate + 'T12:00:00')
  if (d.getFullYear() === a.getFullYear() && d.getMonth() === a.getMonth()) {
    return d
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase())
  }
  const m1 = d.toLocaleDateString('pt-BR', { month: 'short' })
  const m2 = a.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  return `${m1} – ${m2}`.replace(/^\w/, c => c.toUpperCase())
}

/** True se de/ate cobrem exatamente um mês calendário */
export function isSingleMonth(de: string, ate: string): boolean {
  const d = new Date(de  + 'T12:00:00')
  const a = new Date(ate + 'T12:00:00')
  return (
    d.getFullYear() === a.getFullYear() &&
    d.getMonth()    === a.getMonth()
  )
}
