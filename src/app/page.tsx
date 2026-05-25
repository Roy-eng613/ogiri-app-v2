import { createClient } from "@/lib/supabase-server";
import TopicListClient from "@/components/TopicListClient";

export const dynamic = "force-dynamic";

export default async function TopPage() {
  const supabase = await createClient();

  // 本日開催中 (24時間以内)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: activeTopicsData, error: activeError } = await supabase
    .from("topics")
    .select("*, bokes(count)")
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false });

  // 過去のお題 (24時間以上前)
  const { data: pastTopicsData, error: pastError } = await supabase
    .from("topics")
    .select("*, bokes(count)")
    .lt("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  if (activeError || pastError) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 px-4">
        <p className="text-4xl">⛩️</p>
        <h1 className="text-xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "var(--font-noto-serif-jp)" }}>
          大喜利が世界を救う
        </h1>
        <p className="text-red-400 text-sm">エラーが発生しました: {activeError?.message || pastError?.message}</p>
      </div>
    );
  }

  // 取得したデータを整形 (bokes count を抽出)
  const formatTopics = (topics: any[]) => {
    return (topics || []).map(t => ({
      ...t,
      bokesCount: t.bokes && t.bokes.length > 0 ? t.bokes[0].count : 0
    }));
  };

  const activeTopics = formatTopics(activeTopicsData);
  const pastTopics = formatTopics(pastTopicsData);

  // サーバー側でセッションとユーザープロフィール、いいね一覧を取得
  const { data: { session } } = await supabase.auth.getSession();
  const authUser = session?.user ?? null;
  let userProfile = null;
  let initialLikedBokes: any[] = [];

  if (authUser) {
    const { data } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle();
    userProfile = data;

    // ユーザーがいいねしたボケの一覧を取得
    const { data: likedData } = await supabase
      .from("likes")
      .select(`
        id,
        created_at,
        boke_id,
        bokes (
          id,
          content,
          author_name,
          like_count,
          created_at,
          topic_id,
          user_id,
          topics (
            id,
            content
          )
        )
      `)
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (likedData) {
      // アバター画像は公開ビュー（user_public_profiles）から別途取得
      const likedUserIds = likedData
        .map((l: any) => l.bokes?.user_id)
        .filter(Boolean);
      let likedAvatarMap: Record<string, string | null> = {};
      if (likedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_public_profiles")
          .select("id, avatar_url")
          .in("id", likedUserIds);
        if (profiles) {
          for (const p of profiles as any[]) {
            likedAvatarMap[p.id] = p.avatar_url;
          }
        }
      }

      initialLikedBokes = likedData.map((l: any) => ({
        ...l.bokes,
        liked: true,
        topic: l.bokes?.topics,
        users: l.bokes?.user_id ? { avatar_url: likedAvatarMap[l.bokes.user_id] ?? null } : null,
      }));
    }
  }

  return (
    <TopicListClient 
      activeTopics={activeTopics} 
      pastTopics={pastTopics} 
      initialAuthUser={authUser}
      initialUserProfile={userProfile}
      initialLikedBokes={initialLikedBokes}
    />
  );
}
