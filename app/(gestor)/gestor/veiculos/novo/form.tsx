'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarVeiculo } from '../actions'
import { useState } from 'react'
import { ArrowLeft, Car, Loader2, UserCheck } from 'lucide-react'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Cadastrando...</> : <><Car className="w-4 h-4" />Cadastrar veículo</>}
    </button>
  )
}

interface Motorista { id: string; nome: string }

export function NovoVeiculoForm({ motoristas }: { motoristas: Motorista[] }) {
  const [state, action] = useFormState(criarVeiculo, null)
  const [vincular, setVincular] = useState(false)

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* Dados do veículo */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">Dados do veículo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Placa *</label>
            <input name="placa" type="text" required placeholder="ABC-1234" className="input uppercase" maxLength={8} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ano *</label>
            <input name="ano" type="number" required placeholder={String(new Date().getFullYear())} min="1990" max={new Date().getFullYear() + 1} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Marca *</label>
            <input name="marca" type="text" required placeholder="Toyota" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modelo *</label>
            <input name="modelo" type="text" required placeholder="Corolla" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cor</label>
            <input name="cor" type="text" placeholder="Branco" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">KM atual</label>
            <input name="km_atual" type="number" placeholder="0" min="0" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Chassi</label>
            <input name="chassi" type="text" placeholder="Número do chassi" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor de compra (R$)</label>
            <input name="valor_compra" type="number" step="0.01" placeholder="0,00" min="0" className="input" />
          </div>
          {!vincular && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status *</label>
              <select name="status" required className="input">
                <option value="disponivel">Disponível</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Toggle vincular motorista */}
      <div className="card p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setVincular(!vincular)}
            className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${vincular ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${vincular ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Vincular a um motorista agora
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Cria o contrato automaticamente ao cadastrar</p>
          </div>
        </label>

        {vincular && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {motoristas.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhum motorista disponível.{' '}
                <Link href="/gestor/motoristas/novo" className="text-blue-600 underline">Cadastre um motorista</Link>.
              </p>
            ) : (
              <>
                <input type="hidden" name="status" value="alugado" />

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Motorista *</label>
                  <select name="motorista_id" required={vincular} className="input">
                    <option value="">Selecione o motorista</option>
                    {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Valor do aluguel *</label>
                    <input name="valor_aluguel" type="number" step="0.01" required={vincular} placeholder="R$ 0,00" className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Periodicidade *</label>
                    <select name="periodicidade" required={vincular} className="input">
                      <option value="">Selecione</option>
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Data de início *</label>
                  <input name="data_inicio" type="date" required={vincular} className="input"
                    defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Caução (R$)</label>
                    <input name="caucao_valor" type="number" step="0.01" placeholder="0,00" className="input" />
                  </div>
                  <div className="flex items-end pb-2.5">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input name="caucao_pago" type="checkbox" value="true" className="rounded" />
                      Caução já pago
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/gestor/veiculos" className="btn-secondary flex-1 justify-center">Cancelar</Link>
        <div className="flex-1"><SubmitButton /></div>
      </div>
    </form>
  )
}
