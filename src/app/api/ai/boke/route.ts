import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase-server";

// ─── Gemini クライアント ───────────────────────────────────────
// APIキーはサーバーサイドのみ（NEXT_PUBLIC_ なし）
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// AI 投稿者名
const AI_AUTHOR_NAME = "Gemini";
const AI_MODEL_NAME = "gemini";

/**
 * GET /api/ai/boke
 *
 * アクティブなお題に対して Gemini がボケを生成し DB に保存する。
 * ログイン中のユーザーのみ実行可能。
 */
export async function GET() {
  // ① ログイン認証チェック（ログインユーザーのみ許可）
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "このAPIはログイン中のユーザーのみ使用できます。" },
      { status: 401 }
    );
  }

  // ② APIキーチェック
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  // ③ 現在アクティブなお題を取得
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, content")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (topicError || !topic) {
    return NextResponse.json(
      { error: "アクティブなお題が見つかりませんでした。" },
      { status: 404 }
    );
  }

  // ③ 重複チェック（そのお題に Gemini がすでに回答済みかどうか）
  const { data: existing } = await supabase
    .from("bokes")
    .select("id")
    .eq("topic_id", topic.id)
    .eq("ai_model", AI_MODEL_NAME)
    .eq("is_ai", true)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        message: "Gemini はすでにこのお題にボケを投稿済みです。",
        boke_id: existing.id,
        skipped: true,
      },
      { status: 200 }
    );
  }

  // ④ Gemini に大喜利ボケを生成させる
  const prompt = `あなたは日本の大喜利の達人です。
以下のお題に対して、クスッと笑えるユニークなボケを1つだけ日本語で答えてください。

ルール：
- 回答は1文〜2文以内で簡潔に
- 140文字以内
- ボケの文章のみを出力すること（「回答：」などの前置きは不要）
- 少しシュールで、予想外のひねりがあると良い
- 人間が書いたような自然な文体で

お題：「${topic.content}」`;

  let bokeContent: string;
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    bokeContent = response.text?.trim() ?? "";
  } catch (err) {
    console.error("[ai/boke] Gemini API エラー:", err);
    return NextResponse.json(
      { error: "Gemini API の呼び出しに失敗しました。" },
      { status: 502 }
    );
  }

  if (!bokeContent) {
    return NextResponse.json(
      { error: "Gemini から空のレスポンスが返ってきました。" },
      { status: 502 }
    );
  }

  // 140字を超えた場合は末尾を切る（念のため）
  if (bokeContent.length > 140) {
    bokeContent = bokeContent.slice(0, 140);
  }

  // ⑤ DB に保存
  const { data: newBoke, error: insertError } = await supabase
    .from("bokes")
    .insert({
      topic_id: topic.id,
      content: bokeContent,
      author_name: AI_AUTHOR_NAME,
      is_ai: true,
      ai_model: AI_MODEL_NAME,
    })
    .select()
    .single();

  if (insertError || !newBoke) {
    console.error("[ai/boke] DB 保存エラー:", insertError);
    return NextResponse.json(
      { error: "ボケの保存に失敗しました。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Gemini のボケを投稿しました！",
    boke: {
      id: newBoke.id,
      content: newBoke.content,
      author_name: newBoke.author_name,
    },
  });
}
