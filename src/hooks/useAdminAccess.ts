// hooks/useAdminAccess.ts

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@lib/supabaseClient'

const ADMIN_EMAIL = 'mirefugioenpapel@gmail.com'

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('Usuario:', user)
      console.log('Metadata:', user?.user_metadata)

      const isAdminUser =
        user?.user_metadata?.role === 'admin' || user?.email === ADMIN_EMAIL

      if (!user || error || !isAdminUser) {
        router.push('/')
        return
      }

      setIsAdmin(true)
      setLoading(false)
    }

    checkAccess()
  }, [router])

  return { isAdmin, loading }
}
