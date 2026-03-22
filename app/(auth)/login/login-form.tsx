'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { signIn, type LoginState } from './actions'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full mt-2 py-3">
      {pending ? (
        <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
      ) : (
        <><LogIn className="w-4 h-4" />Entrar</>
      )}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState, FormData>(signIn, null)
  const [showPassword, setShowPassword] = useState(false)

  return (

    <form action={formAction} className="space-y-5">
      {/* Erro de autenticação */}
      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          {state.error}
        </div>
      )}

      {/* E-mail */}
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          className="input"
          disabled={false}
        />
      </div>

      {/* Senha */}
      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="input pr-11"
            disabled={false}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}
