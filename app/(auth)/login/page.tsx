import { LoginForm } from './login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden">

      {/* ── Painel esquerdo: branding ── */}
      <div className="hidden lg:flex flex-col justify-between bg-blue-800 p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
            </svg>
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">
            Roda<span className="text-blue-300">Fácil</span><span className="text-blue-200 text-base font-bold ml-0.5">SC</span>
          </span>
        </div>

        {/* Texto central */}
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-snug mb-4">
            A gestão que você<br />precisava
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Uma plataforma completa para donos de frota e motoristas independentes.
          </p>

          {/* Para donos de frota */}
          <div className="mb-6">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">Para donos de frota</p>
            <ul className="space-y-2">
              {[
                'Dashboard financeiro em tempo real',
                'Controle de receitas e inadimplência',
                'Payback e rentabilidade por veículo',
                'Alertas de vencimento de documentos',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Para motoristas */}
          <div>
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3">Para motoristas</p>
            <ul className="space-y-2">
              {[
                'Lucro real por plataforma (Uber, 99, iFood)',
                'Controle de ganhos, despesas e KM',
                'Calculadora de ganho por hora e por km',
                'Alertas de CNH, CRLV e revisão',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="w-4 h-4 bg-emerald-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-blue-300/50 text-xs">
          © 2025 RodaFácil SC · Santa Catarina, SC
        </p>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div className="bg-white flex flex-col justify-center p-8 sm:p-10">
        {/* Logo mobile */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 00.8-.4l3-4A1 1 0 0018 9h-5V5a1 1 0 00-1-1H3z"/>
            </svg>
          </div>
          <span className="font-extrabold text-lg text-blue-900">
            Roda<span className="text-blue-600">Fácil</span><span className="text-blue-400 text-sm font-bold ml-0.5">SC</span>
          </span>
        </div>

        {/* Erro de sessão */}
        {searchParams.error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            Sessão expirada. Faça login novamente.
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
