import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS, server-only
// Authorization is enforced in controllers and API route handlers via getUser()
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
