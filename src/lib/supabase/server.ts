import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    db: {
      schema: process.env.SUPABASE_DB_SCHEMA ?? "daycare_vacation",
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
