'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SaveStatus = 'saved' | 'saving' | 'error'

export function useAutoSave(projectId: string, content: string) {
  const [status, setStatus] = useState<SaveStatus>('saved')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>(content)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't save if content hasn't changed
    if (content === lastSavedContentRef.current) {
      return
    }

    // Set status to saving after a delay
    timeoutRef.current = setTimeout(async () => {
      setStatus('saving')

      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('ltu_projects')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', projectId)

        if (error) {
          console.error('Error saving project:', error)
          setStatus('error')
        } else {
          setStatus('saved')
          lastSavedContentRef.current = content
        }
      } catch (error) {
        console.error('Error saving project:', error)
        setStatus('error')
      }
    }, 2000) // Wait 2 seconds after user stops typing

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, projectId])

  const manualSave = async () => {
    if (content === lastSavedContentRef.current) {
      return
    }

    setStatus('saving')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ltu_projects')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', projectId)

      if (error) {
        console.error('Error saving project:', error)
        setStatus('error')
        return false
      } else {
        setStatus('saved')
        lastSavedContentRef.current = content
        return true
      }
    } catch (error) {
      console.error('Error saving project:', error)
      setStatus('error')
      return false
    }
  }

  return { status, manualSave }
}
