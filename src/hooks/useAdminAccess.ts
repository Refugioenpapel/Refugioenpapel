'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@lib/supabaseClient'

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('Usuario:', user)
      console.log('Metadata:', user?.user_metadata)

      if (!user || error || user.user_metadata?.role !== 'admin') {
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
