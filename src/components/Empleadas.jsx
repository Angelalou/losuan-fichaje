import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../supabase'
import { fmtFechaCorta } from '../fechas'

export default function Empleadas({ yo }) {
  const [perfiles, setPerfiles] = useState([])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    if (error) setError(mensajeError(error))
    else setPerfiles(data)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function cambiarActiva(p) {
    if (p.activa && !window.confirm(`¿Desactivar a ${p.nombre || p.email}? No podrá fichar, pero sus fichajes se conservan.`)) return
    const { error } = await supabase.from('profiles').update({ activa: !p.activa }).eq('id', p.id)
    if (error) setError(mensajeError(error))
    cargar()
  }

  const enlace = window.location.href.split('#')[0]
  const pendientes = perfiles.filter((p) => !p.activa)
  const activas = perfiles.filter((p) => p.activa)

  return (
    <div>
      <section className="tarjeta">
        <h2>Cómo dar de alta a una empleada nueva</h2>
        <ol className="pasos">
          <li>Envíale este enlace (por WhatsApp, por ejemplo): <strong className="enlace-app">{enlace}</strong></li>
          <li>Ella pulsa <em>«Soy nueva: crear mi cuenta»</em> y pone su nombre, email y una contraseña.</li>
          <li>Te aparecerá aquí abajo como <em>pendiente</em>. Pulsa <strong>Activar</strong> y ya podrá fichar.</li>
        </ol>
        <button className="btn" onClick={() => navigator.clipboard?.writeText(enlace)}>Copiar enlace</button>
      </section>

      {error && <p className="error">{error}</p>}

      {pendientes.length > 0 && (
        <section className="tarjeta">
          <h2>Pendientes de activar</h2>
          <ul className="lista-empleadas">
            {pendientes.map((p) => (
              <li key={p.id}>
                <div><strong>{p.nombre || '(sin nombre)'}</strong><span>{p.email} · registrada el {fmtFechaCorta(p.created_at)}</span></div>
                <button className="btn btn-primario" onClick={() => cambiarActiva(p)}>Activar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tarjeta">
        <h2>Equipo activo</h2>
        <ul className="lista-empleadas">
          {activas.map((p) => (
            <li key={p.id}>
              <div><strong>{p.nombre || '(sin nombre)'}{p.rol === 'admin' && ' · administradora'}</strong><span>{p.email}</span></div>
              {p.id !== yo.id && <button className="btn" onClick={() => cambiarActiva(p)}>Desactivar</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
