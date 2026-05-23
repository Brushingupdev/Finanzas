"use client"

import { useState, useEffect, useCallback } from "react"

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    execute()
  }, [execute])

  const refetch = useCallback(() => {
    execute()
  }, [execute])

  return { data, error, loading, refetch }
}