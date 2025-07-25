import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  console.log('✅ Middleware ejecutándose')

  const response = NextResponse.next()

  const supabase = createMiddlewareClient({ req: request, res: response })

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log('❌ Usuario no autenticado')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Consultar el perfil del usuario
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('❌ Error al obtener perfil:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (profile?.rol !== 'admin') {
    console.log('🚫 Acceso denegado: no es admin')
    return NextResponse.redirect(new URL('/', request.url))
  }

  console.log('✅ Acceso concedido: es admin')
  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
