const LOCALE = 'es-ES'

export const fmtFecha = (d) =>
  new Date(d).toLocaleDateString(LOCALE, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

export const fmtFechaCorta = (d) =>
  new Date(d).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })

export const fmtHora = (d) => (d ? new Date(d).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) : '—')

export function duracionMs(f, ahora = Date.now()) {
  const fin = f.salida ? new Date(f.salida).getTime() : ahora
  return Math.max(0, fin - new Date(f.entrada).getTime())
}

export function fmtDuracion(ms) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function fmtCronometro(ms) {
  const s = Math.floor(ms / 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
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
