// ============================================================
// Supabase データベース型定義（supabase-js v2 互換形式）
// ============================================================

export type Database = {
  public: {
    Tables: {
      topics: {
        Row: {
          id: string;
          content: string;
          is_ai: boolean;
          ai_model: string | null;
          is_active: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          content: string;
          is_ai?: boolean;
          ai_model?: string | null;
          is_active?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          content?: string;
          is_ai?: boolean;
          ai_model?: string | null;
          is_active?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      bokes: {
        Row: {
          id: string;
          topic_id: string;
          content: string;
          author_name: string;
          is_ai: boolean;
          ai_model: string | null;
          like_count: number;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          topic_id: string;
          content: string;
          author_name?: string;
          is_ai?: boolean;
          ai_model?: string | null;
          like_count?: number;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          topic_id?: string;
          content?: string;
          author_name?: string;
          is_ai?: boolean;
          ai_model?: string | null;
          like_count?: number;
          created_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          boke_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          boke_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          boke_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          x_handle: string | null;
          display_name: string | null;
          avatar_url: string | null;
          token_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          x_handle?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          token_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          x_handle?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          token_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_public_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      toggle_like: {
        Args: {
          p_boke_id: string;
          p_user_id: string;
        };
        Returns: {
          liked: boolean;
          like_count: number;
          token_balance?: number;
        };
      };
      claim_daily_bonus: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          claimed: boolean;
          amount?: number;
        };
      };
      create_topic_with_tokens: {
        Args: {
          p_user_id: string;
          p_content: string;
        };
        Returns: {
          success: boolean;
          topic_id: string;
          token_balance: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── 便利な型エイリアス ────────────────────────────────────────
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type Boke  = Database["public"]["Tables"]["bokes"]["Row"];
export type Like  = Database["public"]["Tables"]["likes"]["Row"];
export type User  = Database["public"]["Tables"]["users"]["Row"];

/** UI で使うボケの拡張型（いいね済みフラグをクライアント側で付与） */
export type BokeWithLiked = Boke & {
  liked: boolean;
  isNew?: boolean;
  users?: { avatar_url: string | null } | null;
};
