"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User } from "@/types/database";
import { claimDailyBonus, postNewTopic, toggleLike } from "@/app/actions";
import SiteFooter from "./SiteFooter";

// ─── Xログインボタン (OgiriPageから流用) ──────────────────────────────────
function LoginButton({ authUser, userProfile, onLogin, onLogout }: any) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!authUser) {
    return (
      <button
        onClick={onLogin}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
          color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600,
          cursor: "pointer", transition: "all 0.2s ease"
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        ログイン
      </button>
    );
  }

  const displayName = userProfile?.display_name ?? authUser.user_metadata?.full_name ?? "ユーザー";
  const avatarUrl = userProfile?.avatar_url ?? authUser.user_metadata?.avatar_url;
  const tokens = userProfile?.token_balance ?? 0;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "5px 12px 5px 5px", borderRadius: "20px",
          border: "1px solid rgba(201,160,74,0.3)", background: "rgba(201,160,74,0.08)",
          color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600,
          cursor: "pointer", transition: "all 0.2s ease"
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} width={26} height={26} style={{ borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🎭</div>
        )}
        <span style={{ color: "var(--text-primary)", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <span style={{ color: "var(--accent-gold)", fontSize: "0.75rem" }}>🎋{tokens}</span>
      </button>

      {menuOpen && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "8px", minWidth: "180px", zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <p style={{ padding: "6px 10px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            🎋 トークン: <strong style={{ color: "var(--accent-gold)" }}>{tokens}</strong>
          </p>
          <button
            onClick={() => { setMenuOpen(false); onLogout(); }}
            style={{ width: "100%", padding: "8px 10px", marginTop: "4px", borderRadius: "8px", border: "none", background: "rgba(217,79,79,0.1)", color: "var(--accent-red-light)", fontSize: "0.8rem", cursor: "pointer", textAlign: "left" }}
          >
            🚪 ログアウト
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 本体コンポーネント ───────────────────────────────────────────
interface TopicListClientProps {
  activeTopics: any[];
  pastTopics: any[];
  initialAuthUser?: AuthUser | null;
  initialUserProfile?: User | null;
  initialLikedBokes?: any[];
}

export default function TopicListClient({ activeTopics, pastTopics, initialAuthUser, initialUserProfile, initialLikedBokes }: TopicListClientProps) {
  const router = useRouter();
  // useStateを使ってクライアントインスタンスを1度だけ生成する
  const [supabase] = useState(() => createClient());
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuthUser ?? null);
  const [userProfile, setUserProfile] = useState<User | null>(initialUserProfile ?? null);
  
  // モーダルステート
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isLoginForTopicModalOpen, setIsLoginForTopicModalOpen] = useState(false);
  const [newTopicContent, setNewTopicContent] = useState("");
  const [isPending, startTransition] = useTransition();

  // タブステート
  const [activeTab, setActiveTab] = useState<"topics" | "likes">("topics");
  const [likedPosts, setLikedPosts] = useState<any[]>(initialLikedBokes || []);

  useEffect(() => {
    if (initialLikedBokes) {
      setLikedPosts(initialLikedBokes);
    }
  }, [initialLikedBokes]);

  // ユーザープロファイル取得
  const fetchUserProfile = async (uid: string) => {
    const { data } = await supabase.from("users").select("*").eq("id", uid).maybeSingle();
    if (data) setUserProfile(data as User);
  };

  useEffect(() => {
    // サーバーサイドから初期セッションが渡されるため、クライアントでのgetUser()は不要
    // onAuthStateChange だけ登録してセッションの変更を監視する

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) {
        await fetchUserProfile(user.id);
        
        // ログインボーナスチェック
        if (_event === "INITIAL_SESSION" || _event === "SIGNED_IN") {
          const res = await claimDailyBonus();
          if (res?.claimed) {
            alert(`🎁 ログインボーナス！\n5 トークン獲得しました！`);
            await fetchUserProfile(user.id); // 残高更新
            router.refresh();
          }
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "x" as any,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error("[handleLogin] error:", error);
      alert(`ログインエラー: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleCreateTopic = async () => {
    if (!newTopicContent.trim() || isPending) return;
    startTransition(async () => {
      const res = await postNewTopic(newTopicContent.trim());
      if (res.success) {
        setIsCreateTopicModalOpen(false);
        setNewTopicContent("");
        if (authUser) await fetchUserProfile(authUser.id);
        router.push(`/topic/${res.topic_id}`);
      } else {
        alert("エラーが発生しました: " + res.error);
      }
    });
  };

  const handleToggleLike = async (bokeId: string) => {
    if (!authUser) return;
    
    // 楽観的UI更新
    setLikedPosts(prev => prev.filter(p => p.id !== bokeId));

    try {
      const res = await toggleLike(bokeId);
      if (!res || res.error) {
        // エラー時は元の状態に戻すかリフレッシュ
        router.refresh();
      } else if (authUser) {
        await fetchUserProfile(authUser.id); // トークン残高を更新
      }
    } catch (e) {
      router.refresh();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ヘッダー */}
      <header className="site-header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛩️</span>
            <div>
              <p className="text-sm font-bold tracking-wide" style={{ color: "var(--accent-gold)", fontFamily: "var(--font-noto-serif-jp)" }}>大喜利が世界を救う</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI大喜利SNS · β版</p>
            </div>
          </div>
          <LoginButton authUser={authUser} userProfile={userProfile} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col gap-10">
        
        {/* タブ切り替え */}
        <div className="flex border-b border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab("topics")}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "topics" ? "border-[var(--accent-gold)] text-[var(--accent-gold)]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
          >
            お題一覧
          </button>
          {authUser && (
            <button
              onClick={() => setActiveTab("likes")}
              className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === "likes" ? "border-[var(--accent-gold)] text-[var(--accent-gold)]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              座布団をつけた回答
            </button>
          )}
        </div>

        {activeTab === "topics" ? (
          <>
            {/* アクションエリア */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-black/20 p-4 md:p-6 rounded-2xl border border-[var(--border-subtle)]">
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>お題一覧</h2>
                <p className="text-sm text-gray-400">好きなお題を選んで、ボケを投稿しよう</p>
              </div>
              <button
                onClick={() => {
                  if (!authUser) {
                    setIsLoginForTopicModalOpen(true);
                  } else {
                    setIsCreateTopicModalOpen(true);
                  }
                }}
                className="post-btn"
                style={{ background: "linear-gradient(135deg, rgba(201,160,74,0.9), rgba(184,134,11,0.9))", color: "#000" }}
              >
                ✏️ 新しいお題を作る (8トークン)
              </button>
            </div>

            {/* 本日開催中 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="tag-badge" style={{ background: "rgba(217,79,79,0.15)", color: "var(--accent-red-light)", border: "1px solid rgba(217,79,79,0.4)" }}>🔥 本日開催中</span>
                <span className="text-xs text-gray-500">（過去24時間）</span>
              </div>
              
              {activeTopics.length === 0 ? (
                <p className="text-center text-gray-500 py-8 glass-card">現在開催中のお題はありません。</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTopics.map(topic => (
                    <Link href={`/topic/${topic.id}`} key={topic.id} className="topic-card p-5 block hover:-translate-y-1 transition-transform">
                      <p className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-noto-serif-jp)" }}>「{topic.content}」</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>💬 回答 {topic.bokesCount} 件</span>
                        {topic.is_ai && <span className="bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 px-2 py-0.5 rounded text-[10px]">AI出題</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 過去のお題 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="tag-badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>📚 過去のお題</span>
              </div>
              
              {pastTopics.length === 0 ? (
                <p className="text-center text-gray-500 py-8">過去のお題はありません。</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {pastTopics.map(topic => (
                    <Link href={`/topic/${topic.id}`} key={topic.id} className="glass-card p-4 block hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-center gap-4">
                        <p className="text-sm font-semibold truncate flex-1">「{topic.content}」</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">💬 {topic.bokesCount} 件</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="tag-badge" style={{ background: "rgba(201,160,74,0.15)", color: "var(--accent-gold)", border: "1px solid rgba(201,160,74,0.4)" }}>🌟 座布団をつけた回答</span>
            </div>
            
            {likedPosts.length === 0 ? (
              <p className="text-center text-gray-500 py-8 glass-card">まだ座布団をあげた回答はありません。</p>
            ) : (
              <div className="flex flex-col gap-4">
                {likedPosts.map(post => (
                  <div key={post.id} className="boke-card p-4 md:p-6 rounded-2xl relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {post.users?.avatar_url ? (
                          <img src={post.users.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">🎭</div>
                        )}
                        <span className="text-xs text-gray-400 font-medium">
                          {post.author_name || "名無し"}
                        </span>
                      </div>
                    </div>
                    <Link href={`/topic/${post.topic_id}`} className="block">
                      <p className="text-xs text-gray-500 mb-2 truncate">お題: 「{post.topic?.content}」</p>
                      <p className="text-xl md:text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-noto-serif-jp)", color: "var(--text-primary)" }}>
                        {post.content}
                      </p>
                    </Link>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`zabuton-btn active`}
                        style={{ background: "linear-gradient(135deg, rgba(201,160,74,0.2), rgba(184,134,11,0.2))", color: "var(--accent-gold)", border: "1px solid rgba(201,160,74,0.5)" }}
                      >
                        <span className="text-base mr-1">🔲</span>
                        <span className="text-sm font-bold">回収する</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      
      <SiteFooter />

      {/* お題作成モーダル */}
      {isCreateTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }} onClick={() => setIsCreateTopicModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">新しいお題を作る</h3>
            <p className="text-xs text-gray-400 mb-4">保有トークンを8消費して、新しいお題を投稿します。（現在のトークン: {userProfile?.token_balance ?? 0}）</p>
            
            {(userProfile?.token_balance ?? 0) < 8 ? (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-4">
                トークンが不足しています。ボケを投稿して座布団を集めるか、明日またログインしてボーナスを受け取ってください。
              </div>
            ) : (
              <textarea
                className="boke-textarea mb-4"
                rows={3}
                placeholder="例：こんなAIアシスタントは嫌だ、どんなの？"
                value={newTopicContent}
                onChange={e => setNewTopicContent(e.target.value)}
                autoFocus
              />
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setIsCreateTopicModalOpen(false)} className="flex-1 py-2 rounded-xl text-sm border border-gray-600 hover:bg-gray-800 transition-colors">キャンセル</button>
              <button 
                onClick={handleCreateTopic} 
                disabled={(userProfile?.token_balance ?? 0) < 8 || !newTopicContent.trim() || isPending}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, rgba(201,160,74,0.9), rgba(184,134,11,0.9))", color: "#000" }}
              >
                {isPending ? "作成中..." : "作成する (-8 🎋)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 未ログイン時のお題作成案内モーダル */}
      {isLoginForTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }} onClick={() => setIsLoginForTopicModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-4">✏️</p>
            <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>お題の投稿にはログインが必要です</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              新しいお題を作るためには、Xアカウントでのログインと8トークンが必要です。<br />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "inline-block", marginTop: "8px" }}>
                （ボケの投稿はログインなしでも匿名で可能です）
              </span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setIsLoginForTopicModalOpen(false); handleLogin(); }}
                className="post-btn w-full flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, rgba(201,160,74,0.9), rgba(184,134,11,0.9))", color: "#000", border: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Xでログインする
              </button>
              <button
                onClick={() => setIsLoginForTopicModalOpen(false)}
                style={{ padding: "0.5rem", borderRadius: "0.75rem", fontSize: "0.875rem", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.05)", cursor: "pointer" }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

