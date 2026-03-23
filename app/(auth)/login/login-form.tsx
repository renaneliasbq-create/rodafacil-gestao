'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { signIn, signUpMotoApp, type LoginState, type SignUpState } from './actions'
import { Eye, EyeOff, Loader2, LogIn, ArrowLeft, Car, Smartphone, UserPlus } from 'lucide-react'

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
          {isGestor ? 'Acesse o painel de gerenciamento da sua frota' : 'Acesse ou crie sua conta gratuita'}
        </p>
      </div>

      {/* Tabs login / cadastro — apenas para motorista */}
      {!isGestor && (
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['login', 'cadastro'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>
      )}

      {/* Formulário */}
      {tab === 'login' || isGestor ? <FormLogin /> : <FormCadastro />}
    </div>
  )
}
