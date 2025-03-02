export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      prompt_ratings: {
        Row: {
          id: string
          prompt_id: number
          rating: boolean
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          prompt_id: number
          rating: boolean
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          prompt_id?: number
          rating?: boolean
          created_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_ratings_prompt_id_fkey"
            columns: ["prompt_id"]
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          }
        ]
      }
      prompts: {
        Row: {
          id: number
          slug: string
          category: string
          created_at: string
          is_custom: boolean
          positive_ratings: number
          negative_ratings: number
          variables: Json
          tags: string[]
        }
        Insert: {
          id?: number
          slug: string
          category: string
          created_at?: string
          is_custom?: boolean
          positive_ratings?: number
          negative_ratings?: number
          variables?: Json
          tags?: string[]
        }
        Update: {
          id?: number
          slug?: string
          category?: string
          created_at?: string
          is_custom?: boolean
          positive_ratings?: number
          negative_ratings?: number
          variables?: Json
          tags?: string[]
        }
        Relationships: []
      }
      prompt_translations: {
        Row: {
          id: number
          prompt_id: number
          language: string
          title: string
          description: string
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          prompt_id: number
          language: string
          title: string
          description: string
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          prompt_id?: number
          language?: string
          title?: string
          description?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_translations_prompt_id_fkey"
            columns: ["prompt_id"]
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}