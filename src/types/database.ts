export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'owner' | 'admin' | 'manager' | 'staff';
export type MemoryStatus = 'pending' | 'approved' | 'rejected';
export type ScreenStatus = 'offline' | 'online';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          branding: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Role;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organization_members']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          total_visits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_visits'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      customer_identities: {
        Row: {
          id: string;
          customer_id: string;
          identity_provider: string;
          identity_value: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_identities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['customer_identities']['Insert']>;
      };
      visits: {
        Row: {
          id: string;
          customer_id: string;
          branch_id: string;
          visited_at: string;
        };
        Insert: Omit<Database['public']['Tables']['visits']['Row'], 'id' | 'visited_at'>;
        Update: Partial<Database['public']['Tables']['visits']['Insert']>;
      };
      memories: {
        Row: {
          id: string;
          customer_id: string;
          branch_id: string;
          image_url: string;
          caption: string | null;
          status: MemoryStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Database['public']['Tables']['memories']['Insert']>;
      };
      memory_consents: {
        Row: {
          id: string;
          memory_id: string;
          agreed_to_terms: boolean;
          agreed_to_marketing: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memory_consents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['memory_consents']['Insert']>;
      };
      reward_rules: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          visits_required: number;
          reward_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reward_rules']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reward_rules']['Insert']>;
      };
      reward_events: {
        Row: {
          id: string;
          customer_id: string;
          reward_rule_id: string;
          earned_at: string;
          redeemed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['reward_events']['Row'], 'id' | 'earned_at'>;
        Update: Partial<Database['public']['Tables']['reward_events']['Insert']>;
      };
      screens: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          pairing_code: string | null;
          status: ScreenStatus;
          last_heartbeat_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['screens']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['screens']['Insert']>;
      };
      playlists: {
        Row: {
          id: string;
          screen_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['playlists']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['playlists']['Insert']>;
      };
      playlist_items: {
        Row: {
          id: string;
          playlist_id: string;
          memory_id: string;
          display_order: number;
          duration_seconds: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['playlist_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['playlist_items']['Insert']>;
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          organization_id: string;
          report_type: string;
          data: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      moderation_actions: {
        Row: {
          id: string;
          memory_id: string;
          moderator_id: string;
          action: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['moderation_actions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['moderation_actions']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan: string;
          status: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      feature_flags: {
        Row: {
          id: string;
          name: string;
          is_enabled: boolean;
          organization_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feature_flags']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['feature_flags']['Insert']>;
      };
      share_events: {
        Row: {
          id: string;
          memory_id: string;
          platform: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['share_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['share_events']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
  };
}
