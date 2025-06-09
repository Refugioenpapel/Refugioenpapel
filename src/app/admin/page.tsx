'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductList from '@components/admin/ProductList'
import Link from 'next/link'
import { supabase } from '@lib/supabaseClient'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login') // redirige al login tras cerrar sesión
}

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
 console.log('Usuario:', user)
    console.log('Metadata:', user?.user_metadata)
      if (!user || error) {
        router.push('/') // no logueado
        return
      }

      const role = user.user_metadata?.role
       console.log('Rol detectado:', role)
      if (role !== 'admin') {
        router.push('/') // no autorizado
        return
      }

      setIsAdmin(true)
      setLoading(false)
    }

    checkAccess()
  }, [router])

  if (loading) return <p className="p-6">Verificando acceso...</p>

  if (!isAdmin) return null // fallback de seguridad

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <Link href="/admin/nuevo-producto" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Agregar producto
        </Link>
      </div>
      <ProductList />
      <div className="flex justify-between items-center">
  <h1 className="text-2xl font-bold">Panel de administración</h1>
  <div className="flex gap-2">
    <Link href="/admin/nuevo-producto" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
      Agregar producto
    </Link>
    <button
      onClick={handleLogout}
      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
    >
      Cerrar sesión
    </button>
  </div>
</div>
    </div>
  )
}
