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
      auth_audit_logs: {
        Row: {
          created_at: string
          detail: string | null
          email: string | null
          event: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          email?: string | null
          event: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          email?: string | null
          event?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      erp_accounts: {
        Row: {
          category: string
          code: string
          company_id: string
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          company_id: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_audit_events: {
        Row: {
          action: string
          company_id: string
          created_at: string
          detail: Json
          id: string
          record_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          detail?: Json
          id?: string
          record_id?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          detail?: Json
          id?: string
          record_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_audit_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_companies: {
        Row: {
          address: string | null
          bank_details: string | null
          base_currency: string
          country: string
          created_at: string
          email: string | null
          id: string
          kra_pin: string | null
          mpesa_details: string | null
          name: string
          phone: string | null
          warehouse_id: string | null
        }
        Insert: {
          address?: string | null
          bank_details?: string | null
          base_currency?: string
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          kra_pin?: string | null
          mpesa_details?: string | null
          name: string
          phone?: string | null
          warehouse_id?: string | null
        }
        Update: {
          address?: string | null
          bank_details?: string | null
          base_currency?: string
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          kra_pin?: string | null
          mpesa_details?: string | null
          name?: string
          phone?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_companies_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: true
            referencedRelation: "stone_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_document_items: {
        Row: {
          company_id: string
          description: string
          discount: number
          document_id: string
          id: string
          net_amount: number
          quantity: number
          stock_item: string | null
          tax_amount: number
          tax_code_id: string
          unit: string
          unit_price: number
        }
        Insert: {
          company_id: string
          description: string
          discount?: number
          document_id: string
          id?: string
          net_amount: number
          quantity: number
          stock_item?: string | null
          tax_amount: number
          tax_code_id: string
          unit?: string
          unit_price: number
        }
        Update: {
          company_id?: string
          description?: string
          discount?: number
          document_id?: string
          id?: string
          net_amount?: number
          quantity?: number
          stock_item?: string | null
          tax_amount?: number
          tax_code_id?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_document_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_document_items_document_id_company_id_fkey"
            columns: ["document_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_documents"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "erp_document_items_tax_code_id_company_id_fkey"
            columns: ["tax_code_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_tax_codes"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      erp_documents: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          document_date: string
          due_date: string
          exchange_rate: number
          id: string
          kind: string
          notes: string | null
          number: string
          original_document_id: string | null
          party_id: string | null
          posted_at: string | null
          status: string
          subtotal: number
          supplier_reference: string | null
          tax_amount: number
          total: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string
          currency?: string
          document_date?: string
          due_date?: string
          exchange_rate?: number
          id?: string
          kind: string
          notes?: string | null
          number: string
          original_document_id?: string | null
          party_id?: string | null
          posted_at?: string | null
          status?: string
          subtotal?: number
          supplier_reference?: string | null
          tax_amount?: number
          total?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          document_date?: string
          due_date?: string
          exchange_rate?: number
          id?: string
          kind?: string
          notes?: string | null
          number?: string
          original_document_id?: string | null
          party_id?: string | null
          posted_at?: string | null
          status?: string
          subtotal?: number
          supplier_reference?: string | null
          tax_amount?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_documents_original_document_id_fkey"
            columns: ["original_document_id"]
            isOneToOne: false
            referencedRelation: "erp_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_documents_party_id_company_id_fkey"
            columns: ["party_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_parties"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      erp_journal_lines: {
        Row: {
          account_id: string
          company_id: string
          credit: number
          debit: number
          id: string
          journal_id: string
        }
        Insert: {
          account_id: string
          company_id: string
          credit?: number
          debit?: number
          id?: string
          journal_id: string
        }
        Update: {
          account_id?: string
          company_id?: string
          credit?: number
          debit?: number
          id?: string
          journal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_journal_lines_account_id_company_id_fkey"
            columns: ["account_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_accounts"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "erp_journal_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_journal_lines_journal_id_company_id_fkey"
            columns: ["journal_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_journals"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      erp_journals: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          journal_date: string
          source_document_id: string | null
          source_payment_id: string | null
          source_stock_movement_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          journal_date: string
          source_document_id?: string | null
          source_payment_id?: string | null
          source_stock_movement_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          journal_date?: string
          source_document_id?: string | null
          source_payment_id?: string | null
          source_stock_movement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_journals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_journals_source_document_id_company_id_fkey"
            columns: ["source_document_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_documents"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "erp_journals_source_stock_movement_id_fkey"
            columns: ["source_stock_movement_id"]
            isOneToOne: true
            referencedRelation: "erp_stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_source_payment_fk"
            columns: ["source_payment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_payments"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      erp_memberships: {
        Row: {
          company_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_parties: {
        Row: {
          address: string | null
          archived: boolean
          bank_details: string | null
          city: string | null
          company_id: string
          company_name: string | null
          contact_person: string | null
          county: string | null
          created_at: string
          credit_limit: number
          currency: string
          customer_type: string | null
          email: string | null
          id: string
          kind: string
          kra_pin: string | null
          name: string
          notes: string | null
          payment_terms: number
          phone: string | null
          vat_registered: boolean
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean
          bank_details?: string | null
          city?: string | null
          company_id: string
          company_name?: string | null
          contact_person?: string | null
          county?: string | null
          created_at?: string
          credit_limit?: number
          currency?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          kind: string
          kra_pin?: string | null
          name: string
          notes?: string | null
          payment_terms?: number
          phone?: string | null
          vat_registered?: boolean
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean
          bank_details?: string | null
          city?: string | null
          company_id?: string
          company_name?: string | null
          contact_person?: string | null
          county?: string | null
          created_at?: string
          credit_limit?: number
          currency?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          kind?: string
          kra_pin?: string | null
          name?: string
          notes?: string | null
          payment_terms?: number
          phone?: string | null
          vat_registered?: boolean
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_parties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_payments: {
        Row: {
          account_id: string
          amount: number
          company_id: string
          created_at: string
          document_id: string
          id: string
          payment_date: string
          reference: string
        }
        Insert: {
          account_id: string
          amount: number
          company_id: string
          created_at?: string
          document_id: string
          id?: string
          payment_date?: string
          reference: string
        }
        Update: {
          account_id?: string
          amount?: number
          company_id?: string
          created_at?: string
          document_id?: string
          id?: string
          payment_date?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_payments_account_id_company_id_fkey"
            columns: ["account_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_accounts"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "erp_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_payments_document_id_company_id_fkey"
            columns: ["document_id", "company_id"]
            isOneToOne: false
            referencedRelation: "erp_documents"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      erp_stock_movements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          document_id: string | null
          from_bin: string | null
          id: string
          item: string
          kind: string
          movement_date: string
          quantity: number
          reason: string | null
          reference: string | null
          to_bin: string | null
          unit: string
          unit_cost: number
          value: number
          warehouse_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string
          document_id?: string | null
          from_bin?: string | null
          id?: string
          item: string
          kind: string
          movement_date?: string
          quantity: number
          reason?: string | null
          reference?: string | null
          to_bin?: string | null
          unit?: string
          unit_cost?: number
          value?: number
          warehouse_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          document_id?: string | null
          from_bin?: string | null
          id?: string
          item?: string
          kind?: string
          movement_date?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          to_bin?: string | null
          unit?: string
          unit_cost?: number
          value?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_stock_movements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "erp_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "stone_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_tax_codes: {
        Row: {
          company_id: string
          id: string
          name: string
          rate: number
          treatment: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
          rate: number
          treatment: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
          rate?: number
          treatment?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_tax_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "erp_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_usage_logs: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          latency_ms: number
          outcome: string
          tool_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          latency_ms?: number
          outcome: string
          tool_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          latency_ms?: number
          outcome?: string
          tool_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
          location_code: string | null
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
          location_code?: string | null
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
          location_code?: string | null
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
          location_code: string | null
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
          location_code?: string | null
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
          location_code?: string | null
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
          location_code: string | null
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
          location_code?: string | null
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
          location_code?: string | null
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
          location_code: string | null
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
          location_code?: string | null
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
          location_code?: string | null
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
          address: string | null
          city: string
          code: string
          company_name: string | null
          country: string
          country_flag: string
          created_at: string
          currency_code: string | null
          id: string
          name: string
          units_per_usd: number | null
        }
        Insert: {
          address?: string | null
          city: string
          code: string
          company_name?: string | null
          country: string
          country_flag?: string
          created_at?: string
          currency_code?: string | null
          id?: string
          name: string
          units_per_usd?: number | null
        }
        Update: {
          address?: string | null
          city?: string
          code?: string
          company_name?: string | null
          country?: string
          country_flag?: string
          created_at?: string
          currency_code?: string | null
          id?: string
          name?: string
          units_per_usd?: number | null
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_operating_location: {
        Args: {
          p_address: string
          p_city: string
          p_code: string
          p_company: string
          p_country: string
          p_currency: string
          p_rate: number
          p_warehouse: string
        }
        Returns: {
          address: string | null
          city: string
          code: string
          company_name: string | null
          country: string
          country_flag: string
          created_at: string
          currency_code: string | null
          id: string
          name: string
          units_per_usd: number | null
        }
        SetofOptions: {
          from: "*"
          to: "stone_warehouses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      erp_access: {
        Args: { p_company: string; p_write?: boolean }
        Returns: boolean
      }
      erp_create_document: {
        Args: {
          p_company: string
          p_currency: string
          p_date: string
          p_due: string
          p_items: Json
          p_kind: string
          p_notes: string
          p_party: string
          p_rate: number
          p_reference: string
        }
        Returns: string
      }
      erp_create_invoice: {
        Args: {
          p_company: string
          p_date: string
          p_due: string
          p_items: Json
          p_notes: string
          p_party: string
        }
        Returns: string
      }
      erp_create_purchase_order: {
        Args: {
          p_company: string
          p_date: string
          p_due: string
          p_items: Json
          p_notes: string
          p_party: string
        }
        Returns: string
      }
      erp_credit_invoice: {
        Args: { p_date: string; p_invoice: string; p_reason: string }
        Returns: string
      }
      erp_initialize: { Args: { p_company: string }; Returns: undefined }
      erp_post_document: {
        Args: { p_document: string; p_payment_account?: string }
        Returns: string
      }
      erp_post_invoice: { Args: { p_document: string }; Returns: string }
      erp_receive_purchase_order: {
        Args: {
          p_bin: string
          p_date: string
          p_po: string
          p_supplier_ref: string
        }
        Returns: string
      }
      erp_record_payment: {
        Args: {
          p_account: string
          p_amount: number
          p_date: string
          p_document: string
          p_reference: string
        }
        Returns: string
      }
      erp_record_stock_movement: {
        Args: {
          p_company: string
          p_date: string
          p_from: string
          p_item: string
          p_kind: string
          p_quantity: number
          p_reason: string
          p_reference: string
          p_to: string
          p_unit: string
          p_unit_cost: number
        }
        Returns: string
      }
      erp_save_company: {
        Args: {
          p_address: string
          p_bank: string
          p_company: string
          p_email: string
          p_mpesa: string
          p_name: string
          p_phone: string
          p_pin: string
        }
        Returns: undefined
      }
      erp_stock_balance: {
        Args: { p_company: string; p_item: string }
        Returns: Record<string, unknown>
      }
      erp_stock_post: {
        Args: {
          p_amount: number
          p_company: string
          p_credit: string
          p_date: string
          p_debit: string
          p_label: string
          p_movement: string
        }
        Returns: string
      }
      generate_project_code: { Args: never; Returns: string }
      generate_quotation_number: { Args: never; Returns: string }
      generate_shipment_reference: { Args: never; Returns: string }
      generate_work_order_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "manager"
        | "sales"
        | "production"
        | "logistics"
        | "viewer"
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
      app_role: [
        "admin",
        "staff",
        "manager",
        "sales",
        "production",
        "logistics",
        "viewer",
      ],
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
