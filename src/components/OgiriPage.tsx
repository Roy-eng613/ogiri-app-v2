"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Topic, BokeWithLiked, User } from "@/types/database";
import { postBoke, toggleLike, claimDailyBonus } from "@/app/actions";
import { createClient } from "@/lib/supabase-browser";
import type { User as AuthUser } from "@supabase/supabase-js";
import SiteFooter from "./SiteFooter";

// ─── 定数 ─────────────────────────────────────────────────────
const MAX_CHARS = 140;

const ANONYMOUS_NAMES = [
  "匿名の侍", "名もなきボケ師", "謎の投稿者", "シャドウボーカー",
  "幻の回答者", "名無しの権兵衛", "どこかの誰か", "覆面芸人",
];
const AVATAR_EMOJIS = ["🥷", "🎪", "🎠", "🎭", "🎨", "🎯", "🌀", "🎲", "🃏", "🎋"];
const AVATAR_COLORS = ["#3a2a1a", "#1a2a3a", "#2a1a3a", "#1a3a2a", "#3a1a2a", "#2a2a3a"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── ローカルストレージは不使用（セッションベースのDB管理へ移行） ────────────────────

// ─── 残り時間カウンター ────────────────────────────────────────
function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) { setRemaining("∞"); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("殿堂入り"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        `あと ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining;
}

// ─── Xログインボタン ────────────────────────────────────────────

interface LoginButtonProps {
  authUser: AuthUser | null;
  userProfile: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

function LoginButton({ authUser, userProfile, onLogin, onLogout }: LoginButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!authUser) {
    return (
      <button
        id="x-login-btn"
        onClick={onLogin}
        aria-label="Xでログイン"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 14px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.06)",
          color: "var(--text-secondary)",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        }}
      >
        {/* X (Twitter) ロゴ */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        ログイン
      </button>
    );
  }

  const displayName = userProfile?.display_name ?? authUser.user_metadata?.full_name ?? "ユーザー";
  const handle = userProfile?.x_handle ?? authUser.user_metadata?.user_name;
  const avatarUrl = userProfile?.avatar_url ?? authUser.user_metadata?.avatar_url;
  const tokens = userProfile?.token_balance ?? 0;

  return (
    <div style={{ position: "relative" }}>
      <button
        id="user-menu-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="ユーザーメニュー"
        aria-expanded={menuOpen}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "5px 12px 5px 5px",
          borderRadius: "20px",
          border: "1px solid rgba(201,160,74,0.3)",
          background: "rgba(201,160,74,0.08)",
          color: "var(--text-secondary)",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,160,74,0.14)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,160,74,0.08)";
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            width={26}
            height={26}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "var(--bg-card)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "0.9rem",
          }}>🎭</div>
        )}
        <span style={{ color: "var(--text-primary)", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <span style={{ color: "var(--accent-gold)", fontSize: "0.75rem" }}>
          🎋{tokens}
        </span>
      </button>

      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
            padding: "8px",
            minWidth: "180px",
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            animation: "fadeInUp 0.15s ease-out",
          }}
        >
          {handle && (
            <p style={{ padding: "6px 10px", fontSize: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", marginBottom: "6px" }}>
              @{handle}
            </p>
          )}
          <p style={{ padding: "6px 10px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            🎋 トークン: <strong style={{ color: "var(--accent-gold)" }}>{tokens}</strong>
          </p>
          <button
            id="logout-btn"
            onClick={() => { setMenuOpen(false); onLogout(); }}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginTop: "4px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(217,79,79,0.1)",
              color: "var(--accent-red-light)",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(217,79,79,0.2)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(217,79,79,0.1)")}
          >
            🚪 ログアウト
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ログインモーダル ────────────────────────────────────────────
function LoginModal({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card max-w-md w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-4xl mb-4">⛩️</p>
        <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          ログインが必要です
        </h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          座布団をあげるためにはXでのログインが必要です。ログインしますか？<br />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "inline-block", marginTop: "8px" }}>
            （お題へのボケ投稿はログインしなくても匿名で可能です）
          </span>
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onLogin}
            className="post-btn w-full flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, rgba(201,160,74,0.9), rgba(184,134,11,0.9))",
              color: "#000",
              border: "none"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでログインする
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.05)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── サブコンポーネント ────────────────────────────────────────

interface SiteHeaderProps {
  bokeCount: number;
  authUser: AuthUser | null;
  userProfile: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

function SiteHeader({ bokeCount, authUser, userProfile, onLogin, onLogout }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255,255,255,0.03)",
              transition: "all 0.2s",
            }}
          >
            ← お題一覧
          </Link>
          <span className="text-2xl" role="img" aria-label="笑いの神">⛩️</span>
          <div>
            <p className="text-sm font-bold tracking-wide" style={{ color: "var(--accent-gold)", fontFamily: "var(--font-noto-serif-jp)" }}>
              大喜利が世界を救う
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI大喜利SNS · β版</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="tag-badge" style={{ background: "rgba(201,160,74,0.12)", color: "var(--accent-gold)", border: "1px solid rgba(201,160,74,0.3)" }}>
            🎌 本日開催中 {bokeCount > 0 && `· ${bokeCount}件`}
          </span>
          <LoginButton
            authUser={authUser}
            userProfile={userProfile}
            onLogin={onLogin}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}

function TopicCard({ topic, bokeCount }: { topic: Topic; bokeCount: number }) {
  const remaining = useCountdown(topic.expires_at);

  return (
    <section aria-labelledby="topic-heading">
      <div className="topic-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="tag-badge" style={{ background: "rgba(217,79,79,0.15)", color: "var(--accent-red-light)", border: "1px solid rgba(217,79,79,0.4)" }}>
            🔥 本日のお題
          </span>
          {topic.is_ai && (
            <span className="tag-badge" style={{ background: "rgba(201,160,74,0.1)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              🤖 {topic.ai_model ?? "AI"} 出題
            </span>
          )}
        </div>

        <p
          id="topic-heading"
          className="text-xl md:text-2xl font-bold leading-relaxed mb-5"
          style={{ fontFamily: "var(--font-noto-serif-jp)", color: "var(--text-primary)", textShadow: "0 0 40px rgba(201,160,74,0.2)" }}
        >
          「{topic.content}」
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--accent-gold), transparent)" }} />
          <span style={{ color: "var(--accent-gold)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>◆◇◆</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, var(--accent-gold), transparent)" }} />
        </div>

        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>💬 回答 <strong style={{ color: "var(--text-secondary)" }}>{bokeCount}件</strong></span>
          <span>⏰ 報酬判定まで <strong style={{ color: remaining === "殿堂入り" ? "var(--text-muted)" : "var(--accent-gold)" }}>{remaining}</strong></span>
        </div>
      </div>
    </section>
  );
}

interface PostFormProps {
  topicId: string;
  authUser: AuthUser | null;
  onSubmit: (content: string, authorName: string) => Promise<void>;
  onLoginRequired: () => void;
}

function PostForm({ topicId: _topicId, authUser, onSubmit, onLoginRequired }: PostFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = MAX_CHARS - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = () => {
    if (isEmpty || isOverLimit || isPending) return;
    const authorName = authUser
      ? (authUser.user_metadata?.full_name ?? authUser.user_metadata?.user_name ?? "名無しのボケ師")
      : randomItem(ANONYMOUS_NAMES);
    const trimmed = content.trim();
    startTransition(async () => {
      await onSubmit(trimmed, authorName);
      setContent("");
      textareaRef.current?.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
  };

  return (
    <section aria-label="ボケを投稿する">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">✏️</span>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            あなたのボケを投稿する
          </h2>
          {authUser && (
            <span className="tag-badge ml-auto" style={{ background: "rgba(201,160,74,0.1)", color: "var(--accent-gold)", border: "1px solid rgba(201,160,74,0.2)", fontSize: "0.65rem" }}>
              ログイン中
            </span>
          )}
        </div>

        <textarea
          ref={textareaRef}
          id="boke-input"
          className="boke-textarea"
          rows={3}
          placeholder="ボケを入力してください…（Ctrl+Enterで投稿）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="ボケの入力欄"
          aria-describedby="char-counter"
          disabled={isPending}
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span
              id="char-counter"
              className="char-counter"
              style={{
                color: isOverLimit ? "var(--accent-red)" : remaining <= 20 ? "#e0a040" : "var(--text-muted)",
              }}
            >
              {content.length > 0 ? `残り ${remaining} 字` : `最大 ${MAX_CHARS} 字`}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {authUser ? "✨ アカウント投稿" : "🎭 匿名投稿"}
            </span>
          </div>

          <button
            id="submit-boke-btn"
            className="post-btn"
            onClick={handleSubmit}
            disabled={isEmpty || isOverLimit || isPending}
            aria-label={authUser ? "投稿する" : "匿名で投稿する"}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                投稿中…
              </span>
            ) : (
              authUser ? "投稿する 🎌" : "匿名で投稿する 🎌"
            )}
          </button>
        </div>

        {/* ログイン促進バナー（未ログイン時のみ） */}
        {!authUser && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(201,160,74,0.06)",
              border: "1px solid rgba(201,160,74,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
              🔑 Xアカウントでログインすると、座布団をもらってトークンを獲得できます
            </p>
            <button
              id="post-form-login-btn"
              onClick={onLoginRequired}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "14px",
                border: "1px solid rgba(201,160,74,0.4)",
                background: "rgba(201,160,74,0.1)",
                color: "var(--accent-gold)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Xでログイン
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

interface BokeCardProps {
  post: BokeWithLiked;
  onLike: (id: string) => Promise<boolean>;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  isOwnPost: boolean;
}

function BokeCard({ post, onLike, isLoggedIn, onLoginRequired, isOwnPost }: BokeCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localLiked, setLocalLiked] = useState(post.liked);
  const [localCount, setLocalCount] = useState(post.like_count);

  // propsが変わったらローカル状態を同期（新規投稿時など）
  useEffect(() => {
    setLocalLiked(post.liked);
    setLocalCount(post.like_count);
  }, [post.liked, post.like_count]);

  const handleLike = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    if (isPending) return;

    // オプティミスティック更新
    const wasLiked = localLiked;
    setLocalLiked((prev) => !prev);
    setLocalCount((prev) => wasLiked ? prev - 1 : prev + 1);

    startTransition(async () => {
      const success = await onLike(post.id);
      if (!success) {
        // 失敗した場合はロールバック
        setLocalLiked(post.liked);
        setLocalCount(post.like_count);
      }
    });
  };

  // 投稿時刻のフォーマット
  const formattedTime = (() => {
    if (post.isNew) return "たった今";
    const diff = Date.now() - new Date(post.created_at).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  })();

  const avatarColor = AVATAR_COLORS[post.id.charCodeAt(0) % AVATAR_COLORS.length];
  const avatarEmoji = AVATAR_EMOJIS[post.id.charCodeAt(1) % AVATAR_EMOJIS.length];
  const hasAvatarImage = !!post.users?.avatar_url;

  return (
    <article
      className={`boke-card p-4 ${post.isNew ? "animate-fade-in-up" : ""}`}
      aria-label={`${post.author_name}のボケ`}
      style={isOwnPost ? {
        border: "1px solid rgba(201,160,74,0.4)",
        background: "rgba(201,160,74,0.03)",
        boxShadow: "0 4px 20px rgba(201,160,74,0.05)"
      } : undefined}
    >
      <div className="flex gap-3">
        <div
          className="avatar text-lg flex-shrink-0 overflow-hidden relative"
          style={hasAvatarImage ? { padding: 0, border: "1px solid rgba(255,255,255,0.1)" } : { background: avatarColor, borderColor: "var(--border-subtle)" }}
          aria-hidden="true"
        >
          {post.is_ai ? "🤖" : (
            hasAvatarImage ? (
              <img src={post.users!.avatar_url!} alt="" className="w-full h-full object-cover" />
            ) : avatarEmoji
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              {post.author_name}
            </span>
            {isOwnPost && (
              <span className="tag-badge" style={{ background: "linear-gradient(135deg, rgba(201,160,74,0.2), rgba(184,134,11,0.2))", color: "var(--accent-gold)", border: "1px solid rgba(201,160,74,0.3)", fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                👑 あなたのボケ
              </span>
            )}
            {post.is_ai && post.ai_model && (
              <span className="tag-badge" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", fontSize: "0.65rem" }}>
                AI
              </span>
            )}
            {post.isNew && (
              <span className="new-badge">NEW</span>
            )}
            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
              {formattedTime}
            </span>
          </div>

          <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-primary)" }}>
            {post.content}
          </p>

          <div className="flex items-center gap-2">
            <button
              id={`zabuton-btn-${post.id}`}
              className={`zabuton-btn ${localLiked ? "liked" : ""}`}
              onClick={handleLike}
              disabled={isPending}
              aria-label={localLiked ? `座布団を回収する（現在${localCount}枚）` : `座布団を贈る（現在${localCount}枚）`}
              aria-pressed={localLiked}
              style={localLiked ? {
                background: "linear-gradient(135deg, rgba(201,160,74,0.15), rgba(217,79,79,0.15))",
                borderColor: "rgba(201,160,74,0.5)",
                color: "var(--accent-gold)",
                boxShadow: "0 0 15px rgba(201,160,74,0.2)",
              } : {}}
            >
              <span className="text-base">{localLiked ? "🏅" : "🎋"}</span>
              <span className="font-semibold">{localCount}</span>
              <span>{localLiked ? "座布団を回収" : "座布団をあげる"}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── メインクライアントコンポーネント ─────────────────────────

interface OgiriPageProps {
  topic: Topic;
  initialBokes: BokeWithLiked[];
  initialAuthUser?: AuthUser | null;
  initialUserProfile?: User | null;
}

export default function OgiriPage({ topic, initialBokes, initialAuthUser, initialUserProfile }: OgiriPageProps) {
  const [posts, setPosts] = useState<BokeWithLiked[]>(initialBokes);
  const [error, setError] = useState<string | null>(null);

  // サーバー側から渡されたいいね状態の変更をキャッチして同期
  useEffect(() => {
    setPosts(initialBokes);
  }, [initialBokes]);

  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error" | "skipped">("idle");
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 認証関連ステート (サーバーから渡された初期値を使用)
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuthUser ?? null);
  const [userProfile, setUserProfile] = useState<User | null>(initialUserProfile ?? null);
  const [authLoading, setAuthLoading] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // supabase クライアントをメモ化して無限ループを防ぐ
  const [supabase] = useState(() => createClient());

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setUserProfile(data);
  }, [supabase]);

  // ─── 認証状態の監視 ────────────────────────────────────────
  useEffect(() => {
    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setAuthUser(currentUser);
        if (currentUser) {
          await fetchUserProfile(currentUser.id);

          // ログインボーナスチェック
          if (_event === "INITIAL_SESSION" || _event === "SIGNED_IN") {
            const res = await claimDailyBonus();
            if (res?.claimed) {
              alert(`🎁 ログインボーナス！\n5 トークン獲得しました！`);
              await fetchUserProfile(currentUser.id); // 残高更新
            }
          }
        } else {
          setUserProfile(null);
          // 未ログイン時はすべてのいいねを解除
          setPosts((prev) => prev.map((p) => ({ ...p, liked: false })));
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, supabase]);

  // ─── Xログイン ────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    console.log("[Auth Debug] handleLogin starting X Login");
    console.log("[Auth Debug] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[Auth Debug] Supabase Anon Key (truncated):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 15) + "...") : "undefined");
    console.log("[Auth Debug] window.location.origin:", window.location.origin);
    console.log("[Auth Debug] Target Redirect URL:", `${window.location.origin}/auth/callback`);
    console.log("[Auth Debug] Calling signInWithOAuth with provider: 'x'...");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "x",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[Auth Debug] signInWithOAuth failed:", error);
    } else {
      console.log("[Auth Debug] signInWithOAuth success:", data);
    }
  }, [supabase]);

  // ─── ログアウト ──────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setUserProfile(null);
  }, [supabase]);

  const handlePost = useCallback(async (content: string, authorName: string) => {
    setError(null);
    const { data, error: err } = await postBoke(topic.id, content, authorName);
    if (err || !data) {
      setError("投稿に失敗しました。しばらくしてから再試行してください。");
      return;
    }
    setPosts((prev) => [{ ...data, isNew: true }, ...prev]);
    setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [topic.id]);

  const handleLike = useCallback(async (bokeId: string): Promise<boolean> => {
    if (!authUser) {
      setIsLoginModalOpen(true);
      return false;
    }

    const targetPost = posts.find(p => p.id === bokeId);
    const isRetrieving = targetPost?.liked;
    const hasLikedAnother = posts.some(p => p.liked && p.id !== bokeId);

    // 事前にトークン不足をチェック
    if (!isRetrieving && !hasLikedAnother && userProfile && (userProfile.token_balance ?? 0) <= 0) {
      alert("座布団トークンが不足しています。");
      return false;
    }

    // オプティミスティックにトークンを更新
    setUserProfile((prev) => {
      if (!prev) return prev;
      let nextToken = prev.token_balance ?? 0;
      if (isRetrieving) nextToken += 1;
      else if (!hasLikedAnother) nextToken -= 1;
      return { ...prev, token_balance: nextToken };
    });

    const result = await toggleLike(bokeId);

    // エラー時のロールバック処理
    if (!result || result.error) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        let rollbackToken = prev.token_balance ?? 0;
        if (isRetrieving) rollbackToken -= 1;
        else if (!hasLikedAnother) rollbackToken += 1;
        return { ...prev, token_balance: rollbackToken };
      });
      if (result?.error === "insufficient_tokens") {
        alert("座布団トークンが不足しています。");
      } else {
        alert("エラーが発生しました。");
      }
      return false;
    }

    // サーバーからの正確なカウントで更新（移動した場合は古いボケのいいねも外す）
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === bokeId) {
          return { ...p, liked: result.liked, like_count: result.like_count };
        }
        if (result.unliked_boke_id && p.id === result.unliked_boke_id) {
          // 移動によっていいねが外れた古いボケ
          return { ...p, liked: false, like_count: Math.max(0, p.like_count - 1) };
        }
        return p;
      })
    );

    // ユーザープロフィールのトークン残高を更新
    const tokenBalance = result.token_balance;
    if (tokenBalance !== undefined) {
      setUserProfile((prev) => prev ? { ...prev, token_balance: tokenBalance } : null);
    }

    return true;
  }, [authUser, posts, userProfile]);

  // ─── AI ボケ生成リクエスト（開発用） ──────────────────────────
  const handleRequestAiBoke = useCallback(async () => {
    setAiStatus("loading");
    setAiMessage("");
    try {
      const res = await fetch("/api/ai/boke");
      const json = await res.json();
      if (!res.ok) {
        setAiStatus("error");
        setAiMessage(json.error ?? "不明なエラーが発生しました。");
        return;
      }
      if (json.skipped) {
        setAiStatus("skipped");
        setAiMessage("Gemini はすでにこのお題にボケを投稿済みです。");
        return;
      }
      setAiStatus("success");
      setAiMessage(`「${json.boke?.content}」`);
      // ページをリフレッシュして新しいボケをタイムラインに反映
      setTimeout(() => router.refresh(), 1000);
    } catch {
      setAiStatus("error");
      setAiMessage("ネットワークエラーが発生しました。");
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader
        bokeCount={posts.length}
        authUser={authLoading ? null : authUser}
        userProfile={userProfile}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* ① お題エリア */}
        <TopicCard topic={topic} bokeCount={posts.length} />

        {/* ② 投稿フォーム */}
        <PostForm
          topicId={topic.id}
          authUser={authUser}
          onSubmit={handlePost}
          onLoginRequired={() => setIsLoginModalOpen(true)}
        />

        {/* エラーメッセージ */}
        {error && (
          <div
            role="alert"
            className="rounded-xl px-4 py-3 text-sm animate-fade-in-up"
            style={{ background: "rgba(217,79,79,0.12)", border: "1px solid rgba(217,79,79,0.4)", color: "var(--accent-red-light)" }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ─── 開発用: AI ボケリクエストパネル ──────────────────── */}
        <section aria-label="AI ボケ生成（開発用）">
          <div
            className="glass-card p-4"
            style={{ border: "1px dashed rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🤖</span>
              <h2 className="text-sm font-semibold" style={{ color: "#a5b4fc" }}>
                AI ボケ生成（開発用）
              </h2>
              <span
                className="tag-badge ml-auto"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", fontSize: "0.6rem" }}
              >
                DEV TOOL
              </span>
            </div>

            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Gemini に現在のお題へのボケを生成させます。すでに投稿済みの場合はスキップされます。
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                id="ai-boke-btn"
                onClick={handleRequestAiBoke}
                disabled={aiStatus === "loading"}
                aria-label="Gemini にボケを生成させる"
                className="post-btn"
                style={{
                  background: aiStatus === "loading"
                    ? "rgba(99,102,241,0.3)"
                    : "linear-gradient(135deg, rgba(99,102,241,0.8), rgba(139,92,246,0.8))",
                  border: "1px solid rgba(99,102,241,0.5)",
                  minWidth: "180px",
                }}
              >
                {aiStatus === "loading" ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Gemini が考え中…
                  </span>
                ) : (
                  "🤖 Gemini にボケさせる"
                )}
              </button>

              {aiStatus !== "idle" && aiStatus !== "loading" && (
                <div
                  className="text-xs rounded-lg px-3 py-2 flex-1 animate-fade-in-up"
                  style={{
                    background: aiStatus === "success"
                      ? "rgba(52,211,153,0.1)"
                      : aiStatus === "skipped"
                      ? "rgba(251,191,36,0.1)"
                      : "rgba(217,79,79,0.1)",
                    border: `1px solid ${
                      aiStatus === "success"
                        ? "rgba(52,211,153,0.3)"
                        : aiStatus === "skipped"
                        ? "rgba(251,191,36,0.3)"
                        : "rgba(217,79,79,0.3)"
                    }`,
                    color: aiStatus === "success"
                      ? "#6ee7b7"
                      : aiStatus === "skipped"
                      ? "#fbbf24"
                      : "var(--accent-red-light)",
                  }}
                >
                  {aiStatus === "success" && "✅ 投稿しました！ "}
                  {aiStatus === "skipped" && "⏭️ "}
                  {aiStatus === "error" && "❌ "}
                  {aiMessage}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ③ タイムライン */}
        <section aria-label="ボケ一覧" ref={timelineRef}>
          <div className="divider-label mb-4">
            <span>📜 みんなのボケ</span>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <p className="text-3xl mb-3">🎭</p>
              <p>まだボケがありません。最初のボケ師になろう！</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <BokeCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  isLoggedIn={!!authUser}
                  onLoginRequired={() => setIsLoginModalOpen(true)}
                  isOwnPost={authUser?.id === post.user_id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />

      {isLoginModalOpen && (
        <LoginModal
          onLogin={() => {
            setIsLoginModalOpen(false);
            handleLogin();
          }}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}
