import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Sitrade` : 'Sitrade — Demo trading platform'
  }, [title])
}
