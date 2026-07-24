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
      stone_production_events: {
        Row: {
          actor: string | null
          created_at: string
          event_type: string
          from_stage: string | null
          id: string
          message: string | null
          to_stage: string | null
          work_order_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          event_type: string
          from_stage?: string | null
          id?: string
          message?: string | null
          to_stage?: string | null
          work_order_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          event_type?: string
          from_stage?: string | null
          id?: string
          message?: string | null
          to_stage?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_production_events_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "stone_work_orders"
            referencedColumns: ["id"]
          },
        ]
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
      stone_projects: {
        Row: {
          code: string
          contract_value: number
          created_at: string
          currency: string
          customer_country: string | null
          customer_name: string | null
          id: string
          name: string
          notes: string | null
          po_number: string | null
          priority: string
          quotation_id: string | null
          start_date: string | null
          status: string
          target_delivery_date: string | null
          updated_at: string
        }
        Insert: {
          code: string
          contract_value?: number
          created_at?: string
          currency?: string
          customer_country?: string | null
          customer_name?: string | null
          id?: string
          name: string
          notes?: string | null
          po_number?: string | null
          priority?: string
          quotation_id?: string | null
          start_date?: string | null
          status?: string
          target_delivery_date?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          contract_value?: number
          created_at?: string
          currency?: string
          customer_country?: string | null
          customer_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          po_number?: string | null
          priority?: string
          quotation_id?: string | null
          start_date?: string | null
          status?: string
          target_delivery_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_projects_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "stone_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_quotation_events: {
        Row: {
          actor: string
          created_at: string
          id: string
          message: string
          quotation_id: string
          type: string
        }
        Insert: {
          actor?: string
          created_at?: string
          id?: string
          message: string
          quotation_id: string
          type: string
        }
        Update: {
          actor?: string
          created_at?: string
          id?: string
          message?: string
          quotation_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_quotation_events_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "stone_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_quotation_items: {
        Row: {
          created_at: string
          description: string
          finish: string | null
          id: string
          line_total: number
          position: number
          product_id: string | null
          quantity: number
          quotation_id: string
          sku: string | null
          slab_ids: string[]
          thickness_mm: number | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          finish?: string | null
          id?: string
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          quotation_id: string
          sku?: string | null
          slab_ids?: string[]
          thickness_mm?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          finish?: string | null
          id?: string
          line_total?: number
          position?: number
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          sku?: string | null
          slab_ids?: string[]
          thickness_mm?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stone_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stone_quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "stone_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_quotations: {
        Row: {
          created_at: string
          currency: string
          customer_company: string | null
          customer_country: string | null
          customer_email: string | null
          customer_flag: string
          customer_name: string
          decided_at: string | null
          id: string
          incoterm: string
          notes: string | null
          number: string
          owner_name: string
          project_name: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_company?: string | null
          customer_country?: string | null
          customer_email?: string | null
          customer_flag?: string
          customer_name: string
          decided_at?: string | null
          id?: string
          incoterm?: string
          notes?: string | null
          number?: string
          owner_name?: string
          project_name?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_company?: string | null
          customer_country?: string | null
          customer_email?: string | null
          customer_flag?: string
          customer_name?: string
          decided_at?: string | null
          id?: string
          incoterm?: string
          notes?: string | null
          number?: string
          owner_name?: string
          project_name?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      stone_shipment_events: {
        Row: {
          actor: string | null
          created_at: string
          event_type: string
          id: string
          location: string | null
          message: string | null
          occurred_at: string
          shipment_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          message?: string | null
          occurred_at?: string
          shipment_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          message?: string | null
          occurred_at?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "stone_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_shipment_items: {
        Row: {
          created_at: string
          description: string
          id: string
          project_id: string | null
          quantity: number
          quotation_id: string | null
          shipment_id: string
          unit: string
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          project_id?: string | null
          quantity?: number
          quotation_id?: string | null
          shipment_id: string
          unit?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          project_id?: string | null
          quantity?: number
          quotation_id?: string | null
          shipment_id?: string
          unit?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stone_shipment_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "stone_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stone_shipment_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "stone_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stone_shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "stone_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      stone_shipments: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          bill_of_lading: string | null
          carrier: string | null
          container_number: string | null
          container_type: string | null
          created_at: string
          currency: string
          destination_country: string | null
          destination_port: string | null
          eta: string | null
          etd: string | null
          freight_cost: number | null
          id: string
          incoterm: string | null
          mode: string
          notes: string | null
          origin_country: string | null
          origin_port: string | null
          reference: string
          status: string
          updated_at: string
          volume_m3: number | null
          weight_kg: number | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          bill_of_lading?: string | null
          carrier?: string | null
          container_number?: string | null
          container_type?: string | null
          created_at?: string
          currency?: string
          destination_country?: string | null
          destination_port?: string | null
          eta?: string | null
          etd?: string | null
          freight_cost?: number | null
          id?: string
          incoterm?: string | null
          mode?: string
          notes?: string | null
          origin_country?: string | null
          origin_port?: string | null
          reference: string
          status?: string
          updated_at?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          bill_of_lading?: string | null
          carrier?: string | null
          container_number?: string | null
          container_type?: string | null
          created_at?: string
          currency?: string
          destination_country?: string | null
          destination_port?: string | null
          eta?: string | null
          etd?: string | null
          freight_cost?: number | null
          id?: string
          incoterm?: string | null
          mode?: string
          notes?: string | null
          origin_country?: string | null
          origin_port?: string | null
          reference?: string
          status?: string
          updated_at?: string
          volume_m3?: number | null
          weight_kg?: number | null
        }
        Relationships: []
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
      stone_work_orders: {
        Row: {
          assigned_to: string | null
          code: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          product_id: string | null
          project_id: string
          quantity: number
          slab_id: string | null
          stage: string
          started_at: string | null
          status: string
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          code: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          project_id: string
          quantity?: number
          slab_id?: string | null
          stage?: string
          started_at?: string | null
          status?: string
          title: string
          unit?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          project_id?: string
          quantity?: number
          slab_id?: string | null
          stage?: string
          started_at?: string | null
          status?: string
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stone_work_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stone_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stone_work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "stone_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stone_work_orders_slab_id_fkey"
            columns: ["slab_id"]
            isOneToOne: false
            referencedRelation: "stone_slabs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_project_code: { Args: never; Returns: string }
      generate_quotation_number: { Args: never; Returns: string }
      generate_shipment_reference: { Args: never; Returns: string }
      generate_work_order_code: { Args: never; Returns: string }
    }
    Enums: {
      quotation_status:
        | "draft"
        | "in_review"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
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
      quotation_status: [
        "draft",
        "in_review",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ],
      slab_status: ["available", "reserved", "sold", "damaged", "incoming"],
    },
  },
} as const
