import { useEffect, useState } from "react"
import { getSupportCategories } from "@/services/api/schemes"
import type { ApiSupportCategory } from "@/types/api"

// The taxonomy is static for the lifetime of the backend process, so
// it's fetched once and shared by every page that shows the selector.
let cached: Promise<ApiSupportCategory[]> | null = null

/** The support-category taxonomy, or null while loading / if it failed
 * to load (callers simply hide the selector in that case). */
export function useSupportCategories(): ApiSupportCategory[] | null {
  const [taxonomy, setTaxonomy] = useState<ApiSupportCategory[] | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!cached) {
      cached = getSupportCategories().catch((err: unknown) => {
        cached = null // let a later mount retry
        throw err
      })
    }
    cached
      .then((res) => {
        if (!cancelled) setTaxonomy(res)
      })
      .catch(() => {
        // selector stays hidden; results themselves still load
      })
    return () => {
      cancelled = true
    }
  }, [])

  return taxonomy
}
