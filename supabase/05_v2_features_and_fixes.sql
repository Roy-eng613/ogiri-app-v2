-- 1. アバター画像表示のための公開ビューを作成
CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT id, display_name, avatar_url, x_handle
FROM public.users;

-- ビューに対するアクセス権を付与
GRANT SELECT ON public.user_public_profiles TO authenticated, anon;


-- 1.5. 過去のお題を「座布団（いいね）の合計数」でソートするためのビューを作成
CREATE OR REPLACE VIEW public.topics_with_stats AS
SELECT 
  t.*,
  COALESCE(SUM(b.like_count), 0) as total_likes,
  COUNT(b.id) as bokes_count
FROM public.topics t
LEFT JOIN public.bokes b ON t.id = b.topic_id
GROUP BY t.id;

GRANT SELECT ON public.topics_with_stats TO authenticated, anon;


-- 2. お題テーブルに「報酬配布済み」フラグを追加
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS rewarded BOOLEAN NOT NULL DEFAULT false;


-- 3. 24時間経過したお題のトップ5に報酬を配る関数を作成
CREATE OR REPLACE FUNCTION public.distribute_24h_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r_topic RECORD;
  r_boke RECORD;
  reward_amounts INT[] := ARRAY[5, 4, 3, 2, 1];
  i INT;
BEGIN
  -- 24時間以上経過し、まだ報酬が配られていないお題を取得
  FOR r_topic IN 
    SELECT id FROM public.topics 
    WHERE created_at <= (NOW() - INTERVAL '24 hours')
      AND rewarded = false
  LOOP
    i := 1;
    -- そのお題のボケをいいね順にトップ5取得（ゲスト投稿は除くため user_id IS NOT NULL）
    FOR r_boke IN
      SELECT user_id, like_count 
      FROM public.bokes 
      WHERE topic_id = r_topic.id AND user_id IS NOT NULL
      ORDER BY like_count DESC, created_at ASC
      LIMIT 5
    LOOP
      -- 該当ユーザーに順位に応じたトークン報酬を付与
      UPDATE public.users 
      SET token_balance = token_balance + reward_amounts[i]
      WHERE id = r_boke.user_id;
      
      i := i + 1;
    END LOOP;
    
    -- お題を報酬配布済みとしてマーク
    UPDATE public.topics SET rewarded = true WHERE id = r_topic.id;
  END LOOP;
END;
$$;


-- =========================================================================
-- 以降は定期実行（cron）の設定です
-- ※実行前に、Supabase画面左の「Database」→「Extensions」から 
--   "pg_cron" を有効化（ON）にしておく必要があります！
-- =========================================================================

-- 拡張機能が有効になっているか確認し、無ければ有効化（権限エラーになる場合は手動でONにしてください）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 古いジョブがあれば削除（重複登録を防ぐため）
SELECT cron.unschedule('daily-token-reset');
SELECT cron.unschedule('hourly-reward-distribution');

-- A. 毎日深夜0時(JST)に、トークン残高が5未満のユーザーのトークンを5に回復するジョブ
-- (UTCの15:00 = JSTの0:00)
SELECT cron.schedule(
  'daily-token-reset',
  '0 15 * * *',
  $$ UPDATE public.users SET token_balance = 5 WHERE token_balance < 5; $$
);

-- B. 1時間に1回（毎時0分）に、24時間経過したお題の報酬を配布するジョブ
SELECT cron.schedule(
  'hourly-reward-distribution',
  '0 * * * *',
  $$ SELECT public.distribute_24h_rewards(); $$
);
