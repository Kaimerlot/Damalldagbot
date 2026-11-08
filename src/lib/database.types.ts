export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] }

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; display_name: string | null; avatar_url: string | null; language: string; favourite_club_id: string | null; role: string; created_at: string }>
      clubs: Table<{ id: string; slug: string; city_sv: string; city_en: string; colours: Json; founded_year: number | null; stadium: string | null; description_sv: string | null; description_en: string | null; external_team_id: string | null; verified: boolean; created_at: string }>
      seasons: Table<{ id: string; year: number; champion_club_id: string | null; notes_sv: string | null; notes_en: string | null; verified: boolean }>
      matches: Table<{ id: string; season_id: string; round: number | null; kickoff_at: string; home_club_id: string; away_club_id: string; home_score: number | null; away_score: number | null; status: string; external_match_id: string | null; updated_at: string }>
      standings: Table<{ season_id: string; club_id: string; played: number; won: number; drawn: number; lost: number; goals_for: number; goals_against: number; points: number; position: number | null; updated_at: string }>
      news: Table<{ id: string; slug: string; title_sv: string; title_en: string | null; summary_sv: string | null; summary_en: string | null; body_sv: string | null; body_en: string | null; image_url: string | null; image_credit: string | null; source_url: string | null; club_id: string | null; tags: string[]; published_at: string | null; scheduled_at: string | null; author_id: string | null; created_at: string }>
      history_events: Table<{ id: string; year: number; title_sv: string; title_en: string | null; body_sv: string | null; body_en: string | null; source_url: string | null; verified: boolean }>
      players: Table<{ id: string; slug: string; name: string; nationality: string | null; position: string | null; years_active: string | null; clubs: Json; bio_sv: string | null; bio_en: string | null; image_url: string | null; image_credit: string | null; image_license: string | null; verified: boolean }>
      quiz_questions: Table<{ id: string; category: string; difficulty: string; question_sv: string; question_en: string; options_sv: Json; options_en: Json; correct_index: number; explanation_sv: string | null; explanation_en: string | null; verified: boolean; active: boolean }>
      quiz_attempts: Table<{ id: string; user_id: string; score: number; total: number; category: string | null; created_at: string }>
      products: Table<{ id: string; club_id: string; slug: string; name_sv: string; name_en: string; description_sv: string | null; description_en: string | null; category: string; price_sek: number; images: Json; active: boolean; stripe_product_id: string | null; created_at: string }>
      product_variants: Table<{ id: string; product_id: string; size: string; colour: string; stock: number; stripe_price_id: string | null }>
      orders: Table<{ id: string; user_id: string | null; stripe_session_id: string; status: string; total_sek: number; shipping_address: Json; created_at: string }>
      order_items: Table<{ id: string; order_id: string; variant_id: string; quantity: number; unit_price_sek: number }>
      quiz_sessions: Table<{ id: string; user_id: string | null; category: string | null; language: string; score: number; streak: number; question_count: number; finished_at: string | null; created_at: string }>
      quiz_session_questions: Table<{ session_id: string; question_id: string; position: number; selected_index: number | null; elapsed_ms: number | null; used_hint: boolean }>
      sync_log: Table<{ id: string; job: string; started_at: string; finished_at: string | null; rows_changed: number; error: string | null }>
      stripe_events: Table<{ id: string; event_type: string; processed_at: string }>
      checkout_reservations: Table<{ id: string; user_id: string | null; stripe_session_id: string | null; status: string; expires_at: string; created_at: string }>
      checkout_reservation_items: Table<{ reservation_id: string; variant_id: string; quantity: number; unit_price_sek: number; product_name_sv: string; product_name_en: string; size: string; colour: string }>
    }
    Views: { quiz_questions_public: { Row: { id: string; category: string; difficulty: string; question_sv: string; question_en: string; options_sv: Json; options_en: Json; explanation_sv: string | null; explanation_en: string | null }; Relationships: [] } }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      start_quiz: { Args: { p_category?: string | null; p_language?: string }; Returns: Json }
      submit_answer: { Args: { p_session_id: string; p_question_id: string; p_option_index: number; p_elapsed_ms: number; p_used_hint?: boolean }; Returns: Json }
      finish_quiz: { Args: { p_session_id: string }; Returns: Json }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}