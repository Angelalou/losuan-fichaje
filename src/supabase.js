import { createClient } from '@supabase/supabase-js'

// La clave "publishable/anon" es pública por diseño: la seguridad la ponen las reglas de la base de datos.
const SUPABASE_URL = 'https://kkvuhtechdabmkcbccvb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_xMY0ye6evAXJs_acd3XUhQ_MO7wuaIs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function mensajeError(error) {
  const msg = error?.message || String(error)
  const traducciones = {
    'Invalid login credentials': 'Correo electrónico o contraseña incorrectos.',
    'User already registered': 'Ya existe una cuenta con ese correo electrónico.',
    'Password should be at least': 'La contraseña debe tener al menos 6 caracteres.',
    'Email not confirmed': 'Tienes que confirmar tu correo electrónico antes de entrar.',
    'invalid format': 'El correo electrónico no es válido. Revisa que esté bien escrito.',
    'is invalid': 'El correo electrónico no es válido. Revisa que esté bien escrito.',
    'rate limit': 'Has hecho demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
    'security purposes': 'Por seguridad, espera unos segundos antes de volver a intentarlo.',
    'Signups not allowed': 'Ahora mismo no se pueden crear cuentas nuevas. Avisa a Ángela.',
    'Failed to fetch': 'No hay conexión a internet. Revisa la cobertura y vuelve a intentarlo.',
    'NetworkError': 'No hay conexión a internet. Revisa la cobertura y vuelve a intentarlo.',
    'JWT expired': 'Tu sesión ha caducado. Sal y vuelve a entrar.',
    'should be different from the old password': 'La contraseña nueva tiene que ser distinta de la anterior.',
  }
  for (const [en, es] of Object.entries(traducciones)) {
    if (msg.toLowerCase().includes(en.toLowerCase())) return es
  }
  return msg
}
