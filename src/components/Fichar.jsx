import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../supabase'
import { duracionMs, esHoy, fmtDuracion, fmtFecha, fmtHora } from '../fechas'

export default function Fichar({ perfil }) {
  const [fichajes, setFichajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  const cargar = useCallback(async () => {
    const desde = new Date()
    desde.setDate(desde.getDate() - 31)
    const { data, error } = await supabase
      .from('fichajes')
      .select('*')
      .eq('user_id', perfil.id)
      .gte('entrada', desde.toISOString())
      .order('entrada', { ascending: false })
    if (error) setError(mensajeError(error))
    else setFichajes(data)
    setCargando(false)
  }, [perfil.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abierto = fichajes.find((f) => !f.salida)

  async function fichar() {
    setEnviando(true)
    setError('')
    setConfirmacion('')
    const esFin = !!abierto
    const { data, error } = await supabase.rpc(esFin ? 'fichar_salida' : 'fichar_entrada')
    if (error) setError(mensajeError(error))
    else setConfirmacion(esFin ? `FIN registrado a las ${fmtHora(data.salida)}. ¡Hasta la próxima!` : `INICIO registrado a las ${fmtHora(data.entrada)}.`)
    await cargar()
    setEnviando(false)
  }

  if (cargando) return <div className="cargando">Cargando…</div>

  const hoy = fichajes.filter((f) => esHoy(f.entrada))
  const totalHoy = hoy.reduce((s, f) => s + duracionMs(f), 0)
  const hoyFecha = new Date()
  const inicioMes = new Date(hoyFecha.getFullYear(), hoyFecha.getMonth(), 1)
  const totalMes = fichajes.filter((f) => new Date(f.entrada) >= inicioMes).reduce((s, f) => s + duracionMs(f), 0)

  return (
    <div className="fichar">
      <section className="tarjeta centrado">
        <p className="saludo">Hola, {perfil.nombre.split(' ')[0] || 'compañera'}</p>
        <p className="fecha-hoy">{hoyFecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        {abierto ? (
          <>
            <p className="estado estado-dentro">Fichaste el INICIO a las {fmtHora(abierto.entrada)}</p>
            {!esHoy(abierto.entrada) && (
              <p className="error">Este inicio es del {fmtFecha(abierto.entrada)}. Si se te olvidó fichar el fin, avisa a Ángela para que lo corrija.</p>
            )}
          </>
        ) : (
          <p className="estado">Ahora mismo no estás fichada</p>
        )}

        {confirmacion && <p className="aviso">{confirmacion}</p>}

        <button className={`btn-fichar ${abierto ? 'salida' : 'entrada'}`} onClick={fichar} disabled={enviando}>
          {enviando ? 'Guardando…' : abierto ? 'FIN' : 'INICIO'}
        </button>
        <p className="nota explicacion">
          {abierto
            ? 'Cuando termines de trabajar, pulsa «FIN».'
            : 'Pulsa «INICIO» al empezar a trabajar y «FIN» al terminar. Si haces varios servicios con descanso entre medias, ficha inicio y fin en cada uno.'}
        </p>
        {error && <p className="error">{error}</p>}

        <div className="resumen">
          <div><span>Hoy</span><strong>{fmtDuracion(totalHoy)}</strong></div>
          <div><span>Este mes</span><strong>{fmtDuracion(totalMes)}</strong></div>
        </div>
      </section>

      <section className="tarjeta">
        <h2>Mis fichajes (últimos 30 días)</h2>
        {fichajes.length === 0 ? (
          <p className="vacio">Todavía no hay fichajes.</p>
        ) : (
          <ul className="lista-fichajes">
            {fichajes.map((f) => (
              <li key={f.id}>
                <div className="lf-fecha">{fmtFecha(f.entrada)}</div>
                <div className="lf-horas">
                  Inicio {fmtHora(f.entrada)} · Fin {f.salida ? fmtHora(f.salida) : <em>pendiente</em>}
                </div>
                <div className="lf-total">
                  {f.salida ? fmtDuracion(duracionMs(f)) : '—'}
                  {f.manual && <span className="etiqueta" title={f.motivo || ''}>corregido</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
