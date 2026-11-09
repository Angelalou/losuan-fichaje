import { useState } from 'react'
import logo from '../assets/logo-losuan.png'
import { supabase, mensajeError } from '../supabase'

export default function Acceso() {
  const [modo, setModo] = useState('entrar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    setCargando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (modo === 'registro') {
        if (!nombre.trim()) throw new Error('Escribe tu nombre y apellidos.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre: nombre.trim() }, emailRedirectTo: window.location.href.split('#')[0] },
        })
        if (error) throw error
        if (!data.session) setAviso('Te hemos enviado un correo para confirmar tu cuenta. Ábrelo y pulsa el enlace.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href.split('#')[0],
        })
        if (error) throw error
        setAviso('Si el correo electrónico está registrado, te llegará un correo para crear una contraseña nueva.')
      }
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setCargando(false)
    }
  }

  const titulos = { entrar: 'Entrar', registro: 'Crear mi cuenta', recuperar: 'Recuperar contraseña' }

  return (
    <div className="acceso">
      <img src={logo} alt="LOSUAN Limpiezas" className="acceso-logo" />
      <h1>Control horario</h1>
      <form className="tarjeta" onSubmit={enviar}>
        <h2>{titulos[modo]}</h2>
        {modo === 'registro' && (
          <label>
            Nombre y apellidos
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label>
          Correo electrónico
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        {modo !== 'recuperar' && (
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        {aviso && <p className="aviso">{aviso}</p>}
        <button className="btn btn-primario" disabled={cargando}>
          {cargando ? 'Un momento…' : titulos[modo]}
        </button>
        <div className="acceso-enlaces">
          {modo !== 'entrar' && <button type="button" className="enlace" onClick={() => setModo('entrar')}>Ya tengo cuenta: entrar</button>}
          {modo !== 'registro' && <button type="button" className="enlace" onClick={() => setModo('registro')}>Soy nueva: crear mi cuenta</button>}
          {modo !== 'recuperar' && <button type="button" className="enlace" onClick={() => setModo('recuperar')}>He olvidado mi contraseña</button>}
        </div>
      </form>
    </div>
  )
}

export function NuevaPassword({ alTerminar }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)
    if (error) setError(mensajeError(error))
    else alTerminar()
  }

  return (
    <div className="acceso">
      <img src={logo} alt="LOSUAN Limpiezas" className="acceso-logo" />
      <form className="tarjeta" onSubmit={guardar}>
        <h2>Nueva contraseña</h2>
        <label>
          Escribe tu nueva contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} autoComplete="new-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primario" disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
      </form>
    </div>
  )
}
