import { apiGet } from "@/services/api/client"
import type { PaginatedEligibilityResults, SupportFilterParams } from "@/types/api"

/**
 * Fetches potential scheme matches for a profile — deterministic
 * results already evaluated server-side (see
 * backend/app/services/eligibility_engine.py). Only MATCH and
 * NEEDS_INFORMATION are ever returned by the backend; NOT_MATCHED
 * schemes are excluded before this response is built, not filtered
 * here. The optional support filter is also applied server-side, after
 * evaluation — it narrows the list, never changes a status.
 */
export function getProfileMatches(
  profileId: string,
  limit: number = 20,
  offset: number = 0,
  supportFilter: SupportFilterParams = {}
): Promise<PaginatedEligibilityResults> {
  return apiGet<PaginatedEligibilityResults>(`/profiles/${encodeURIComponent(profileId)}/matches`, {
    limit,
    offset,
    ...supportFilter,
  })
}