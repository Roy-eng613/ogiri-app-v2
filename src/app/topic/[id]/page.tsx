import { createClient } from "@/lib/supabase-server";
import OgiriPage from "@/components/OgiriPage";
import type { BokeWithLiked, Topic } from "@/types/database";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: topicData, error: topicError } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (topicError || !topicData) {
    return notFound();
  }

  const topic = topicData as Topic;

  // ─── そのお題のボケ一覧を取得 ──────────────────────────────────
  const { data: bokesData } = await supabase
    .from("bokes")
    .select("*")
    .eq("topic_id", topic.id)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false });

  // アバター画像は公開ビュー（user_public_profiles）から別途取得
  const userIds = ((bokesData as any) ?? [])
    .map((b: any) => b.user_id)
    .filter(Boolean);
  let avatarMap: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_public_profiles")
      .select("id, avatar_url")
      .in("id", userIds);
    if (profiles) {
      for (const p of profiles as any[]) {
        avatarMap[p.id] = p.avatar_url;
      }
    }
  }

  // サーバー側でセッションとユーザープロフィール、いいね情報を取得
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user ?? null;
  let userProfile = null;
  let userLikedBokeIds: string[] = [];

  if (authUser) {
    // プロフィールの取得
    const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle();
    userProfile = profile;

    // 現在のユーザーがいいねしたボケIDのリストを取得
    const { data: likes } = await supabase.from("likes").select("boke_id").eq("user_id", authUser.id);
    if (likes) {
      userLikedBokeIds = likes.map((l: any) => l.boke_id);
    }
  }

  const bokes: BokeWithLiked[] = ((bokesData as any) ?? []).map((b: any) => ({
    ...b,
    liked: userLikedBokeIds.includes(b.id),
    users: b.user_id ? { avatar_url: avatarMap[b.user_id] ?? null } : null,
  }));

  return (
    <OgiriPage 
      topic={topic} 
      initialBokes={bokes} 
      initialAuthUser={authUser}
      initialUserProfile={userProfile}
    />
  );
}
