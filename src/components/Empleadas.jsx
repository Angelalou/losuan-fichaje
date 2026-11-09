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
      {error && <p className="error">{error}</p>}

      {pendientes.length > 0 && (
        <section className="tarjeta tarjeta-destacada">
          <h2>Pendientes de activar ({pendientes.length})</h2>
          <p className="nota">Se han registrado en la app. Pulsa «Activar» para que puedan empezar a fichar.</p>
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
        <h2>Mi equipo ({activas.filter((p) => p.rol !== 'admin').length} {activas.filter((p) => p.rol !== 'admin').length === 1 ? 'empleada' : 'empleadas'})</h2>
        <p className="nota">Estas personas ya pueden entrar en la app y fichar.</p>
        <ul className="lista-empleadas">
          {activas.map((p) => (
            <li key={p.id}>
              <div><strong>{p.nombre || '(sin nombre)'}{p.rol === 'admin' && ' · administradora'}</strong><span>{p.email}</span></div>
              {p.id !== yo.id && <button className="btn" onClick={() => cambiarActiva(p)}>Desactivar</button>}
            </li>
          ))}
        </ul>
      </section>

      <details className="tarjeta plegable">
        <summary>¿Cómo añadir una empleada nueva?</summary>
        <ol className="pasos">
          <li>Envíale este enlace (por WhatsApp, por ejemplo): <strong className="enlace-app">{enlace}</strong></li>
          <li>Ella pulsa <em>«Soy nueva: crear mi cuenta»</em> y pone su nombre, su correo electrónico y una contraseña.</li>
          <li>Te aparecerá arriba, en <em>«Pendientes de activar»</em>. Pulsa <strong>Activar</strong> y ya podrá fichar.</li>
        </ol>
        <button className="btn" onClick={() => navigator.clipboard?.writeText(enlace)}>Copiar enlace</button>
      </details>
    </div>
  )
}
