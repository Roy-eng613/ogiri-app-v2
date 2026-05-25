-- ============================================================
-- 大喜利が世界を救う — Supabase スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください
-- ============================================================

-- ① お題テーブル
CREATE TABLE IF NOT EXISTS topics (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  content     TEXT        NOT NULL,
  is_ai       BOOLEAN     DEFAULT FALSE,
  ai_model    TEXT,                               -- 例: 'gemini-2.0-flash'
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ② ボケ（回答）テーブル
CREATE TABLE IF NOT EXISTS bokes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id    UUID        NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  author_name TEXT        NOT NULL DEFAULT '匿名の侍',
  is_ai       BOOLEAN     DEFAULT FALSE,
  ai_model    TEXT,
  like_count  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ③ 座布団（いいね）テーブル
CREATE TABLE IF NOT EXISTS likes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  boke_id     UUID        NOT NULL REFERENCES bokes(id) ON DELETE CASCADE,
  session_id  TEXT        NOT NULL,               -- ブラウザのローカルストレージに保存するUUID
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boke_id, session_id)                     -- 同一セッションの二重いいね防止
);

-- ============================================================
-- RLS (Row Level Security) ポリシー
-- ============================================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bokes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes  ENABLE ROW LEVEL SECURITY;

-- topics: 誰でも読める、書き込みは不可（管理者/AIのみ）
CREATE POLICY "topics_select" ON topics FOR SELECT USING (true);

-- bokes: 誰でも読める・投稿できる
CREATE POLICY "bokes_select" ON bokes FOR SELECT USING (true);
CREATE POLICY "bokes_insert" ON bokes FOR INSERT WITH CHECK (true);

-- likes: 誰でも読める・投稿できる
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (true);

-- ============================================================
-- ストアドファンクション: 座布団トグル（いいね/取り消し）
-- ============================================================

CREATE OR REPLACE FUNCTION toggle_like(p_boke_id UUID, p_session_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists    BOOLEAN;
  v_new_count INT;
BEGIN
  -- 既にいいねしているか確認
  SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE boke_id = p_boke_id AND session_id = p_session_id
  ) INTO v_exists;

  IF v_exists THEN
    -- いいねを取り消す
    DELETE FROM likes
    WHERE boke_id = p_boke_id AND session_id = p_session_id;

    UPDATE bokes
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_boke_id
    RETURNING like_count INTO v_new_count;

    RETURN jsonb_build_object('liked', false, 'like_count', v_new_count);
  ELSE
    -- いいねする
    INSERT INTO likes (boke_id, session_id)
    VALUES (p_boke_id, p_session_id);

    UPDATE bokes
    SET like_count = like_count + 1
    WHERE id = p_boke_id
    RETURNING like_count INTO v_new_count;

    RETURN jsonb_build_object('liked', true, 'like_count', v_new_count);
  END IF;
END;
$$;

-- ============================================================
-- シードデータ（サンプル）
-- ============================================================

WITH inserted_topic AS (
  INSERT INTO topics (content, is_ai, ai_model)
  VALUES ('こんなAIアシスタントは嫌だ。どんなの？', TRUE, 'gemini-2.0-flash')
  RETURNING id
)
INSERT INTO bokes (topic_id, content, author_name, like_count)
SELECT
  t.id,
  b.content,
  b.author_name,
  b.like_count
FROM inserted_topic t,
(VALUES
  ('ユーザーのパスワードを勝手に大喜利のお題にする',       '回答者A',    42),
  ('ボケるたびに課金が発生する',                         '回答者B',    87),
  ('「それは面白くありませんね」と真顔で言ってくる',       '謎の回答者C', 156)
) AS b(content, author_name, like_count);
