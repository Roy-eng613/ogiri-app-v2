-- ============================================================
-- users テーブル：X OAuth でログインしたユーザーを管理
-- Supabase SQL Editor で実行してください
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x_handle     TEXT,              -- @ハンドル名（例: ogiri_taro）
  display_name TEXT,              -- 表示名（例: 大喜利 太郎）
  avatar_url   TEXT,              -- プロフィール画像URL
  token_balance INTEGER NOT NULL DEFAULT 0,  -- 保有トークン数
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS を有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 誰でも参照可能（表示名・アバターは公開情報）
CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  USING (true);

-- 本人のみ更新可能
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- upsert（INSERT）は Service Role または本人
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- bokes テーブルに user_id カラムを追加（ログインユーザーの投稿を紐づける）
ALTER TABLE public.bokes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_bokes_user_id ON public.bokes(user_id);
