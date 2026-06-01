// Minimal Supabase DB types. Regenerate with: npx supabase gen types typescript --project-id <id>
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type TableDef = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
}

export interface Database {
  public: {
    Tables: {
      users: TableDef
      businesses: TableDef
      categories: TableDef
      reviews: TableDef
      [key: string]: TableDef
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
