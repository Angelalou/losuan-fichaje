import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, mensajeError } from '../supabase'
import {
  aInputFecha,
  aInputFechaHora,
  duracionMs,
  finDelDia,
  fmtDuracion,
  fmtFecha,
  fmtFechaCorta,
  fmtHora,
  horasDecimales,
  inicioDelDia,
} from '../fechas'

export default function Registros() {
  const hoy = new Date()
  const [desde, setDesde] = useState(aInputFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1)))
  const [hasta, setHasta] = useState(aInputFecha(hoy))
  const [empleada, setEmpleada] = useState('')
  const [perfiles, setPerfiles] = useState([])
  const [fichajes, setFichajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, nombre, email, activa')
      .order('nombre')
      .then(({ data }) => setPerfiles(data ?? []))
  }, [])

  const cargar = useCallback(async () => {
    if (!desde || !hasta) return
    setCargando(true)
    setError('')
    let q = supabase
      .from('fichajes')
      .select('*')
      .gte('entrada', inicioDelDia(desde).toISOString())
      .lte('entrada', finDelDia(hasta).toISOString())
      .order('entrada', { ascending: true })
    if (empleada) q = q.eq('user_id', empleada)
    const { data, error } = await q
    if (error) setError(mensajeError(error))
    else setFichajes(data)
    setCargando(false)
  }, [desde, hasta, empleada])

  useEffect(() => {
    cargar()
  }, [cargar])

  const nombreDe = useMemo(() => {
    const m = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre || p.email]))
    return (id) => m[id] || '—'
  }, [perfiles])

  const totales = useMemo(() => {
    const t = {}
    for (const f of fichajes) t[f.user_id] = (t[f.user_id] || 0) + duracionMs(f)
    return Object.entries(t).sort((a, b) => nombreDe(a[0]).localeCompare(nombreDe(b[0])))
  }, [fichajes, nombreDe])

  function exportar() {
    const filas = [['Empleada', 'Correo electrónico', 'Fecha', 'Hora inicio', 'Hora fin', 'Horas trabajadas', 'Horas (decimal)', 'Corregido', 'Motivo corrección']]
    const emailDe = Object.fromEntries(perfiles.map((p) => [p.id, p.email]))
    for (const f of fichajes) {
      filas.push([
        nombreDe(f.user_id),
        emailDe[f.user_id] || '',
        fmtFechaCorta(f.entrada),
        fmtHora(f.entrada),
        f.salida ? fmtHora(f.salida) : 'Sin fichar',
        f.salida ? fmtDuracion(duracionMs(f)) : '',
        f.salida ? horasDecimales(duracionMs(f)) : '',
        f.manual ? 'Sí' : 'No',
        f.motivo || '',
      ])
    }
    filas.push([])
    filas.push(['TOTALES DEL PERIODO', `${fmtFechaCorta(inicioDelDia(desde))} - ${fmtFechaCorta(inicioDelDia(hasta))}`])
    for (const [id, ms] of totales) filas.push([nombreDe(id), emailDe[id] || '', '', '', '', fmtDuracion(ms), horasDecimales(ms)])

    const csv = filas.map((fila) => fila.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `registro-horario_${desde}_${hasta}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <section className="tarjeta filtros">
        <label>
          Empleada
          <select value={empleada} onChange={(e) => setEmpleada(e.target.value)}>
            <option value="">Todas</option>
            {perfiles.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre || p.email}</option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <div className="filtros-botones">
          <button className="btn btn-primario" onClick={exportar} disabled={!fichajes.length}>Descargar Excel (CSV)</button>
          <button className="btn" onClick={() => setEditando({ nuevo: true })}>+ Añadir fichaje olvidado</button>
        </div>
      </section>

      <section className="tarjeta">
        <h2>Total de horas en el periodo</h2>
        {totales.length === 0 ? (
          <p className="vacio">Sin fichajes en estas fechas.</p>
        ) : (
          <ul className="totales">
            {totales.map(([id, ms]) => (
              <li key={id}><span>{nombreDe(id)}</span><strong>{fmtDuracion(ms)}</strong></li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <h2>Fichajes</h2>
        {error && <p className="error">{error}</p>}
        {cargando ? (
          <p className="vacio">Cargando…</p>
        ) : fichajes.length === 0 ? (
          <p className="vacio">No hay fichajes en estas fechas.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr><th>Fecha</th><th>Empleada</th><th>Inicio</th><th>Fin</th><th>Horas</th><th></th></tr>
              </thead>
              <tbody>
                {fichajes.map((f) => (
                  <tr key={f.id} className={!f.salida ? 'fila-abierta' : ''}>
                    <td>{fmtFecha(f.entrada)}</td>
                    <td>{nombreDe(f.user_id)}</td>
                    <td>{fmtHora(f.entrada)}</td>
                    <td>{f.salida ? fmtHora(f.salida) : <em>pendiente</em>}</td>
                    <td>
                      {f.salida ? fmtDuracion(duracionMs(f)) : '—'}
                      {f.manual && <span className="etiqueta" title={f.motivo || ''}>corregido</span>}
                    </td>
                    <td><button className="enlace" onClick={() => setEditando(f)}>Corregir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editando && (
        <EditarFichaje
          fichaje={editando}
          perfiles={perfiles}
          nombreDe={nombreDe}
          cerrar={() => setEditando(null)}
          guardado={() => {
            setEditando(null)
            cargar()
          }}
        />
      )}
    </div>
  )
}

function EditarFichaje({ fichaje, perfiles, nombreDe, cerrar, guardado }) {
  const nuevo = !!fichaje.nuevo
  const [userId, setUserId] = useState(fichaje.user_id || '')
  const [entrada, setEntrada] = useState(aInputFechaHora(fichaje.entrada))
  const [salida, setSalida] = useState(aInputFechaHora(fichaje.salida))
  const [motivo, setMotivo] = useState('')
  const [historial, setHistorial] = useState([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (nuevo) return
    supabase
      .from('fichajes_historial')
      .select('*')
      .eq('fichaje_id', fichaje.id)
      .order('cambiado_en', { ascending: false })
      .then(({ data }) => setHistorial(data ?? []))
  }, [nuevo, fichaje.id])

  async function guardar(e) {
    e.preventDefault()
    setError('')
    if (nuevo && !userId) return setError('Elige la empleada.')
    if (!entrada) return setError('Indica la hora de inicio.')
    if (salida && new Date(salida) <= new Date(entrada)) return setError('La hora de fin tiene que ser posterior a la de inicio.')
    if (!motivo.trim()) return setError('Escribe el motivo de la corrección.')
    setGuardando(true)
    const params = {
      p_entrada: new Date(entrada).toISOString(),
      p_salida: salida ? new Date(salida).toISOString() : null,
      p_motivo: motivo.trim(),
    }
    const { error } = nuevo
      ? await supabase.rpc('crear_fichaje_manual', { p_user: userId, ...params })
      : await supabase.rpc('corregir_fichaje', { p_id: fichaje.id, ...params })
    setGuardando(false)
    if (error) setError(mensajeError(error))
    else guardado()
  }

  return (
    <div className="modal-fondo" onClick={cerrar}>
      <form className="tarjeta modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2>{nuevo ? 'Añadir fichaje olvidado' : `Corregir fichaje de ${nombreDe(fichaje.user_id)}`}</h2>
        {nuevo && (
          <label>
            Empleada
            <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">Elige…</option>
              {perfiles.filter((p) => p.activa).map((p) => (
                <option key={p.id} value={p.id}>{p.nombre || p.email}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Inicio
          <input type="datetime-local" value={entrada} onChange={(e) => setEntrada(e.target.value)} required />
        </label>
        <label>
          Fin
          <input type="datetime-local" value={salida} onChange={(e) => setSalida(e.target.value)} />
        </label>
        <label>
          Motivo de la corrección (obligatorio)
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: se olvidó fichar el fin" required />
        </label>
        <p className="nota">Quedará registrado que este fichaje fue corregido por ti, cuándo y por qué.</p>
        {error && <p className="error">{error}</p>}
        <div className="modal-botones">
          <button type="button" className="btn" onClick={cerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
        {historial.length > 0 && (
          <div className="historial">
            <h3>Historial de cambios</h3>
            <ul>
              {historial.map((h) => (
                <li key={h.id}>
                  {fmtFechaCorta(h.cambiado_en)} {fmtHora(h.cambiado_en)}: {h.entrada_anterior ? `${fmtHora(h.entrada_anterior)}–${fmtHora(h.salida_anterior)}` : 'creado'} → {fmtHora(h.entrada_nueva)}–{fmtHora(h.salida_nueva)} · {h.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  )
}
