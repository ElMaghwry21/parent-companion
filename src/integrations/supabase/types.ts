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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      behavior_logs: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          points: number
          reason: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          points: number
          reason: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          points?: number
          reason?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          email: string | null
          parent_id: string | null
          role: string
          updated_at: string
          user_id: string
          vault_total_balance: number | null
          vault_unlocked_balance: number | null
          vault_points_threshold: number | null
          vault_payout_amount: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          email?: string | null
          parent_id?: string | null
          role: string
          updated_at?: string
          user_id: string
          vault_total_balance?: number | null
          vault_unlocked_balance?: number | null
          vault_points_threshold?: number | null
          vault_payout_amount?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          email?: string | null
          parent_id?: string | null
          role?: string
          updated_at?: string
          user_id?: string
          vault_total_balance?: number | null
          vault_unlocked_balance?: number | null
          vault_points_threshold?: number | null
          vault_payout_amount?: number | null
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          child_id: string
          id: string
          points_spent: number
          redeemed_at: string
          reward_id: string
          status: string
        }
        Insert: {
          child_id: string
          id?: string
          points_spent: number
          redeemed_at?: string
          reward_id: string
          status?: string
        }
        Update: {
          child_id?: string
          id?: string
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
          status?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          cost: number
          created_at: string
          created_by: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          cost: number
          created_at?: string
          created_by: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          child_id: string
          earned_points: number
          hours_spent: number | null
          id: string
          proof_image_url: string | null
          status: string
          submitted_at: string
          task_id: string
        }
        Insert: {
          child_id: string
          earned_points: number
          hours_spent?: number | null
          id?: string
          proof_image_url?: string | null
          status?: string
          submitted_at?: string
          task_id: string
        }
        Update: {
          child_id?: string
          earned_points?: number
          hours_spent?: number | null
          id?: string
          proof_image_url?: string | null
          status?: string
          submitted_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_routine: boolean
          points: number
          requires_proof: boolean
          title: string
          total_hours: number | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_routine?: boolean
          points: number
          requires_proof?: boolean
          title: string
          total_hours?: number | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_routine?: boolean
          points?: number
          requires_proof?: boolean
          title?: string
          total_hours?: number | null
          type?: string
        }
        Relationships: []
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
