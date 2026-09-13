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
      afromail_messages: {
        Row: {
          body: string | null
          created_at: string
          folder: string
          from_email: string
          from_name: string | null
          has_attachment: boolean
          id: string
          preview: string | null
          read: boolean
          starred: boolean
          subject: string | null
          to_email: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          folder?: string
          from_email: string
          from_name?: string | null
          has_attachment?: boolean
          id?: string
          preview?: string | null
          read?: boolean
          starred?: boolean
          subject?: string | null
          to_email: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          folder?: string
          from_email?: string
          from_name?: string | null
          has_attachment?: boolean
          id?: string
          preview?: string | null
          read?: boolean
          starred?: boolean
          subject?: string | null
          to_email?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          access_token: string | null
          connection_type: Database["public"]["Enums"]["email_connection_type"]
          created_at: string
          display_name: string | null
          email_address: string
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          last_error: string | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          scope: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          status: Database["public"]["Enums"]["email_account_status"]
          token_expires_at: string | null
          updated_at: string
          use_ssl: boolean | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connection_type: Database["public"]["Enums"]["email_connection_type"]
          created_at?: string
          display_name?: string | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          scope?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: Database["public"]["Enums"]["email_account_status"]
          token_expires_at?: string | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connection_type?: Database["public"]["Enums"]["email_connection_type"]
          created_at?: string
          display_name?: string | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: Database["public"]["Enums"]["email_account_status"]
          token_expires_at?: string | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          account_id: string
          body_html: string | null
          body_text: string | null
          cc_emails: string[]
          created_at: string
          folder: string
          from_email: string
          from_name: string | null
          has_attachment: boolean
          id: string
          preview: string | null
          provider: string
          provider_message_id: string
          read: boolean
          received_at: string
          starred: boolean
          subject: string | null
          thread_id: string | null
          to_emails: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          folder?: string
          from_email: string
          from_name?: string | null
          has_attachment?: boolean
          id?: string
          preview?: string | null
          provider: string
          provider_message_id: string
          read?: boolean
          received_at?: string
          starred?: boolean
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[]
          created_at?: string
          folder?: string
          from_email?: string
          from_name?: string | null
          has_attachment?: boolean
          id?: string
          preview?: string | null
          provider?: string
          provider_message_id?: string
          read?: boolean
          received_at?: string
          starred?: boolean
          subject?: string | null
          thread_id?: string | null
          to_emails?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          connected_accounts: Json | null
          created_at: string
          display_name: string | null
          id: string
          notif_desktop: boolean
          notif_digest: string
          notif_email: boolean
          notif_marketing: boolean
          notif_security: boolean
          notif_sound: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          connected_accounts?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          notif_desktop?: boolean
          notif_digest?: string
          notif_email?: boolean
          notif_marketing?: boolean
          notif_security?: boolean
          notif_sound?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          connected_accounts?: Json | null
          created_at?: string
          display_name?: string | null
          id?: string
          notif_desktop?: boolean
          notif_digest?: string
          notif_email?: boolean
          notif_marketing?: boolean
          notif_security?: boolean
          notif_sound?: boolean
          updated_at?: string
          user_id?: string
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
      email_account_status: "pending" | "connected" | "error" | "disconnected"
      email_connection_type:
        | "oauth_gmail"
        | "oauth_outlook"
        | "imap"
        | "afromail"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      email_account_status: ["pending", "connected", "error", "disconnected"],
      email_connection_type: [
        "oauth_gmail",
        "oauth_outlook",
        "imap",
        "afromail",
      ],
    },
  },
} as const
