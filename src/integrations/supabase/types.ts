export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      action_completions: {
        Row: {
          action_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      field_blocks: {
        Row: {
          area_ha: number
          created_at: string
          crop: string | null
          disease_risk: number
          health: number
          id: string
          last_scan_date: string | null
          latitude: number | null
          longitude: number | null
          moisture: number
          name: string
          organic_carbon: number
          soil_k: number
          soil_n: number
          soil_p: number
          soil_ph: number
          soil_type: string
          sowing_date: string | null
          user_id: string
        }
        Insert: {
          area_ha?: number
          created_at?: string
          crop?: string | null
          disease_risk?: number
          health?: number
          id?: string
          last_scan_date?: string | null
          latitude?: number | null
          longitude?: number | null
          moisture?: number
          name: string
          organic_carbon?: number
          soil_k?: number
          soil_n?: number
          soil_p?: number
          soil_ph?: number
          soil_type?: string
          sowing_date?: string | null
          user_id: string
        }
        Update: {
          area_ha?: number
          created_at?: string
          crop?: string | null
          disease_risk?: number
          health?: number
          id?: string
          last_scan_date?: string | null
          latitude?: number | null
          longitude?: number | null
          moisture?: number
          name?: string
          organic_carbon?: number
          soil_k?: number
          soil_n?: number
          soil_p?: number
          soil_ph?: number
          soil_type?: string
          sowing_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area_unit: string
          created_at: string
          district: string | null
          farm_name: string | null
          farm_size: number | null
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          onboarded: boolean
          state: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          area_unit?: string
          created_at?: string
          district?: string | null
          farm_name?: string | null
          farm_size?: number | null
          full_name?: string
          id: string
          latitude?: number | null
          longitude?: number | null
          onboarded?: boolean
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          area_unit?: string
          created_at?: string
          district?: string | null
          farm_name?: string | null
          farm_size?: number | null
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          onboarded?: boolean
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          block_id: string | null
          created_at: string
          detail: string | null
          done: boolean
          due_date: string | null
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          detail?: string | null
          done?: boolean
          due_date?: string | null
          id?: string
          kind?: string
          title: string
          user_id: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          detail?: string | null
          done?: boolean
          due_date?: string | null
          id?: string
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "field_blocks"
            referencedColumns: ["id"]
          },
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
