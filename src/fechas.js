const LOCALE = 'es-ES'

export const fmtFecha = (d) =>
  new Date(d).toLocaleDateString(LOCALE, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

export const fmtFechaCorta = (d) =>
  new Date(d).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })

export const fmtHora = (d) => (d ? new Date(d).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) : '—')

// Un fichaje sin fin todavía no cuenta horas
export function duracionMs(f) {
  if (!f.salida) return 0
  return Math.max(0, new Date(f.salida).getTime() - new Date(f.entrada).getTime())
}

export function fmtDuracion(ms) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export const horasDecimales = (ms) => (ms / 3600000).toFixed(2).replace('.', ',')

// Valor para <input type="date">, en hora local
export function aInputFecha(d) {
  const x = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

// Valor para <input type="datetime-local">, en hora local
export function aInputFechaHora(d) {
  if (!d) return ''
  const x = new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${aInputFecha(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`
}

export function inicioDelDia(valorInput) {
  const [y, m, d] = valorInput.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function finDelDia(valorInput) {
  const [y, m, d] = valorInput.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

export function esHoy(d) {
  return new Date(d).toDateString() === new Date().toDateString()
}
