'use client'

import { useAdminAccess } from 'hooks/useAdminAccess'
import ProductForm from '@components/admin/ProductForm';

export default function NuevoProductoPage() {
  const { isAdmin, loading } = useAdminAccess()

  if (loading) return <p className="p-6">Verificando acceso...</p>
  if (!isAdmin) return null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Agregar nuevo producto</h1>
      <ProductForm />
    </div>
  )
}