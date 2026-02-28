import * as ActivityModel from '@/models/activity.model'

interface LogParams {
  tripId: string
  userId: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget activity logging — never throws, never blocks the caller.
 */
export function logActivity(params: LogParams): void {
  ActivityModel.createActivityItem({
    trip_id: params.tripId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  }).catch(() => {
    // Logging is non-critical — swallow all errors
  })
}

export async function getTripActivity(tripId: string) {
  return ActivityModel.getActivityByTrip(tripId)
}
