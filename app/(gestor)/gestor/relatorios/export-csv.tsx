'use client'

import { Download } from 'lucide-react'

interface ExportCSVProps {
  label: string
  filename: string
  headers: string[]
  rows: string[][]
}

export function ExportCSV({ label, filename, headers, rows }: ExportCSVProps) {
  function download() {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
    const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
    const csv = '\uFEFF' + lines.join('\n') // BOM para Excel reconhecer UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={download} className="btn-secondary text-xs gap-1.5">
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}
