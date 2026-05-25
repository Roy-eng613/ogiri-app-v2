-- ============================================================
-- 座布団（いいね）のテーブルおよび関数のアップデート
-- ・likes テーブルをセッション単位からユーザー単位に変更
-- ・トークンの増減処理（いいねで-1、取り消しで+1）を追加
-- Supabase の SQL Editor に貼り付けて実行してください
-- ============================================================

-- 既存の toggle_like 関数と likes テーブルを削除
DROP FUNCTION IF EXISTS public.toggle_like(UUID, TEXT);
DROP FUNCTION IF EXISTS public.toggle_like(UUID, UUID);
DROP TABLE IF EXISTS public.likes;

-- 新しい likes テーブルを作成（user_id に紐付ける）
CREATE TABLE public.likes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  boke_id     UUID        NOT NULL REFERENCES public.bokes(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boke_id, user_id)                     -- 同一ユーザーの二重いいね防止
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- ポリシーの設定
CREATE POLICY "likes_select_all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- users テーブルの token_balance のデフォルト値を 10 に変更
ALTER TABLE public.users ALTER COLUMN token_balance SET DEFAULT 10;

-- 既存のユーザーでトークン残高が 0 のユーザーに初期テスト用として 10 トークンを付与する
UPDATE public.users SET token_balance = 10 WHERE token_balance = 0;


-- 新しい toggle_like 関数を作成
CREATE OR REPLACE FUNCTION public.toggle_like(p_boke_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists          BOOLEAN;
  v_new_count       INT;
  v_token_balance   INT;
BEGIN
  -- ユーザーの存在と現在のトークン数を取得
  SELECT token_balance INTO v_token_balance
  FROM public.users
  WHERE id = p_user_id;

  IF v_token_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 既にいいねしているか確認
  SELECT EXISTS(
    SELECT 1 FROM public.likes
    WHERE boke_id = p_boke_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- いいねを取り消す（座布団の回収）
    DELETE FROM public.likes
    WHERE boke_id = p_boke_id AND user_id = p_user_id;

    -- ボケのいいね数を減らす
    UPDATE public.bokes
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_boke_id
    RETURNING like_count INTO v_new_count;

    -- ユーザーのトークンを返却 (+1)
    UPDATE public.users
    SET token_balance = token_balance + 1
    WHERE id = p_user_id
    RETURNING token_balance INTO v_token_balance;

    RETURN jsonb_build_object(
      'liked', false,
      'like_count', v_new_count,
      'token_balance', v_token_balance
    );
  ELSE
    -- いいねする（座布団の付与）
    -- トークン数が 0 以下の場合はエラーを返す
    IF v_token_balance <= 0 THEN
      RETURN jsonb_build_object(
        'error', 'insufficient_tokens',
        'message', '座布団トークンが不足しています。'
      );
    END IF;

    -- いいねを追加
    INSERT INTO public.likes (boke_id, user_id)
    VALUES (p_boke_id, p_user_id);

    -- ボケのいいね数を増やす
    UPDATE public.bokes
    SET like_count = like_count + 1
    WHERE id = p_boke_id
    RETURNING like_count INTO v_new_count;

    -- ユーザーのトークンを消費 (-1)
    UPDATE public.users
    SET token_balance = GREATEST(token_balance - 1, 0)
    WHERE id = p_user_id
    RETURNING token_balance INTO v_token_balance;

    RETURN jsonb_build_object(
      'liked', true,
      'like_count', v_new_count,
      'token_balance', v_token_balance
    );
  END IF;
END;
$$;
