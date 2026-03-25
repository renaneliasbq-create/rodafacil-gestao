import { buscarContextoMotorista } from './actions-calcular'
import { CalcularClient } from './calculadora-client'

export default async function CalcularPage() {
  const contexto = await buscarContextoMotorista()
  return <CalcularClient contexto={contexto} />
}
