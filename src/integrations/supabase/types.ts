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
      espacios: {
        Row: {
          codigo: string
          disponible: boolean
          id: number
          tipo_vehiculo_id: number
        }
        Insert: {
          codigo: string
          disponible?: boolean
          id?: number
          tipo_vehiculo_id: number
        }
        Update: {
          codigo?: string
          disponible?: boolean
          id?: number
          tipo_vehiculo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "espacios_tipo_vehiculo_id_fkey"
            columns: ["tipo_vehiculo_id"]
            isOneToOne: false
            referencedRelation: "tipos_vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      registros: {
        Row: {
          created_at: string
          descuento: number | null
          espacio_id: number
          estado: Database["public"]["Enums"]["estado_registro"]
          fecha_hora_entrada: string
          fecha_hora_salida: string | null
          id: number
          minutos_totales: number | null
          placa: string
          tarifa_id: number | null
          tipo_vehiculo_id: number
          usuario_entrada_id: string
          usuario_salida_id: string | null
          valor_calculado: number | null
        }
        Insert: {
          created_at?: string
          descuento?: number | null
          espacio_id: number
          estado?: Database["public"]["Enums"]["estado_registro"]
          fecha_hora_entrada?: string
          fecha_hora_salida?: string | null
          id?: number
          minutos_totales?: number | null
          placa: string
          tarifa_id?: number | null
          tipo_vehiculo_id: number
          usuario_entrada_id: string
          usuario_salida_id?: string | null
          valor_calculado?: number | null
        }
        Update: {
          created_at?: string
          descuento?: number | null
          espacio_id?: number
          estado?: Database["public"]["Enums"]["estado_registro"]
          fecha_hora_entrada?: string
          fecha_hora_salida?: string | null
          id?: number
          minutos_totales?: number | null
          placa?: string
          tarifa_id?: number | null
          tipo_vehiculo_id?: number
          usuario_entrada_id?: string
          usuario_salida_id?: string | null
          valor_calculado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_tarifa_id_fkey"
            columns: ["tarifa_id"]
            isOneToOne: false
            referencedRelation: "tarifas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_tipo_vehiculo_id_fkey"
            columns: ["tipo_vehiculo_id"]
            isOneToOne: false
            referencedRelation: "tipos_vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifas: {
        Row: {
          activo: boolean
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          nombre: string
          tipo_cobro: Database["public"]["Enums"]["tipo_cobro"]
          tipo_vehiculo_id: number
          valor: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre: string
          tipo_cobro: Database["public"]["Enums"]["tipo_cobro"]
          tipo_vehiculo_id: number
          valor: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          nombre?: string
          tipo_cobro?: Database["public"]["Enums"]["tipo_cobro"]
          tipo_vehiculo_id?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_tipo_vehiculo_id_fkey"
            columns: ["tipo_vehiculo_id"]
            isOneToOne: false
            referencedRelation: "tipos_vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          codigo_ticket: string
          email_cliente: string | null
          enviado_email: boolean
          fecha_emision: string
          id: number
          registro_id: number
        }
        Insert: {
          codigo_ticket: string
          email_cliente?: string | null
          enviado_email?: boolean
          fecha_emision?: string
          id?: number
          registro_id: number
        }
        Update: {
          codigo_ticket?: string
          email_cliente?: string | null
          enviado_email?: boolean
          fecha_emision?: string
          id?: number
          registro_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: false
            referencedRelation: "registros"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_vehiculo: {
        Row: {
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          id?: number
          nombre: string
        }
        Update: {
          descripcion?: string | null
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operario"
      estado_registro: "EN_CURSO" | "FINALIZADO"
      tipo_cobro: "POR_MINUTO" | "POR_HORA" | "POR_DIA" | "FRACCION"
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
      app_role: ["admin", "operario"],
      estado_registro: ["EN_CURSO", "FINALIZADO"],
      tipo_cobro: ["POR_MINUTO", "POR_HORA", "POR_DIA", "FRACCION"],
    },
  },
} as const
