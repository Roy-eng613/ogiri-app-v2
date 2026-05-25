-- ============================================================
-- トップページ改修とトークンエコノミー（ボーナス＆お題作成）
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 1. users テーブルにログインボーナス用のカラムを追加
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_bonus_date DATE;

-- 2. ログインボーナス付与の関数 (1日1回 +5トークン)
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_bonus_date DATE;
  v_today DATE := (NOW() AT TIME ZONE 'Asia/Tokyo')::DATE;
BEGIN
  -- 現在の記録を取得
  SELECT last_bonus_date INTO v_last_bonus_date
  FROM public.users
  WHERE id = p_user_id;

  -- まだ今日のボーナスを受け取っていない場合
  IF v_last_bonus_date IS NULL OR v_last_bonus_date < v_today THEN
    UPDATE public.users
    SET token_balance = token_balance + 5,
        last_bonus_date = v_today
    WHERE id = p_user_id;

    RETURN jsonb_build_object('claimed', true, 'amount', 5);
  ELSE
    RETURN jsonb_build_object('claimed', false);
  END IF;
END;
$$;

-- 3. お題作成の関数 (8トークン消費)
CREATE OR REPLACE FUNCTION public.create_topic_with_tokens(p_user_id UUID, p_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_balance INT;
  v_new_topic_id UUID;
BEGIN
  -- ユーザーのトークン残高を取得
  SELECT token_balance INTO v_token_balance
  FROM public.users
  WHERE id = p_user_id;

  IF v_token_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_token_balance < 8 THEN
    RAISE EXCEPTION 'Insufficient tokens (requires 8)';
  END IF;

  -- トークンを8消費
  UPDATE public.users
  SET token_balance = token_balance - 8
  WHERE id = p_user_id;

  -- 既存のお題のアクティブフラグを落とす（トップページの一覧化に伴い必須ではないが、念のため）
  UPDATE public.topics
  SET is_active = false
  WHERE is_active = true;

  -- 新しいお題を挿入
  INSERT INTO public.topics (content, is_active, is_ai)
  VALUES (p_content, true, false)
  RETURNING id INTO v_new_topic_id;

  RETURN jsonb_build_object(
    'success', true,
    'topic_id', v_new_topic_id,
    'token_balance', v_token_balance - 8
  );
END;
$$;
