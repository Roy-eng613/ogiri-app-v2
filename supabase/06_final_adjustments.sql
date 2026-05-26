-- 1. 管理者がAI出題を投稿するための関数 (RLSをバイパス)
CREATE OR REPLACE FUNCTION public.insert_topic_as_admin(p_content TEXT, p_ai_model TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_topic_id UUID;
BEGIN
  INSERT INTO public.topics (content, is_ai, ai_model, is_active)
  VALUES (p_content, true, p_ai_model, true)
  RETURNING id INTO v_topic_id;
  
  RETURN v_topic_id;
END;
$$;

-- 2. ボケ投稿時に1トークン回復する関数 (RLSをバイパス)
CREATE OR REPLACE FUNCTION public.post_boke_with_reward(p_topic_id UUID, p_content TEXT, p_author_name TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_boke RECORD;
BEGIN
  -- ボケを挿入
  INSERT INTO public.bokes (topic_id, content, author_name, user_id)
  VALUES (p_topic_id, p_content, p_author_name, p_user_id)
  RETURNING * INTO v_boke;
  
  -- ユーザーIDがある場合はトークンを1追加
  IF p_user_id IS NOT NULL THEN
    UPDATE public.users SET token_balance = token_balance + 1 WHERE id = p_user_id;
  END IF;

  RETURN row_to_json(v_boke)::jsonb;
END;
$$;
