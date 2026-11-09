import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Acceso, { NuevaPassword } from './components/Acceso'
import Fichar from './components/Fichar'
import Registros from './components/Registros'
import Empleadas from './components/Empleadas'

export default function App() {
  const [sesion, setSesion] = useState(undefined)
  const [perfil, setPerfil] = useState(null)
  const [recuperando, setRecuperando] = useState(false)
  const [pestana, setPestana] = useState('registros')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
      setSesion(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = sesion?.user?.id
  useEffect(() => {
    if (!userId) {
      setPerfil(null)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setPerfil(data ?? false))
  }, [userId])

  if (sesion === undefined || (sesion && perfil === null)) return <div className="cargando">Cargando…</div>
  if (recuperando && sesion) return <NuevaPassword alTerminar={() => setRecuperando(false)} />
  if (!sesion) return <Acceso />

  const salir = () => supabase.auth.signOut()

  if (!perfil || !perfil.activa) {
    return (
      <Marco perfil={perfil} salir={salir}>
        <div className="tarjeta centrado">
          <h2>Cuenta pendiente de activar</h2>
          <p>Tu cuenta se ha creado correctamente. Ángela tiene que activarla antes de que puedas fichar.</p>
          <p>Cuando te avise, vuelve a entrar aquí.</p>
          <button className="btn" onClick={() => window.location.reload()}>Comprobar de nuevo</button>
        </div>
      </Marco>
    )
  }

  if (perfil.rol !== 'admin') {
    return (
      <Marco perfil={perfil} salir={salir}>
        <Fichar perfil={perfil} />
      </Marco>
    )
  }

  return (
    <Marco perfil={perfil} salir={salir}>
      <nav className="pestanas">
        <button className={pestana === 'registros' ? 'activa' : ''} onClick={() => setPestana('registros')}>Registros</button>
        <button className={pestana === 'empleadas' ? 'activa' : ''} onClick={() => setPestana('empleadas')}>Empleadas</button>
        <button className={pestana === 'fichar' ? 'activa' : ''} onClick={() => setPestana('fichar')}>Mi fichaje</button>
      </nav>
      {pestana === 'registros' && <Registros />}
      {pestana === 'empleadas' && <Empleadas yo={perfil} />}
      {pestana === 'fichar' && <Fichar perfil={perfil} />}
    </Marco>
  )
}

function Marco({ perfil, salir, children }) {
  return (
    <div className="app">
      <header className="cabecera">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LOSUAN Limpiezas" />
        <div className="cabecera-usuario">
          <span>{perfil?.nombre || perfil?.email}</span>
          <button className="enlace" onClick={salir}>Salir</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
