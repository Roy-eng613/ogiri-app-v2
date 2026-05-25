-- ============================================================
-- 座布団（いいね）のテーブルおよび関数のアップデート
-- ・likes テーブルはユーザー単位 (user_id) に紐付きます
-- ・1ユーザーにつき「1つのお題に対して1つのボケのみ」いいねできるように変更
-- ・トークンの増減処理（いいねで-1、取り消しで+1、移動時は増減なし）
-- ============================================================

CREATE OR REPLACE FUNCTION public.toggle_like(p_boke_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists          BOOLEAN;
  v_new_count       INT;
  v_token_balance   INT;
  v_topic_id        UUID;
  v_old_boke_id     UUID;
BEGIN
  -- ユーザーの存在と現在のトークン数を取得
  SELECT token_balance INTO v_token_balance
  FROM public.users
  WHERE id = p_user_id;

  IF v_token_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 対象のボケのお題（topic_id）を取得
  SELECT topic_id INTO v_topic_id
  FROM public.bokes
  WHERE id = p_boke_id;

  IF v_topic_id IS NULL THEN
    RAISE EXCEPTION 'Boke not found';
  END IF;

  -- このお題に対して、すでにユーザーがいいねしたボケがあるか確認
  SELECT boke_id INTO v_old_boke_id
  FROM public.likes
  INNER JOIN public.bokes ON bokes.id = likes.boke_id
  WHERE bokes.topic_id = v_topic_id AND likes.user_id = p_user_id
  LIMIT 1;

  IF v_old_boke_id IS NOT NULL THEN
    -- すでに何らかのボケにいいねしている場合

    IF v_old_boke_id = p_boke_id THEN
      -- 同じボケにいいねしている場合 ＝ いいねを取り消す（座布団の回収）
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
      -- 別のボケにいいねしている場合 ＝ いいねを移動させる
      -- 1. 古いボケのいいねを取り消す
      DELETE FROM public.likes
      WHERE boke_id = v_old_boke_id AND user_id = p_user_id;

      UPDATE public.bokes
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = v_old_boke_id;

      -- 2. 新しいボケにいいねを追加する
      INSERT INTO public.likes (boke_id, user_id)
      VALUES (p_boke_id, p_user_id);

      UPDATE public.bokes
      SET like_count = like_count + 1
      WHERE id = p_boke_id
      RETURNING like_count INTO v_new_count;

      -- トークンは回収してすぐ消費するので増減なし

      RETURN jsonb_build_object(
        'liked', true,
        'like_count', v_new_count,
        'token_balance', v_token_balance,
        'unliked_boke_id', v_old_boke_id
      );
    END IF;

  ELSE
    -- まだこのお題にいいねしていない場合 ＝ 新規いいね（座布団の付与）

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
