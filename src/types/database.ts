// AUTO-GENERATED from supabase/migrations/*.sql by `pnpm db:types`.
// Regenerate after changing a migration; do not hand-edit this file.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          organization_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          organization_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          organization_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'audit_logs_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          timezone: string;
          status: Database['public']['Enums']['branch_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
          status?: Database['public']['Enums']['branch_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
          status?: Database['public']['Enums']['branch_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'branches_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          status: Database['public']['Enums']['campaign_status'];
          starts_at: string | null;
          ends_at: string | null;
          config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          status?: Database['public']['Enums']['campaign_status'];
          starts_at?: string | null;
          ends_at?: string | null;
          config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          status?: Database['public']['Enums']['campaign_status'];
          starts_at?: string | null;
          ends_at?: string | null;
          config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'campaigns_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      customer_accounts: {
        Row: {
          customer_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'customer_accounts_customer_id_fkey'; columns: ['customer_id']; isOneToOne: true; referencedRelation: 'customers'; referencedColumns: ['id'] },
        ];
      };
      customer_checkins: {
        Row: {
          customer_id: string;
          organization_id: string;
          branch_id: string;
          checked_in_at: string;
        };
        Insert: {
          customer_id: string;
          organization_id: string;
          branch_id: string;
          checked_in_at?: string;
        };
        Update: {
          customer_id?: string;
          organization_id?: string;
          branch_id?: string;
          checked_in_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'customer_checkins_branch_id_organization_id_fkey'; columns: ['branch_id', 'organization_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id', 'organization_id'] },
          { foreignKeyName: 'customer_checkins_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'customer_checkins_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      customer_identities: {
        Row: {
          id: string;
          customer_id: string;
          provider: Database['public']['Enums']['provider_type'];
          provider_subject: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          provider: Database['public']['Enums']['provider_type'];
          provider_subject: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          provider?: Database['public']['Enums']['provider_type'];
          provider_subject?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'customer_identities_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
        ];
      };
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          anonymous_id: string | null;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          last_seen_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          anonymous_id?: string | null;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          last_seen_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          anonymous_id?: string | null;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          last_seen_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'customers_auth_user_id_fkey'; columns: ['auth_user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      feature_flags: {
        Row: {
          id: string;
          organization_id: string | null;
          key: string;
          value: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          key: string;
          value: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          key?: string;
          value?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'feature_flags_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      keepsake_cards: {
        Row: {
          id: string;
          customer_id: string;
          organization_id: string;
          reward_rule_id: string | null;
          reward_name: string;
          sequence_number: number;
          threshold: number;
          visit_ids: string[];
          unlocked_at: string;
          redeemed_at: string | null;
          redemption_event_id: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          organization_id: string;
          reward_rule_id?: string | null;
          reward_name: string;
          sequence_number: number;
          threshold: number;
          visit_ids: string[];
          unlocked_at?: string;
          redeemed_at?: string | null;
          redemption_event_id?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          organization_id?: string;
          reward_rule_id?: string | null;
          reward_name?: string;
          sequence_number?: number;
          threshold?: number;
          visit_ids?: string[];
          unlocked_at?: string;
          redeemed_at?: string | null;
          redemption_event_id?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'keepsake_cards_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'keepsake_cards_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'keepsake_cards_redemption_event_id_fkey'; columns: ['redemption_event_id']; isOneToOne: true; referencedRelation: 'reward_events'; referencedColumns: ['id'] },
          { foreignKeyName: 'keepsake_cards_reward_rule_id_fkey'; columns: ['reward_rule_id']; isOneToOne: false; referencedRelation: 'reward_rules'; referencedColumns: ['id'] },
        ];
      };
      memories: {
        Row: {
          id: string;
          customer_id: string;
          organization_id: string;
          branch_id: string;
          visit_id: string;
          original_url: string;
          optimized_url: string | null;
          thumbnail_url: string | null;
          caption: string | null;
          status: Database['public']['Enums']['memory_status'];
          visibility: Database['public']['Enums']['memory_visibility'];
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          organization_id: string;
          branch_id: string;
          visit_id: string;
          original_url: string;
          optimized_url?: string | null;
          thumbnail_url?: string | null;
          caption?: string | null;
          status?: Database['public']['Enums']['memory_status'];
          visibility?: Database['public']['Enums']['memory_visibility'];
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          organization_id?: string;
          branch_id?: string;
          visit_id?: string;
          original_url?: string;
          optimized_url?: string | null;
          thumbnail_url?: string | null;
          caption?: string | null;
          status?: Database['public']['Enums']['memory_status'];
          visibility?: Database['public']['Enums']['memory_visibility'];
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'memories_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'memories_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'memories_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'memories_visit_id_fkey'; columns: ['visit_id']; isOneToOne: false; referencedRelation: 'visits'; referencedColumns: ['id'] },
          { foreignKeyName: 'memories_visit_identity_fk'; columns: ['visit_id', 'customer_id', 'organization_id', 'branch_id']; isOneToOne: false; referencedRelation: 'visits'; referencedColumns: ['id', 'customer_id', 'organization_id', 'branch_id'] },
        ];
      };
      memory_consents: {
        Row: {
          id: string;
          memory_id: string;
          customer_id: string;
          save_consent: boolean;
          social_share_consent: boolean;
          live_wall_consent: boolean;
          marketing_consent: boolean;
          consent_version: number;
          consented_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          memory_id: string;
          customer_id: string;
          save_consent?: boolean;
          social_share_consent?: boolean;
          live_wall_consent?: boolean;
          marketing_consent?: boolean;
          consent_version?: number;
          consented_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          memory_id?: string;
          customer_id?: string;
          save_consent?: boolean;
          social_share_consent?: boolean;
          live_wall_consent?: boolean;
          marketing_consent?: boolean;
          consent_version?: number;
          consented_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'consents_memory_customer_fk'; columns: ['memory_id', 'customer_id']; isOneToOne: false; referencedRelation: 'memories'; referencedColumns: ['id', 'customer_id'] },
          { foreignKeyName: 'memory_consents_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'memory_consents_memory_id_fkey'; columns: ['memory_id']; isOneToOne: true; referencedRelation: 'memories'; referencedColumns: ['id'] },
        ];
      };
      moderation_actions: {
        Row: {
          id: string;
          actor_id: string;
          actor_type: Database['public']['Enums']['actor_type'];
          entity_type: Database['public']['Enums']['moderation_entity_type'];
          entity_id: string;
          action: Database['public']['Enums']['moderation_action'];
          reason: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          actor_type: Database['public']['Enums']['actor_type'];
          entity_type: Database['public']['Enums']['moderation_entity_type'];
          entity_id: string;
          action: Database['public']['Enums']['moderation_action'];
          reason?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          actor_type?: Database['public']['Enums']['actor_type'];
          entity_type?: Database['public']['Enums']['moderation_entity_type'];
          entity_id?: string;
          action?: Database['public']['Enums']['moderation_action'];
          reason?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
        ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string | null;
          customer_id: string | null;
          type: string;
          title: string;
          body: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          customer_id?: string | null;
          type: string;
          title: string;
          body: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          customer_id?: string | null;
          type?: string;
          title?: string;
          body?: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'notifications_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'notifications_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['org_member_role'];
          branch_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: Database['public']['Enums']['org_member_role'];
          branch_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['org_member_role'];
          branch_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'members_branch_org_fk'; columns: ['branch_id', 'organization_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id', 'organization_id'] },
          { foreignKeyName: 'organization_members_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'organization_members_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'organization_members_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          cover_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          timezone: string;
          country: string;
          currency: string;
          status: Database['public']['Enums']['org_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          cover_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          timezone?: string;
          country: string;
          currency?: string;
          status?: Database['public']['Enums']['org_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          cover_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          timezone?: string;
          country?: string;
          currency?: string;
          status?: Database['public']['Enums']['org_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
        ];
      };
      playlist_items: {
        Row: {
          id: string;
          playlist_id: string;
          type: Database['public']['Enums']['playlist_item_type'];
          content_id: string | null;
          content_data: Json | null;
          duration_seconds: number;
          priority: number;
          is_enabled: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          type: Database['public']['Enums']['playlist_item_type'];
          content_id?: string | null;
          content_data?: Json | null;
          duration_seconds?: number;
          priority?: number;
          is_enabled?: boolean;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          type?: Database['public']['Enums']['playlist_item_type'];
          content_id?: string | null;
          content_data?: Json | null;
          duration_seconds?: number;
          priority?: number;
          is_enabled?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'playlist_items_playlist_id_fkey'; columns: ['playlist_id']; isOneToOne: false; referencedRelation: 'playlists'; referencedColumns: ['id'] },
        ];
      };
      playlists: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string | null;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'playlists_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'playlists_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      qr_codes: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          slug: string;
          source: Database['public']['Enums']['qr_source'];
          label: string | null;
          is_active: boolean;
          scan_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          slug: string;
          source: Database['public']['Enums']['qr_source'];
          label?: string | null;
          is_active?: boolean;
          scan_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string;
          slug?: string;
          source?: Database['public']['Enums']['qr_source'];
          label?: string | null;
          is_active?: boolean;
          scan_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'qr_branch_org_fk'; columns: ['branch_id', 'organization_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id', 'organization_id'] },
          { foreignKeyName: 'qr_codes_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'qr_codes_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_type: Database['public']['Enums']['reporter_type'];
          reporter_id: string;
          entity_type: Database['public']['Enums']['report_entity_type'];
          entity_id: string;
          reason: string;
          description: string | null;
          status: Database['public']['Enums']['report_status'];
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          reporter_type: Database['public']['Enums']['reporter_type'];
          reporter_id: string;
          entity_type: Database['public']['Enums']['report_entity_type'];
          entity_id: string;
          reason: string;
          description?: string | null;
          status?: Database['public']['Enums']['report_status'];
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          reporter_type?: Database['public']['Enums']['reporter_type'];
          reporter_id?: string;
          entity_type?: Database['public']['Enums']['report_entity_type'];
          entity_id?: string;
          reason?: string;
          description?: string | null;
          status?: Database['public']['Enums']['report_status'];
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
        ];
      };
      reward_events: {
        Row: {
          id: string;
          customer_id: string;
          organization_id: string;
          branch_id: string | null;
          type: Database['public']['Enums']['reward_event_type'];
          value: number;
          reference_type: string | null;
          reference_id: string | null;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          organization_id: string;
          branch_id?: string | null;
          type: Database['public']['Enums']['reward_event_type'];
          value: number;
          reference_type?: string | null;
          reference_id?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          organization_id?: string;
          branch_id?: string | null;
          type?: Database['public']['Enums']['reward_event_type'];
          value?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'reward_events_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'reward_events_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'reward_events_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      reward_rules: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          trigger_type: Database['public']['Enums']['trigger_type'];
          threshold: number;
          reward_type: Database['public']['Enums']['reward_type'];
          reward_value: string | null;
          reward_description: string | null;
          is_active: boolean;
          starts_at: string;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          trigger_type: Database['public']['Enums']['trigger_type'];
          threshold: number;
          reward_type: Database['public']['Enums']['reward_type'];
          reward_value?: string | null;
          reward_description?: string | null;
          is_active?: boolean;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          trigger_type?: Database['public']['Enums']['trigger_type'];
          threshold?: number;
          reward_type?: Database['public']['Enums']['reward_type'];
          reward_value?: string | null;
          reward_description?: string | null;
          is_active?: boolean;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'reward_rules_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      screen_pairing_attempts: {
        Row: {
          ip_hash: string;
          attempts: number;
          reset_at: string;
        };
        Insert: {
          ip_hash: string;
          attempts?: number;
          reset_at?: string;
        };
        Update: {
          ip_hash?: string;
          attempts?: number;
          reset_at?: string;
        };
        Relationships: [
        ];
      };
      screen_pairing_codes: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          code: string;
          screen_name: string | null;
          expires_at: string;
          is_used: boolean;
          attempts: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          code: string;
          screen_name?: string | null;
          expires_at: string;
          is_used?: boolean;
          attempts?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string;
          code?: string;
          screen_name?: string | null;
          expires_at?: string;
          is_used?: boolean;
          attempts?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'pairing_branch_org_fk'; columns: ['branch_id', 'organization_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id', 'organization_id'] },
          { foreignKeyName: 'screen_pairing_codes_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'screen_pairing_codes_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      screens: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string;
          name: string;
          pairing_code: string | null;
          device_token: string | null;
          status: Database['public']['Enums']['screen_status'];
          last_heartbeat_at: string | null;
          orientation: Database['public']['Enums']['screen_orientation'];
          resolution: string | null;
          playlist_id: string | null;
          created_at: string;
          updated_at: string;
          paired_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id: string;
          name: string;
          pairing_code?: string | null;
          device_token?: string | null;
          status?: Database['public']['Enums']['screen_status'];
          last_heartbeat_at?: string | null;
          orientation?: Database['public']['Enums']['screen_orientation'];
          resolution?: string | null;
          playlist_id?: string | null;
          created_at?: string;
          updated_at?: string;
          paired_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string;
          name?: string;
          pairing_code?: string | null;
          device_token?: string | null;
          status?: Database['public']['Enums']['screen_status'];
          last_heartbeat_at?: string | null;
          orientation?: Database['public']['Enums']['screen_orientation'];
          resolution?: string | null;
          playlist_id?: string | null;
          created_at?: string;
          updated_at?: string;
          paired_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'screens_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'screens_branch_org_fk'; columns: ['branch_id', 'organization_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id', 'organization_id'] },
          { foreignKeyName: 'screens_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'screens_playlist_id_fkey'; columns: ['playlist_id']; isOneToOne: false; referencedRelation: 'playlists'; referencedColumns: ['id'] },
        ];
      };
      share_events: {
        Row: {
          id: string;
          memory_id: string;
          customer_id: string;
          platform: Database['public']['Enums']['platform_type'];
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          customer_id: string;
          platform: Database['public']['Enums']['platform_type'];
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          customer_id?: string;
          platform?: Database['public']['Enums']['platform_type'];
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'share_events_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'share_events_memory_id_fkey'; columns: ['memory_id']; isOneToOne: false; referencedRelation: 'memories'; referencedColumns: ['id'] },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['subscription_status'];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan?: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['subscription_status'];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan?: Database['public']['Enums']['subscription_plan'];
          status?: Database['public']['Enums']['subscription_status'];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'subscriptions_organization_id_fkey'; columns: ['organization_id']; isOneToOne: true; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
      };
      users: {
        Row: {
          id: string;
          auth_provider: string | null;
          provider_user_id: string | null;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          role: Database['public']['Enums']['user_role'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          auth_provider?: string | null;
          provider_user_id?: string | null;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_provider?: string | null;
          provider_user_id?: string | null;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'users_id_fkey'; columns: ['id']; isOneToOne: true; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      visits: {
        Row: {
          id: string;
          customer_id: string;
          organization_id: string;
          branch_id: string;
          qr_code_id: string | null;
          campaign_id: string | null;
          source: Database['public']['Enums']['qr_source'] | null;
          verification_status: Database['public']['Enums']['verification_status'];
          device_fingerprint: string | null;
          ip_hash: string | null;
          created_at: string;
          idempotency_key: string | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          organization_id: string;
          branch_id: string;
          qr_code_id?: string | null;
          campaign_id?: string | null;
          source?: Database['public']['Enums']['qr_source'] | null;
          verification_status?: Database['public']['Enums']['verification_status'];
          device_fingerprint?: string | null;
          ip_hash?: string | null;
          created_at?: string;
          idempotency_key?: string | null;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          organization_id?: string;
          branch_id?: string;
          qr_code_id?: string | null;
          campaign_id?: string | null;
          source?: Database['public']['Enums']['qr_source'] | null;
          verification_status?: Database['public']['Enums']['verification_status'];
          device_fingerprint?: string | null;
          ip_hash?: string | null;
          created_at?: string;
          idempotency_key?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'visits_branch_id_fkey'; columns: ['branch_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_branch_org_fk'; columns: ['branch_id', 'organization_id']; isOneToOne: false; referencedRelation: 'branches'; referencedColumns: ['id', 'organization_id'] },
          { foreignKeyName: 'visits_campaign_id_fkey'; columns: ['campaign_id']; isOneToOne: false; referencedRelation: 'campaigns'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_qr_code_id_fkey'; columns: ['qr_code_id']; isOneToOne: false; referencedRelation: 'qr_codes'; referencedColumns: ['id'] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      attach_verified_visit_memory: { Args: { p_customer_id: string | null; p_visit_id: string | null; p_original_key: string | null; p_optimized_key: string | null; p_thumbnail_key: string | null; p_caption: string | null; p_live_wall_consent: boolean | null }; Returns: string };
      can_access_branch: { Args: { p_org: string | null; p_branch: string | null }; Returns: boolean };
      can_moderate_branch: { Args: { p_org: string | null; p_branch: string | null }; Returns: boolean };
      can_view_customer: { Args: { p_customer: string | null; p_auth_user: string | null }; Returns: boolean };
      check_in_customer: { Args: { p_branch_id: string | null }; Returns: undefined };
      configure_visit_reward: { Args: { p_organization_id: string | null; p_name: string | null; p_threshold: number | null }; Returns: string };
      consume_screen_pairing: { Args: { p_code: string | null; p_token_hash: string | null; p_ip_hash: string | null }; Returns: string };
      create_customer_memory: { Args: { p_customer_id: string | null; p_branch_id: string | null; p_original_key: string | null; p_optimized_key: string | null; p_thumbnail_key: string | null; p_caption: string | null; p_live_wall_consent: boolean | null }; Returns: string };
      customer_has_saved_data: { Args: Record<string, never>; Returns: boolean };
      ensure_keepsake_cards: { Args: { p_customer_id: string | null; p_organization_id: string | null }; Returns: undefined };
      get_keepsake_balance: { Args: { p_customer_id: string | null; p_organization_id: string | null }; Returns: Json };
      get_user_org_ids: { Args: { user_id: string | null }; Returns: string[] };
      get_user_org_role: { Args: { user_id: string | null; org_id: string | null }; Returns: Database['public']['Enums']['org_member_role'] };
      is_org_admin: { Args: { user_id: string | null; org_id: string | null }; Returns: boolean };
      list_unpictured_verified_visits: { Args: { p_customer_id: string | null; p_organization_id: string | null; p_limit: number | null }; Returns: { visit_id: string; branch_id: string; verified_at: string }[] };
      merchant_overview: { Args: { p_organization_id: string | null; p_branch_id: string | null }; Returns: Json };
      provision_merchant: { Args: { p_name: string | null; p_slug: string | null }; Returns: string };
      record_qr_scan: { Args: { p_slug: string | null }; Returns: { qr_id: string; org_slug: string; branch_slug: string; qr_source: Database['public']['Enums']['qr_source'] }[] };
      record_verified_visit: { Args: { p_customer_id: string | null; p_branch_id: string | null; p_idempotency_key: string | null }; Returns: Json };
      redeem_customer_reward: { Args: { p_customer_id: string | null; p_branch_id: string | null; p_reward_rule_id: string | null; p_idempotency_key: string | null }; Returns: Json };
      set_customer_account: { Args: { p_display_name: string | null; p_phone: string | null }; Returns: undefined };
      set_customer_wall_consent: { Args: { p_memory_id: string | null; p_consent: boolean | null }; Returns: undefined };
    };
    Enums: {
      actor_type: 'merchant' | 'admin' | 'system';
      branch_status: 'active' | 'inactive' | 'deleted';
      campaign_status: 'draft' | 'active' | 'paused' | 'ended';
      memory_status: 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted';
      memory_visibility: 'private' | 'shared' | 'live_wall';
      moderation_action: 'approve' | 'reject' | 'hide' | 'delete' | 'restore' | 'ban' | 'unban';
      moderation_entity_type: 'memory' | 'customer' | 'report';
      org_member_role: 'owner' | 'admin' | 'manager' | 'staff';
      org_status: 'active' | 'suspended' | 'deleted';
      platform_type: 'instagram' | 'whatsapp' | 'twitter' | 'facebook' | 'download' | 'other';
      playlist_item_type: 'customer_memory' | 'offer' | 'announcement' | 'product' | 'logo' | 'campaign';
      provider_type: 'anonymous' | 'google' | 'apple' | 'magic_link';
      qr_source: 'table' | 'counter' | 'entrance' | 'poster' | 'receipt' | 'instagram' | 'campaign' | 'staff' | 'other';
      report_entity_type: 'memory' | 'customer';
      report_status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
      reporter_type: 'customer' | 'merchant' | 'admin';
      reward_event_type: 'visit_earned' | 'reward_unlocked' | 'reward_redeemed' | 'bonus_awarded' | 'share_bonus';
      reward_type: 'free_item' | 'discount_percentage' | 'fixed_discount' | 'free_print' | 'bonus_visit' | 'custom';
      screen_orientation: 'landscape' | 'portrait';
      screen_status: 'pending' | 'online' | 'offline' | 'paused';
      subscription_plan: 'free' | 'basic' | 'growth' | 'pro';
      subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing';
      trigger_type: 'visit_count' | 'memory_count' | 'social_share' | 'campaign_completion' | 'streak';
      user_role: 'user' | 'admin';
      verification_status: 'pending' | 'verified' | 'rejected' | 'suspicious';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
