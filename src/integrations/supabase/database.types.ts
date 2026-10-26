export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  access: {
    Tables: {
      admins: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          display_name: string;
          role: Database["access"]["Enums"]["admin_role"];
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name: string;
          role?: Database["access"]["Enums"]["admin_role"];
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          role?: Database["access"]["Enums"]["admin_role"];
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admins_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "admins_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      my_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: Database["access"]["Enums"]["permission"][];
      };
    };
    Enums: {
      admin_role: "owner" | "staff";
      permission:
        | "orders.view"
        | "orders.decide"
        | "inventory.manage"
        | "notifications.manage_own"
        | "catalog.manage"
        | "fulfillment.manage"
        | "retail.manage"
        | "themes.manage"
        | "settings.manage"
        | "admins.manage"
        | "reports.view";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  catalog: {
    Tables: {
      brands: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_primary: boolean;
          label: string | null;
          logo_file_id: string | null;
          name: string;
          slug: string;
          sort_order: number;
          tagline: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_primary?: boolean;
          label?: string | null;
          logo_file_id?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          tagline?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_primary?: boolean;
          label?: string | null;
          logo_file_id?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          tagline?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          category_id: string;
          created_at: string;
          created_by: string | null;
          product_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          created_by?: string | null;
          product_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          created_by?: string | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_default: boolean;
          is_stock_tracked: boolean;
          name: string;
          price: number;
          product_id: string;
          sku: string | null;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_default?: boolean;
          is_stock_tracked?: boolean;
          name: string;
          price: number;
          product_id: string;
          sku?: string | null;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_default?: boolean;
          is_stock_tracked?: boolean;
          name?: string;
          price?: number;
          product_id?: string;
          sku?: string | null;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          accent_color: string;
          archived_at: string | null;
          badge: string | null;
          brand_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          id: string;
          image_file_id: string | null;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          accent_color: string;
          archived_at?: string | null;
          badge?: string | null;
          brand_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: string;
          image_file_id?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          accent_color?: string;
          archived_at?: string | null;
          badge?: string | null;
          brand_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: string;
          image_file_id?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_price_history: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          id: string;
          price: number;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          price: number;
          variant_id: string;
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          price?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_price_history_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_default_variant: { Args: { p_variant_id: string }; Returns: undefined };
      set_primary_brand: { Args: { p_brand_id: string }; Returns: undefined };
      set_product_categories: {
        Args: { p_category_ids: string[]; p_product_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  fulfillment: {
    Tables: {
      delivery_hours: {
        Row: {
          closes_at: string;
          created_at: string;
          created_by: string | null;
          id: string;
          opens_at: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          closes_at: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          opens_at: string;
          weekday: number;
        };
        Update: {
          closes_at?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          opens_at?: string;
          weekday?: number;
        };
        Relationships: [];
      };
      delivery_zones: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          fee: number;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          fee: number;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          fee?: number;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      pickup_location_hours: {
        Row: {
          closes_at: string;
          created_at: string;
          created_by: string | null;
          id: string;
          opens_at: string;
          pickup_location_id: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          closes_at: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          opens_at: string;
          pickup_location_id: string;
          weekday: number;
        };
        Update: {
          closes_at?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          opens_at?: string;
          pickup_location_id?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_location_hours_pickup_location_id_fkey";
            columns: ["pickup_location_id"];
            isOneToOne: false;
            referencedRelation: "pickup_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      pickup_locations: {
        Row: {
          address: string;
          archived_at: string | null;
          city: string;
          created_at: string;
          created_by: string | null;
          id: string;
          instructions: string | null;
          map_url: string | null;
          name: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          archived_at?: string | null;
          city: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          instructions?: string | null;
          map_url?: string | null;
          name: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address?: string;
          archived_at?: string | null;
          city?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          instructions?: string | null;
          map_url?: string | null;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          created_at: string;
          delivery_lead_hours: number;
          delivery_slot_hours: number;
          id: boolean;
          is_delivery_enabled: boolean;
          is_pickup_enabled: boolean;
          timezone: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          delivery_lead_hours?: number;
          delivery_slot_hours?: number;
          id?: boolean;
          is_delivery_enabled?: boolean;
          is_pickup_enabled?: boolean;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          delivery_lead_hours?: number;
          delivery_slot_hours?: number;
          id?: boolean;
          is_delivery_enabled?: boolean;
          is_pickup_enabled?: boolean;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_delivery_hours: { Args: { p_hours: Json }; Returns: undefined };
      set_pickup_location_hours: {
        Args: { p_hours: Json; p_pickup_location_id: string };
        Returns: undefined;
      };
      time_multirange: { Args: Record<PropertyKey, never>; Returns: unknown };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  inventory: {
    Tables: {
      stock_levels: {
        Row: {
          created_at: string;
          id: string;
          is_global: boolean | null;
          pickup_location_id: string | null;
          quantity_available: number;
          updated_at: string;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_global?: never;
          pickup_location_id?: string | null;
          quantity_available?: number;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_global?: never;
          pickup_location_id?: string | null;
          quantity_available?: number;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          quantity_delta: number;
          reason: Database["inventory"]["Enums"]["movement_reason"];
          stock_level_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          quantity_delta: number;
          reason: Database["inventory"]["Enums"]["movement_reason"];
          stock_level_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          quantity_delta?: number;
          reason?: Database["inventory"]["Enums"]["movement_reason"];
          stock_level_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_level_id_fkey";
            columns: ["stock_level_id"];
            isOneToOne: false;
            referencedRelation: "stock_levels";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adjust_stock: {
        Args: {
          p_note?: string;
          p_pickup_location_id?: string;
          p_quantity: number;
          p_variant_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          is_global: boolean | null;
          pickup_location_id: string | null;
          quantity_available: number;
          updated_at: string;
          variant_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "stock_levels";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      variant_availability: {
        Args: { p_pickup_location_id?: string; p_variant_ids: string[] };
        Returns: {
          is_available: boolean;
          variant_id: string;
        }[];
      };
    };
    Enums: {
      movement_reason: "adjustment" | "restock" | "waste" | "order_reservation" | "order_release";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  media: {
    Tables: {
      files: {
        Row: {
          bucket: string;
          created_at: string;
          height: number | null;
          id: string;
          mime_type: string;
          object_path: string;
          purpose: Database["media"]["Enums"]["file_purpose"];
          sha256: string;
          size_bytes: number;
          uploaded_by: string | null;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          bucket: string;
          created_at?: string;
          height?: number | null;
          id?: string;
          mime_type: string;
          object_path: string;
          purpose: Database["media"]["Enums"]["file_purpose"];
          sha256: string;
          size_bytes: number;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Update: {
          bucket?: string;
          created_at?: string;
          height?: number | null;
          id?: string;
          mime_type?: string;
          object_path?: string;
          purpose?: Database["media"]["Enums"]["file_purpose"];
          sha256?: string;
          size_bytes?: number;
          uploaded_by?: string | null;
          width?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      file_purpose:
        "payment_proof" | "refund_proof" | "product_image" | "brand_logo" | "message_attachment";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_rate_limit: {
        Args: { max_requests: number; rate_key: string; window_seconds: number };
        Returns: boolean;
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  access: {
    Enums: {
      admin_role: ["owner", "staff"],
      permission: [
        "orders.view",
        "orders.decide",
        "inventory.manage",
        "notifications.manage_own",
        "catalog.manage",
        "fulfillment.manage",
        "retail.manage",
        "themes.manage",
        "settings.manage",
        "admins.manage",
        "reports.view",
      ],
    },
  },
  catalog: {
    Enums: {},
  },
  fulfillment: {
    Enums: {},
  },
  inventory: {
    Enums: {
      movement_reason: ["adjustment", "restock", "waste", "order_reservation", "order_release"],
    },
  },
  media: {
    Enums: {
      file_purpose: [
        "payment_proof",
        "refund_proof",
        "product_image",
        "brand_logo",
        "message_attachment",
      ],
    },
  },
  public: {
    Enums: {},
  },
} as const;
