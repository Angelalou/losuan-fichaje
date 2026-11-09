import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../supabase'
import { duracionMs, esHoy, fmtCronometro, fmtDuracion, fmtFecha, fmtHora } from '../fechas'

export default function Fichar({ perfil }) {
  const [fichajes, setFichajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [ahora, setAhora] = useState(Date.now())

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

  useEffect(() => {
    if (!abierto) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [abierto])

  async function fichar() {
    setEnviando(true)
    setError('')
    const { error } = await supabase.rpc(abierto ? 'fichar_salida' : 'fichar_entrada')
    if (error) setError(mensajeError(error))
    await cargar()
    setAhora(Date.now())
    setEnviando(false)
  }

  if (cargando) return <div className="cargando">Cargando…</div>

  const hoy = fichajes.filter((f) => esHoy(f.entrada))
  const totalHoy = hoy.reduce((s, f) => s + duracionMs(f, ahora), 0)
  const hoyFecha = new Date(ahora)
  const inicioMes = new Date(hoyFecha.getFullYear(), hoyFecha.getMonth(), 1)
  const totalMes = fichajes.filter((f) => new Date(f.entrada) >= inicioMes).reduce((s, f) => s + duracionMs(f, ahora), 0)

  return (
    <div className="fichar">
      <section className="tarjeta centrado">
        <p className="saludo">Hola, {perfil.nombre.split(' ')[0] || 'compañera'}</p>
        <p className="fecha-hoy">{new Date(ahora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        {abierto ? (
          <>
            <p className="estado estado-dentro">Trabajando desde las {fmtHora(abierto.entrada)}</p>
            {!esHoy(abierto.entrada) && (
              <p className="error">Esta entrada es del {fmtFecha(abierto.entrada)}. Si se te olvidó fichar la salida, avisa a Ángela para que lo corrija.</p>
            )}
            <p className="cronometro">{fmtCronometro(duracionMs(abierto, ahora))}</p>
          </>
        ) : (
          <p className="estado">Ahora mismo no estás fichada</p>
        )}

        <button className={`btn-fichar ${abierto ? 'salida' : 'entrada'}`} onClick={fichar} disabled={enviando}>
          {enviando ? 'Guardando…' : abierto ? 'Fichar SALIDA' : 'Fichar ENTRADA'}
        </button>
        <p className="nota explicacion">
          {abierto
            ? 'Cuando termines de trabajar, pulsa «Fichar SALIDA».'
            : 'Pulsa «Fichar ENTRADA» al empezar a trabajar y «Fichar SALIDA» al terminar. Si haces varios servicios con descanso entre medias, ficha entrada y salida en cada uno.'}
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
                  {fmtHora(f.entrada)} – {f.salida ? fmtHora(f.salida) : <em>en curso</em>}
                </div>
                <div className="lf-total">
                  {fmtDuracion(duracionMs(f, ahora))}
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
