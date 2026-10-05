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
      admin_users: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          attempts: number
          claim_token: string | null
          claimed_at: string | null
          error: string | null
          first_attempt_at: string | null
          order_id: string
          payload: Json | null
          provider_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          claim_token?: string | null
          claimed_at?: string | null
          error?: string | null
          first_attempt_at?: string | null
          order_id: string
          payload?: Json | null
          provider_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          claim_token?: string | null
          claimed_at?: string | null
          error?: string | null
          first_attempt_at?: string | null
          order_id?: string
          payload?: Json | null
          provider_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          name: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          name: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          name?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          confirmed_at: string | null
          created_at: string
          delivery_date: string | null
          delivery_slot_end: string | null
          delivery_slot_start: string | null
          email: string
          fingerprint: string
          fulfillment_address: string
          fulfillment_label: string
          fulfillment_type: string
          id: string
          idempotency_key: string
          name: string
          phone: string
          pickup_location_id: string | null
          receipt_path: string
          status: string
          total: number
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          delivery_date?: string | null
          delivery_slot_end?: string | null
          delivery_slot_start?: string | null
          email: string
          fingerprint: string
          fulfillment_address?: string
          fulfillment_label?: string
          fulfillment_type?: string
          id?: string
          idempotency_key: string
          name: string
          phone?: string
          pickup_location_id?: string | null
          receipt_path: string
          status?: string
          total: number
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          delivery_date?: string | null
          delivery_slot_end?: string | null
          delivery_slot_start?: string | null
          email?: string
          fingerprint?: string
          fulfillment_address?: string
          fulfillment_label?: string
          fulfillment_type?: string
          id?: string
          idempotency_key?: string
          name?: string
          phone?: string
          pickup_location_id?: string | null
          receipt_path?: string
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "sales_points"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          accent: string
          active: boolean
          brand: string
          description: string
          id: string
          image: string
          name: string
          position: number
          price: number
          tag: string
        }
        Insert: {
          accent: string
          active?: boolean
          brand?: string
          description: string
          id: string
          image: string
          name: string
          position?: number
          price: number
          tag: string
        }
        Update: {
          accent?: string
          active?: boolean
          brand?: string
          description?: string
          id?: string
          image?: string
          name?: string
          position?: number
          price?: number
          tag?: string
        }
        Relationships: []
      }
      sales_points: {
        Row: {
          active: boolean
          address: string
          city: string
          hours: string
          id: string
          map_url: string
          name: string
          position: number
        }
        Insert: {
          active?: boolean
          address: string
          city: string
          hours?: string
          id?: string
          map_url?: string
          name: string
          position?: number
        }
        Update: {
          active?: boolean
          address?: string
          city?: string
          hours?: string
          id?: string
          map_url?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          delivery_lead_hours: number
          delivery_schedule: Json
          delivery_slot_hours: number
          demo_catalog: boolean
          id: number
          instagram: string
          public_email: string
          sinpe_number: string
          sinpe_recipient: string
          uber_delivery_enabled: boolean
          uber_disclaimer: string
          whatsapp: string
        }
        Insert: {
          delivery_lead_hours?: number
          delivery_schedule?: Json
          delivery_slot_hours?: number
          demo_catalog?: boolean
          id: number
          instagram?: string
          public_email?: string
          sinpe_number?: string
          sinpe_recipient?: string
          uber_delivery_enabled?: boolean
          uber_disclaimer?: string
          whatsapp?: string
        }
        Update: {
          delivery_lead_hours?: number
          delivery_schedule?: Json
          delivery_slot_hours?: number
          demo_catalog?: boolean
          id?: number
          instagram?: string
          public_email?: string
          sinpe_number?: string
          sinpe_recipient?: string
          uber_delivery_enabled?: boolean
          uber_disclaimer?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_confirmation: {
        Args: { p_order_id: string; p_retry?: boolean }
        Returns: Json
      }
      create_order: {
        Args: {
          p_delivery_address?: string
          p_delivery_date?: string
          p_delivery_slot_start?: string
          p_email: string
          p_fingerprint: string
          p_fulfillment_type: string
          p_items: Json
          p_key: string
          p_name: string
          p_phone: string
          p_pickup_location_id?: string
          p_receipt_path: string
        }
        Returns: Json
      }
      finish_email: {
        Args: {
          p_error?: string
          p_order_id: string
          p_provider_id?: string
          p_status: string
          p_token: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      list_orders: { Args: never; Returns: Json }
      order_snapshot: { Args: { p_order_id: string }; Returns: Json }
      prepare_email: {
        Args: { p_order_id: string; p_payload: Json; p_token: string }
        Returns: Json
      }
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
    Enums: {},
  },
} as const
