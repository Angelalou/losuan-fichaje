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
  const [verPassword, setVerPassword] = useState(false)
  const [sinCuenta, setSinCuenta] = useState(false)

  function cambiarModo(m) {
    setModo(m)
    setError('')
    setAviso('')
    setSinCuenta(false)
  }

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    setSinCuenta(false)
    setCargando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error?.message?.includes('Invalid login credentials')) {
          setSinCuenta(true)
          throw new Error('Correo electrónico o contraseña incorrectos. Si todavía no te has registrado, primero tienes que crear tu cuenta.')
        }
        if (error) throw error
      } else if (modo === 'registro') {
        if (!nombre.trim()) throw new Error('Escribe tu nombre y apellidos.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre: nombre.trim() }, emailRedirectTo: window.location.href.split('#')[0] },
        })
        if (error) throw error
        if (!data.session) setAviso('Cuenta creada. Si al entrar te pide confirmar el correo y no te llega ningún mensaje, avisa a Ángela.')
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
          <>
            <p className="nota">Rellena los tres datos y pulsa el botón «Crear mi cuenta» de abajo.</p>
            <label>
              Nombre y apellidos
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" autoFocus required />
            </label>
          </>
        )}
        <label>
          Correo electrónico
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        {modo !== 'recuperar' && (
          <label>
            {modo === 'registro' ? 'Elige una contraseña (mínimo 6 caracteres)' : 'Contraseña'}
            <div className="campo-password">
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
              <button type="button" className="btn-ver" onClick={() => setVerPassword(!verPassword)}>
                {verPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            {modo === 'registro' && <span className="ayuda">Si el móvil te sugiere una contraseña, bórrala y escribe una que puedas recordar.</span>}
          </label>
        )}
        {error && <p className="error">{error}</p>}
        {sinCuenta && modo === 'entrar' && (
          <button type="button" className="btn btn-secundario boton-crear" onClick={() => cambiarModo('registro')}>
            Crear mi cuenta con este correo
          </button>
        )}
        {aviso && <p className="aviso">{aviso}</p>}
        <button className="btn btn-primario" disabled={cargando}>
          {cargando ? 'Un momento…' : titulos[modo]}
        </button>
        <div className="acceso-enlaces">
          {modo !== 'entrar' && <button type="button" className="enlace" onClick={() => cambiarModo('entrar')}>Ya tengo cuenta: entrar</button>}
          {modo !== 'registro' && <button type="button" className="btn btn-secundario" onClick={() => cambiarModo('registro')}>Soy nueva: crear mi cuenta</button>}
          {modo !== 'recuperar' && <button type="button" className="enlace" onClick={() => cambiarModo('recuperar')}>He olvidado mi contraseña</button>}
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
