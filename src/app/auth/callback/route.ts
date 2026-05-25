import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * X OAuth のコールバックを処理するルートハンドラ。
 * Supabase が認証コードを受け取り、セッションを確立する。
 * その後 users テーブルにユーザー情報を upsert する。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // ignored
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const meta = user.user_metadata ?? {};

      // users テーブルにプロフィールを upsert
      await supabase.from("users").upsert(
        {
          id: user.id,
          x_handle: meta.user_name ?? meta.preferred_username ?? null,
          display_name: meta.full_name ?? meta.name ?? null,
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        },
        { onConflict: "id" }
      );

      // HTTP 302リダイレクトだとPCブラウザのトラッキング防止機能により
      // Set-Cookie が破棄されるケースがあるため、HTTP 200でHTMLを返し、
      // クライアント側（meta refresh）でリダイレクトさせる
      const redirectUrl = `${origin}${next}`;
      return new NextResponse(
        `<html>
          <head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head>
          <body>ログイン処理中...</body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  }

  // エラー時はトップページにリダイレクト
  console.error("[auth/callback] OAuth exchange failed");
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
