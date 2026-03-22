import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { FileText, ExternalLink } from 'lucide-react'

const TIPO_LABELS: Record<string, string> = {
  cnh: 'CNH',
  contrato: 'Contrato',
  crlv: 'CRLV',
  outro: 'Outro',
}

const TIPO_COLORS: Record<string, string> = {
  cnh: 'bg-blue-100 text-blue-700',
  contrato: 'bg-purple-100 text-purple-700',
  crlv: 'bg-teal-100 text-teal-700',
  outro: 'bg-gray-100 text-gray-600',
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: documentos } = await supabase
    .from('documentos')
    .select('*')
    .eq('motorista_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Documentos</h1>
        <p className="text-gray-500 text-sm mt-0.5">Seus documentos e arquivos importantes</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Meus Documentos</h2>
          <span className="ml-auto text-xs text-gray-400">{documentos?.length ?? 0} arquivos</span>
        </div>

        {documentos && documentos.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {documentos.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
                {/* Ícone */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${TIPO_COLORS[doc.tipo] ?? TIPO_COLORS.outro}`}>
                      {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1 truncate">{doc.nome}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(doc.created_at)}
                    {doc.tamanho_bytes ? ` · ${formatBytes(doc.tamanho_bytes)}` : ''}
                  </p>
                </div>

                {/* Link */}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Abrir documento"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Nenhum documento disponível</p>
            <p className="text-xs text-gray-400 mt-1">Documentos enviados pelo gestor aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
