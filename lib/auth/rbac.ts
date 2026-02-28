import { adminSupabase } from '@/lib/supabase/admin'
import type { MemberRole } from '@/types'

const ROLE_RANK: Record<MemberRole, number> = {
  viewer: 0,
  editor: 1,
  owner: 2,
}

export class ForbiddenError extends Error {
  status = 403
  constructor(msg = 'Forbidden') { super(msg) }
}

/**
 * Throws ForbiddenError if the user is not a member of the trip
 * or does not meet the minimum required role.
 */
export async function requireTripRole(
  tripId: string,
  userId: string,
  minRole: MemberRole
): Promise<MemberRole> {
  const { data, error } = await adminSupabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new ForbiddenError('You are not a member of this trip')

  const role = data.role as MemberRole
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`This action requires ${minRole} role or higher`)
  }

  return role
}
