import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase クライアントを生成する。
 * Server Component / Server Action / Client Component どちらからでも使用可能。
 * 認証情報は NEXT_PUBLIC_ プレフィックスのため公開されるが、
 * RLS (Row Level Security) ポリシーでデータを保護している。
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
