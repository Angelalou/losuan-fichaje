import { createClient } from '@supabase/supabase-js'

// La clave "publishable/anon" es pública por diseño: la seguridad la ponen las reglas de la base de datos.
const SUPABASE_URL = 'https://PENDIENTE.supabase.co'
const SUPABASE_ANON_KEY = 'PENDIENTE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function mensajeError(error) {
  const msg = error?.message || String(error)
  const traducciones = {
    'Invalid login credentials': 'Email o contraseña incorrectos.',
    'User already registered': 'Ya existe una cuenta con ese email.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Email not confirmed': 'Tienes que confirmar tu email antes de entrar.',
  }
  for (const [en, es] of Object.entries(traducciones)) {
    if (msg.includes(en)) return es
  }
  return msg
}
