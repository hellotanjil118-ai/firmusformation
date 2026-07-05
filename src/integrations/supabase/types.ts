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
      activity_logs: {
        Row: {
          action: string
          client_id: string | null
          created_at: string
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          client_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          anomalies: Json
          cadence: string
          cashflow_risks: Json
          created_at: string
          headline: string
          id: string
          notified_count: number
          recommendations: Json
          severity: string
          snapshot: Json
          summary: string
        }
        Insert: {
          anomalies?: Json
          cadence?: string
          cashflow_risks?: Json
          created_at?: string
          headline: string
          id?: string
          notified_count?: number
          recommendations?: Json
          severity?: string
          snapshot?: Json
          summary: string
        }
        Update: {
          anomalies?: Json
          cadence?: string
          cashflow_risks?: Json
          created_at?: string
          headline?: string
          id?: string
          notified_count?: number
          recommendations?: Json
          severity?: string
          snapshot?: Json
          summary?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          description: string | null
          head_user_id: string | null
          icon: string | null
          id: string
          monthly_target: number | null
          name: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          icon?: string | null
          id?: string
          monthly_target?: number | null
          name: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          icon?: string | null
          id?: string
          monthly_target?: number | null
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_folders: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          employee_id: string | null
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_assignment_audit: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_email: string | null
          created_at: string
          employee_id: string
          employee_name: string | null
          from_department_id: string | null
          from_department_name: string | null
          from_status: string | null
          id: string
          to_department_id: string | null
          to_department_name: string | null
          to_status: string | null
        }
        Insert: {
          action?: string
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          employee_id: string
          employee_name?: string | null
          from_department_id?: string | null
          from_department_name?: string | null
          from_status?: string | null
          id?: string
          to_department_id?: string | null
          to_department_name?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          employee_id?: string
          employee_name?: string | null
          from_department_id?: string | null
          from_department_name?: string | null
          from_status?: string | null
          id?: string
          to_department_id?: string | null
          to_department_name?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignment_audit_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assignment_audit_from_department_id_fkey"
            columns: ["from_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assignment_audit_to_department_id_fkey"
            columns: ["to_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          email: string | null
          employment_type: string
          full_name: string
          hourly_rate: number | null
          id: string
          joined_at: string | null
          monthly_salary: number | null
          notes: string | null
          phone: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          employment_type?: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          joined_at?: string | null
          monthly_salary?: number | null
          notes?: string | null
          phone?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          employment_type?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          joined_at?: string | null
          monthly_salary?: number | null
          notes?: string | null
          phone?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          currency: string
          discount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          items: Json
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_instructions: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          items?: Json
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          id: string
          kind: string
          lead_id: string
          meta: Json | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id: string
          meta?: Json | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          phone: string | null
          service: string | null
          source: string | null
          status: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          phone?: string | null
          service?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      marketing_assets: {
        Row: {
          asset_url: string | null
          campaign_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          asset_url?: string | null
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          asset_url?: string | null
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number
          channel: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          source_tag: string | null
          spend: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          source_tag?: string | null
          spend?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          source_tag?: string | null
          spend?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          duration_min: number
          id: string
          location: string | null
          meeting_type: string
          meeting_url: string | null
          notes: string | null
          organizer_id: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          location?: string | null
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          organizer_id?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          location?: string | null
          meeting_type?: string
          meeting_url?: string | null
          notes?: string | null
          organizer_id?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_documents: {
        Row: {
          client_visible: boolean
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          order_id: string
          uploaded_by: string | null
          uploader_type: string
        }
        Insert: {
          client_visible?: boolean
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          order_id: string
          uploaded_by?: string | null
          uploader_type?: string
        }
        Update: {
          client_visible?: boolean
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          order_id?: string
          uploaded_by?: string | null
          uploader_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          order_id: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          order_id: string
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          order_id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          order_id: string
          order_index: number
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          order_id: string
          order_index?: number
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_id?: string
          order_index?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_stages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          due_at: string | null
          id: string
          notes: string | null
          package_name: string
          price: number
          service_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          package_name: string
          price?: number
          service_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          package_name?: string
          price?: number
          service_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string
          cta_label: string
          description: string | null
          features: Json
          highlighted: boolean
          id: string
          name: string
          order_index: number
          period: string | null
          price: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string
          description?: string | null
          features?: Json
          highlighted?: boolean
          id?: string
          name: string
          order_index?: number
          period?: string | null
          price: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          description?: string | null
          features?: Json
          highlighted?: boolean
          id?: string
          name?: string
          order_index?: number
          period?: string | null
          price?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          due_at: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string
          features: Json
          icon: string | null
          id: string
          order_index: number
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          features?: Json
          icon?: string | null
          id?: string
          order_index?: number
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          icon?: string | null
          id?: string
          order_index?: number
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          client_id: string
          closed_at: string | null
          created_at: string
          id: string
          order_id: string | null
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          client_id: string
          closed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          client_id?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          labels: string[] | null
          order_index: number
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          labels?: string[] | null
          order_index?: number
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          labels?: string[] | null
          order_index?: number
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          content: string
          created_at: string
          id: string
          name: string
          order_index: number
          published: boolean
          rating: number
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          content: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          published?: boolean
          rating?: number
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          content?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          published?: boolean
          rating?: number
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
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
      claim_client_by_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
