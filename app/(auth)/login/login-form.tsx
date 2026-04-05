'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { signIn, signUpMotoApp, signUpGestor, type LoginState, type SignUpState } from './actions'
import { Eye, EyeOff, Loader2, LogIn, ArrowLeft, Car, Smartphone, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Perfil = 'gestor' | 'motorista_app'
type Tab    = 'login' | 'cadastro'

// ─── Botões de submit ────────────────────────────────────────
function SubmitLogin() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 mt-2">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</> : <><LogIn className="w-4 h-4" />Entrar</>}
    </button>
  )
}

function SubmitCadastro() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Criando conta...</> : <><UserPlus className="w-4 h-4" />Criar minha conta</>}
    </button>
  )
}

// ─── Campo de senha com toggle ───────────────────────────────
function SenhaInput({ name, placeholder = '••••••••', label }: { name: string; placeholder?: string; label: string }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="relative">
        <input name={name} type={show ? 'text' : 'password'} required placeholder={placeholder} className="input pr-11" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Botões OAuth ────────────────────────────────────────────
function BotoesOAuth({ perfil }: { perfil: Perfil }) {
  const [loading, setLoading] = useState(false)

  async function entrarComGoogle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?perfil=${perfil}`,
      },
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors font-semibold text-gray-700 text-sm min-h-[44px] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continuar com Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    </div>
  )
}

// ─── Formulário de login ────────────────────────────────────
function FormLogin() {
  const [state, formAction] = useFormState<LoginState, FormData>(signIn, null)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Erro msg={state.error} />}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
        <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className="input" />
      </div>
      <SenhaInput name="password" label="Senha" />
      <SubmitLogin />
    </form>
  )
}

// ─── Formulário de cadastro (motorista_app) ─────────────────
function FormCadastro() {
  const [state, formAction] = useFormState<SignUpState, FormData>(signUpMotoApp, null)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Erro msg={state.error} />}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome completo</label>
        <input name="nome" type="text" required autoComplete="name" placeholder="Seu nome" className="input" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
        <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className="input" />
      </div>
      <SenhaInput name="password" label="Senha" placeholder="Mínimo 6 caracteres" />
      <SenhaInput name="confirm" label="Confirmar senha" />
      <SubmitCadastro />
    </form>
  )
}

// ─── Formulário de cadastro (gestor) ────────────────────────
function FormCadastroGestor() {
  const [state, formAction] = useFormState<SignUpState, FormData>(signUpGestor, null)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <Erro msg={state.error} />}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="text-blue-600 text-lg">🎁</span>
        <p className="text-sm text-blue-700 font-medium">30 dias grátis, sem cartão de crédito</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome completo</label>
        <input name="nome" type="text" required autoComplete="name" placeholder="Seu nome" className="input" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
        <input name="email" type="email" required autoComplete="email" placeholder="seu@email.com" className="input" />
      </div>
      <SenhaInput name="password" label="Senha" placeholder="Mínimo 6 caracteres" />
      <SenhaInput name="confirm" label="Confirmar senha" />
      <button type="submit" className="btn-primary w-full py-3 mt-2">
        <UserPlus className="w-4 h-4" />
        Começar grátis por 30 dias
      </button>
    </form>
  )
}

// ─── Componente de erro ─────────────────────────────────────
function Erro({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
      </svg>
      {msg}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────
export function LoginForm() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [tab, setTab]       = useState<Tab>('login')

  // ── Passo 0: seletor de perfil ───────────────────────────
  if (!perfil) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Bem-vindo!</h2>
          <p className="text-gray-400 text-sm mt-1">Como você quer acessar?</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setPerfil('gestor')}
            className="group flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <Car className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Dono de Frota</p>
              <p className="text-xs text-gray-500 mt-0.5">Gerencio veículos e motoristas</p>
            </div>
          </button>

          <button
            onClick={() => { setPerfil('motorista_app'); setTab('login') }}
            className="group flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <Smartphone className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Sou Motorista</p>
              <p className="text-xs text-gray-500 mt-0.5">Trabalho nas plataformas (Uber, 99, iFood)</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Passo 1: formulário por perfil ───────────────────────
  const isGestor     = perfil === 'gestor'
  const accentColor  = isGestor ? 'text-blue-600' : 'text-emerald-600'

  return (
    <div className="space-y-5">
      {/* Voltar */}
      <button
        onClick={() => setPerfil(null)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors -mb-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Título */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {isGestor
            ? <Car className={`w-5 h-5 ${accentColor}`} />
            : <Smartphone className={`w-5 h-5 ${accentColor}`} />
          }
          <h2 className="text-xl font-extrabold text-gray-900">
            {isGestor ? 'Dono de Frota' : 'Portal do Motorista'}
          </h2>
        </div>
        <p className="text-gray-400 text-sm">
          {isGestor
            ? tab === 'cadastro'
              ? 'Crie sua conta e gerencie sua frota'
              : 'Acesse o painel de gerenciamento da sua frota'
            : 'Acesse ou crie sua conta gratuita'
          }
        </p>
      </div>

      {/* Tabs login / cadastro */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        {(['login', 'cadastro'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? isGestor ? 'bg-blue-700 text-white' : 'bg-emerald-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      {/* OAuth — login com Google para ambos os perfis */}
      {tab === 'login' && <BotoesOAuth perfil={perfil} />}

      {/* Formulário */}
      {tab === 'login'
        ? <FormLogin />
        : isGestor
          ? <FormCadastroGestor />
          : <FormCadastro />
      }
    </div>
  )
}
