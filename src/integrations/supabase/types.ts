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
      stone_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          material: string
          name: string
          origin_country: string
          origin_flag: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          material: string
          name: string
          origin_country: string
          origin_flag?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          material?: string
          name?: string
          origin_country?: string
          origin_flag?: string
        }
        Relationships: []
      }
      stone_products: {
        Row: {
          application_urls: string[]
          bookmatch_urls: string[]
          collection_id: string
          color_family: string
          cost_price_per_m2: number | null
          created_at: string
          description: string | null
          finish: string
          hero_gradient: string
          id: string
          image_url: string | null
          is_new_arrival: boolean
          list_price_per_m2: number
          name: string
          price_group: string
          sku: string
          tags: string[]
          tech_specs: Json
          thickness_mm: number
          updated_at: string
        }
        Insert: {
          application_urls?: string[]
          bookmatch_urls?: string[]
          collection_id: string
          color_family: string
          cost_price_per_m2?: number | null
          created_at?: string
          description?: string | null
          finish: string
          hero_gradient: string
          id?: string
          image_url?: string | null
          is_new_arrival?: boolean
          list_price_per_m2: number
          name: string
          price_group: string
          sku: string
          tags?: string[]
          tech_specs?: Json
          thickness_mm: number
          updated_at?: string
        }
        Update: {
          application_urls?: string[]
          bookmatch_urls?: string[]
          collection_id?: string
          color_family?: string
          cost_price_per_m2?: number | null
          created_at?: string
          description?: string | null
          finish?: string
          hero_gradient?: string
          id?: string
          image_url?: string | null
          is_new_arrival?: boolean
          list_price_per_m2?: number
          name?: string
          price_group?: string
          sku?: string
          tags?: string[]
          tech_specs?: Json
          thickness_mm?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "stone_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_slabs: {
        Row: {
          area_m2: number | null
          bin_location: string | null
          created_at: string
          id: string
          length_cm: number
          product_id: string
          received_at: string
          reserved_for: string | null
          reserved_until: string | null
          slab_number: string
          status: Database["public"]["Enums"]["slab_status"]
          updated_at: string
          warehouse_id: string
          width_cm: number
        }
        Insert: {
          area_m2?: number | null
          bin_location?: string | null
          created_at?: string
          id?: string
          length_cm: number
          product_id: string
          received_at?: string
          reserved_for?: string | null
          reserved_until?: string | null
          slab_number: string
          status?: Database["public"]["Enums"]["slab_status"]
          updated_at?: string
          warehouse_id: string
          width_cm: number
        }
        Update: {
          area_m2?: number | null
          bin_location?: string | null
          created_at?: string
          id?: string
          length_cm?: number
          product_id?: string
          received_at?: string
          reserved_for?: string | null
          reserved_until?: string | null
          slab_number?: string
          status?: Database["public"]["Enums"]["slab_status"]
          updated_at?: string
          warehouse_id?: string
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "stone_slabs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stone_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stone_slabs_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "stone_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_warehouses: {
        Row: {
          city: string
          code: string
          country: string
          country_flag: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          city: string
          code: string
          country: string
          country_flag?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          city?: string
          code?: string
          country?: string
          country_flag?: string
          created_at?: string
          id?: string
          name?: string
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
      slab_status: "available" | "reserved" | "sold" | "damaged" | "incoming"
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
    Enums: {
      slab_status: ["available", "reserved", "sold", "damaged", "incoming"],
    },
  },
} as const
