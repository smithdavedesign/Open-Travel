import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { ActivityFeedItem } from '@/types'

export async function createActivityItem(
  item: Omit<ActivityFeedItem, 'id' | 'created_at' | 'profiles'>
): Promise<void> {
  await supabase.from('activity_feed').insert(item)
}

export async function getActivityByTrip(
  tripId: string,
  limit = 40
): Promise<ActivityFeedItem[]> {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('*, profiles(full_name, avatar_url)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
