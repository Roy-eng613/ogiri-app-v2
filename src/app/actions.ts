"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { BokeWithLiked } from "@/types/database";

// ─── ボケを投稿する ───────────────────────────────────────────

export async function postBoke(
  topicId: string,
  content: string,
  authorName: string
): Promise<{ data: BokeWithLiked | null; error: string | null }> {
  const supabase = await createClient();

  // ログインユーザーの取得
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.rpc("post_boke_with_reward", {
    p_topic_id: topicId,
    p_content: content,
    p_author_name: authorName,
    p_user_id: user?.id ?? null
  });

  if (error) {
    console.error("[postBoke] error:", error.message);
    return { data: null, error: error.message };
  }

  revalidatePath("/");
  return { data: { ...data, liked: false, isNew: true }, error: null };
}

// ─── 座布団（いいね）をトグルする ─────────────────────────────

export async function toggleLike(
  bokeId: string
): Promise<{ liked: boolean; like_count: number; token_balance?: number; unliked_boke_id?: string; error?: string; message?: string } | null> {
  const supabase = await createClient();

  // ログインユーザーの取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { liked: false, like_count: 0, error: "not_logged_in" };
  }

  const { data, error } = await supabase.rpc("toggle_like", {
    p_boke_id: bokeId,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[toggleLike] error:", error.message);
    return null;
  }

  const result = data as { liked: boolean; like_count: number; token_balance?: number; unliked_boke_id?: string; error?: string; message?: string };
  
  revalidatePath("/");
  return result;
}

// ─── 新しいお題を投稿する (8トークン消費) ─────────────────────────

export async function postNewTopic(
  content: string,
  is_ai: boolean = false
): Promise<{ success: boolean; topic_id?: string; token_balance?: number; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "not_logged_in" };
  }

  if (is_ai) {
    const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "c5a79b44-1cea-4b77-a9dc-d98ed49e4260").split(",").map(id => id.trim());
    const isAdmin = adminUids.includes(user.id);
    
    if (isAdmin) {
      // 管理者によるAI出題（トークン消費なし、RLSバイパス）
      const { data: topicId, error } = await supabase.rpc("insert_topic_as_admin", {
        p_content: content,
        p_ai_model: "AIからの出題"
      });

      if (error) {
        console.error("[postNewTopic Admin] error:", error.message);
        return { success: false, error: error.message };
      }
      revalidatePath("/");
      return { success: true, topic_id: topicId };
    } else {
      return { success: false, error: "unauthorized_admin" };
    }
  }

  // 通常のユーザーによるお題作成（8トークン消費）
  const { data, error } = await supabase.rpc("create_topic_with_tokens", {
    p_user_id: user.id,
    p_content: content,
  });

  if (error) {
    console.error("[postNewTopic] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return data as any;
}

// ─── ログインボーナスを受け取る (+5トークン) ─────────────────────────

export async function claimDailyBonus(): Promise<{ claimed: boolean; amount?: number; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { claimed: false, error: "not_logged_in" };
  }

  const { data, error } = await supabase.rpc("claim_daily_bonus", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("[claimDailyBonus] error:", error.message);
    return { claimed: false, error: error.message };
  }

  return data as any;
}
