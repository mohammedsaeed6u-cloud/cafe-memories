import { reportIgnoredError } from '@/lib/services/diagnostics';
import { createClient } from '@/lib/supabase/client';

export interface RegisteredCustomer {
  phone: string;
  name: string;
  role?: string;
  registeredAt: string;
  lastVisit: string;
  totalVisits: number;
  id?: string;
  branchId?: string;
}

export class CustomerRegistryService {
  private static getCustomerNameKey(phone: string): string {
    const clean = phone.trim().replace(/[^0-9]/g, '');
    return `memories_customer_name_${clean}`;
  }

  private static getCrmKey(cafeSlug: string): string {
    return `memories_crm_customers_${cafeSlug}`;
  }

  private static isSupabaseConfigured(): boolean {
    return Boolean(
      typeof process !== 'undefined' &&
      process.env?.NEXT_PUBLIC_SUPABASE_URL &&
      process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Looks up if a customer phone is already registered.
   * Checks both direct phone-keyed storage and the CRM registry.
   */
  static lookupCustomer(phone: string, cafeSlug: string = 'memories'): {
    exists: boolean;
    name?: string;
    role?: string;
    totalVisits?: number;
    photos?: string[];
  } {
    if (typeof window === 'undefined') return { exists: false };

    const clean = phone.trim().replace(/[^0-9]/g, '');
    if (!clean || clean.length < 8) return { exists: false };

    try {
      // 1. Direct name key
      const directName = localStorage.getItem(this.getCustomerNameKey(clean));
      const directRole = localStorage.getItem(`memories_customer_role_${clean}`);

      // 2. Check customer photo strip history
      let photos: string[] = [];
      const pastPhotosRaw = localStorage.getItem(`memories_card_photos_${cafeSlug}_${clean}`);
      if (pastPhotosRaw) {
        try {
          const parsed = JSON.parse(pastPhotosRaw);
          if (Array.isArray(parsed)) photos = parsed;
        } catch (e) { reportIgnoredError('services/customer-registry#1', e); }
      }

      // 3. Check CRM list
      const crmRaw = localStorage.getItem(this.getCrmKey(cafeSlug));
      let crmCustomer: RegisteredCustomer | undefined;
      if (crmRaw) {
        try {
          const parsed: RegisteredCustomer[] = JSON.parse(crmRaw);
          crmCustomer = parsed.find((c) => c.phone === clean);
        } catch (e) { reportIgnoredError('services/customer-registry#2', e); }
      }

      const resolvedName = directName || crmCustomer?.name;

      if (resolvedName && resolvedName.trim().length > 0) {
        return {
          exists: true,
          name: resolvedName.trim(),
          role: directRole || crmCustomer?.role || 'coffee_lover',
          totalVisits: (crmCustomer?.totalVisits || photos.length) + 1,
          photos,
        };
      }
    } catch (err) {
      console.warn('Failed customer lookup', err);
    }

    return { exists: false };
  }

  /**
   * Cloud-synchronized asynchronous customer lookup.
   * Performs zero-latency local lookup first, then syncs with Supabase PostgreSQL cloud database.
   */
  static async lookupCustomerAsync(
    phone: string,
    cafeSlug: string = 'memories'
  ): Promise<{
    exists: boolean;
    name?: string;
    role?: string;
    totalVisits?: number;
    photos?: string[];
    source?: 'cloud' | 'local';
    id?: string;
  }> {
    const local = this.lookupCustomer(phone, cafeSlug);
    const clean = phone.trim().replace(/[^0-9]/g, '');
    if (!clean || clean.length < 8) return local;

    // Check Cloud Supabase if online and configured
    if (this.isSupabaseConfigured() && typeof window !== 'undefined' && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
      try {
        const supabase = createClient();
        const { data: remoteCustomer } = await supabase
          .from('customers')
          .select('id, display_name, last_seen_at')
          .eq('anonymous_id', clean)
          .maybeSingle();

        if (remoteCustomer && remoteCustomer.display_name) {
          let remoteVisitsCount = 0;
          try {
            const { count } = await supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', remoteCustomer.id);
            remoteVisitsCount = count || 0;
          } catch (e) {
            reportIgnoredError('services/customer-registry#visitsCount', e);
          }

          const resolvedName = remoteCustomer.display_name;
          const resolvedVisits = Math.max(local.totalVisits || 1, remoteVisitsCount + 1);

          this.updateCustomerRecord(
            clean,
            {
              name: resolvedName,
              totalVisits: resolvedVisits,
              lastVisit: remoteCustomer.last_seen_at || new Date().toISOString(),
            },
            cafeSlug
          );

          return {
            exists: true,
            name: resolvedName,
            role: local.role || 'coffee_lover',
            totalVisits: resolvedVisits,
            photos: local.photos || [],
            source: 'cloud',
            id: remoteCustomer.id,
          };
        }
      } catch (err) {
        reportIgnoredError('services/customer-registry#lookupAsync', err);
      }
    }

    return { ...local, source: 'local' };
  }

  /**
   * Registers a customer's phone and name permanently.
   * Ensures instant auto-login on all subsequent visits.
   */
  static registerCustomer(
    phone: string,
    name: string,
    role: string = 'coffee_lover',
    cafeSlug: string = 'memories'
  ): RegisteredCustomer {
    const clean = phone.trim().replace(/[^0-9]/g, '');
    const cleanName = name.trim();
    const now = new Date().toISOString();

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getCustomerNameKey(clean), cleanName);
        localStorage.setItem(`memories_customer_role_${clean}`, role);
        localStorage.setItem('memories_customer_phone', clean);
        localStorage.setItem('memories_customer_name', cleanName);
        localStorage.setItem('memories_customer_role', role);

        // Update CRM registry
        const crmKey = this.getCrmKey(cafeSlug);
        const existingRaw = localStorage.getItem(crmKey);
        let list: RegisteredCustomer[] = [];
        if (existingRaw) {
          try {
            list = JSON.parse(existingRaw);
          } catch (e) { reportIgnoredError('services/customer-registry#3', e); }
        }

        const idx = list.findIndex((c) => c.phone === clean);
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            name: cleanName,
            role,
            lastVisit: now,
            totalVisits: (list[idx].totalVisits || 1) + 1,
          };
        } else {
          list.push({
            phone: clean,
            name: cleanName,
            role,
            registeredAt: now,
            lastVisit: now,
            totalVisits: 1,
          });
        }

        localStorage.setItem(crmKey, JSON.stringify(list));
      } catch (err) {
        console.error('Failed to register customer', err);
      }
    }

    const registered: RegisteredCustomer = {
      phone: clean,
      name: cleanName,
      role,
      registeredAt: now,
      lastVisit: now,
      totalVisits: 1,
    };

    // Asynchronously sync customer to Supabase Cloud in background
    if (typeof window !== 'undefined') {
      this.syncCustomerToCloud(registered, cafeSlug).catch((err) => {
        reportIgnoredError('services/customer-registry#registerCustomerAsyncSync', err);
      });
    }

    return registered;
  }

  /**
   * Registers customer with explicit async Cloud Supabase sync.
   */
  static async registerCustomerAsync(
    phone: string,
    name: string,
    role: string = 'coffee_lover',
    cafeSlug: string = 'memories'
  ): Promise<RegisteredCustomer> {
    const cust = this.registerCustomer(phone, name, role, cafeSlug);
    await this.syncCustomerToCloud(cust, cafeSlug);
    return cust;
  }

  /**
   * Syncs a customer record to the Supabase Cloud `customers` table.
   */
  static async syncCustomerToCloud(
    customer: RegisteredCustomer,
    _cafeSlug: string = 'memories'
  ): Promise<{ success: boolean; id?: string }> {
    if (!this.isSupabaseConfigured() || typeof window === 'undefined') return { success: false };
    const clean = customer.phone.trim().replace(/[^0-9]/g, '');
    if (!clean) return { success: false };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .upsert(
          {
            anonymous_id: clean,
            display_name: customer.name,
            last_seen_at: customer.lastVisit || new Date().toISOString(),
          },
          { onConflict: 'anonymous_id' }
        )
        .select('id')
        .maybeSingle();

      if (!error && data?.id) {
        return { success: true, id: data.id };
      }
    } catch (err) {
      reportIgnoredError('services/customer-registry#syncToCloud', err);
    }
    return { success: false };
  }

  /**
   * Retrieves all registered real customers for the given cafe.
   */
  static getRegisteredCustomers(cafeSlug: string = 'memories'): RegisteredCustomer[] {
    if (typeof window === 'undefined') return [];
    try {
      const crmKey = this.getCrmKey(cafeSlug);
      const existingRaw = localStorage.getItem(crmKey);
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { reportIgnoredError('services/customer-registry#4', e); }
    return [];
  }

  /**
   * Syncs all registered customers from Supabase Cloud and updates the local CRM cache.
   */
  static async syncAllRegisteredCustomersFromCloud(cafeSlug: string = 'memories'): Promise<RegisteredCustomer[]> {
    const local = this.getRegisteredCustomers(cafeSlug);
    if (!this.isSupabaseConfigured() || typeof window === 'undefined') return local;

    try {
      const supabase = createClient();
      const { data: remoteCustomers, error } = await supabase
        .from('customers')
        .select('id, anonymous_id, display_name, created_at, last_seen_at')
        .order('last_seen_at', { ascending: false })
        .limit(100);

      if (!error && remoteCustomers && remoteCustomers.length > 0) {
        const crmKey = this.getCrmKey(cafeSlug);
        const map = new Map<string, RegisteredCustomer>();

        // 1. Populate with local customers
        for (const c of local) {
          map.set(c.phone, c);
        }

        // 2. Merge cloud customers
        for (const rc of remoteCustomers) {
          if (!rc.anonymous_id) continue;
          const phone = rc.anonymous_id;
          const existing = map.get(phone);
          if (existing) {
            map.set(phone, {
              ...existing,
              name: rc.display_name || existing.name,
              lastVisit: rc.last_seen_at || existing.lastVisit,
            });
          } else {
            map.set(phone, {
              phone,
              name: rc.display_name || `عميل ${phone.slice(-4)}`,
              role: 'coffee_lover',
              registeredAt: rc.created_at || new Date().toISOString(),
              lastVisit: rc.last_seen_at || new Date().toISOString(),
              totalVisits: 1,
            });
          }
        }

        const merged = Array.from(map.values());
        localStorage.setItem(crmKey, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      reportIgnoredError('services/customer-registry#syncAllFromCloud', err);
    }

    return local;
  }

  /**
   * Adds direct loyalty stamps (+1, +2, or +3 visits) to a registered customer.
   */
  static addDirectStamp(
    phone: string,
    cafeSlug: string = 'memories',
    count: number = 1
  ): RegisteredCustomer | null {
    if (typeof window === 'undefined') return null;
    const clean = phone.trim().replace(/[^0-9]/g, '');
    const stampsToAdd = Math.max(1, count);
    try {
      const crmKey = this.getCrmKey(cafeSlug);
      const existingRaw = localStorage.getItem(crmKey);
      let list: RegisteredCustomer[] = [];
      if (existingRaw) {
        try {
          list = JSON.parse(existingRaw);
        } catch (e) { reportIgnoredError('services/customer-registry#5', e); }
      }

      const idx = list.findIndex((c) => c.phone === clean);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          totalVisits: (list[idx].totalVisits || 1) + stampsToAdd,
          lastVisit: new Date().toISOString(),
        };
        localStorage.setItem(crmKey, JSON.stringify(list));
        return list[idx];
      } else {
        // Customer not in CRM list yet, register them with stamps count
        const newCust: RegisteredCustomer = {
          phone: clean,
          name: `عميل ${clean.slice(-4)}`,
          registeredAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          totalVisits: stampsToAdd,
        };
        list.push(newCust);
        localStorage.setItem(crmKey, JSON.stringify(list));
        return newCust;
      }
    } catch (err) {
      console.warn('Failed to add direct stamp', err);
      return null;
    }
  }

  /**
   * Adds loyalty stamps locally AND synchronizes visit records to Supabase Cloud PostgreSQL.
   */
  static async addDirectStampAsync(
    phone: string,
    cafeSlug: string = 'memories',
    count: number = 1
  ): Promise<RegisteredCustomer | null> {
    const updated = this.addDirectStamp(phone, cafeSlug, count);
    if (!updated) return null;

    if (this.isSupabaseConfigured() && typeof window !== 'undefined' && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
      try {
        const supabase = createClient();
        const clean = phone.trim().replace(/[^0-9]/g, '');

        // 1. Ensure customer exists in Cloud
        let customerId: string | undefined;
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('anonymous_id', clean)
          .maybeSingle();

        if (existing?.id) {
          customerId = existing.id;
          await supabase
            .from('customers')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', customerId);
        } else {
          const { data: created } = await supabase
            .from('customers')
            .insert({
              anonymous_id: clean,
              display_name: updated.name,
              last_seen_at: new Date().toISOString(),
            })
            .select('id')
            .maybeSingle();
          customerId = created?.id;
        }

        // 2. Record visits in Supabase if organization is known
        if (customerId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', cafeSlug)
            .maybeSingle();

          if (org?.id) {
            const { data: branch } = await supabase
              .from('branches')
              .select('id')
              .eq('organization_id', org.id)
              .maybeSingle();

            const visitsToInsert = Array.from({ length: Math.max(1, count) }).map(() => ({
              customer_id: customerId,
              organization_id: org.id,
              branch_id: branch?.id || org.id,
              source: 'counter',
              verification_status: 'verified',
            }));

            await supabase.from('visits').insert(visitsToInsert);
          }
        }
      } catch (err) {
        reportIgnoredError('services/customer-registry#addDirectStampAsync', err);
      }
    }

    return updated;
  }

  /**
   * Removes a customer from the CRM registry.
   */
  static deleteCustomer(phone: string, cafeSlug: string = 'memories'): boolean {
    if (typeof window === 'undefined') return false;
    const clean = phone.trim().replace(/[^0-9]/g, '');
    try {
      localStorage.removeItem(this.getCustomerNameKey(clean));
      localStorage.removeItem(`memories_customer_role_${clean}`);
      localStorage.removeItem(`memories_card_photos_${cafeSlug}_${clean}`);

      const crmKey = this.getCrmKey(cafeSlug);
      const existingRaw = localStorage.getItem(crmKey);
      if (existingRaw) {
        const list: RegisteredCustomer[] = JSON.parse(existingRaw);
        const filtered = list.filter((c) => c.phone !== clean);
        localStorage.setItem(crmKey, JSON.stringify(filtered));
      }
      return true;
    } catch (e) { reportIgnoredError('services/customer-registry#6', e); }
    return false;
  }

  /**
   * Removes a customer from both local CRM and Supabase Cloud PostgreSQL.
   */
  static async deleteCustomerAsync(phone: string, cafeSlug: string = 'memories'): Promise<boolean> {
    const localDeleted = this.deleteCustomer(phone, cafeSlug);
    if (this.isSupabaseConfigured() && typeof window !== 'undefined') {
      try {
        const supabase = createClient();
        const clean = phone.trim().replace(/[^0-9]/g, '');
        await supabase.from('customers').delete().eq('anonymous_id', clean);
      } catch (err) {
        reportIgnoredError('services/customer-registry#deleteCustomerAsync', err);
      }
    }
    return localDeleted;
  }

  /**
   * Updates an existing customer's full record (totalVisits, role, name, lastVisit).
   */
  static updateCustomerRecord(
    phone: string,
    updates: Partial<RegisteredCustomer>,
    cafeSlug: string = 'memories'
  ): RegisteredCustomer | null {
    if (typeof window === 'undefined') return null;
    const clean = phone.trim().replace(/[^0-9]/g, '');
    try {
      const crmKey = this.getCrmKey(cafeSlug);
      const existingRaw = localStorage.getItem(crmKey);
      let list: RegisteredCustomer[] = [];
      if (existingRaw) {
        try {
          list = JSON.parse(existingRaw);
        } catch (e) { reportIgnoredError('services/customer-registry#7', e); }
      }

      const idx = list.findIndex((c) => c.phone === clean);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...updates,
          lastVisit: updates.lastVisit || new Date().toISOString(),
        };
        localStorage.setItem(crmKey, JSON.stringify(list));
        return list[idx];
      } else {
        const newCust: RegisteredCustomer = {
          phone: clean,
          name: updates.name || `عميل ${clean.slice(-4)}`,
          role: updates.role || 'coffee_lover',
          registeredAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          totalVisits: updates.totalVisits || 1,
        };
        list.push(newCust);
        localStorage.setItem(crmKey, JSON.stringify(list));
        return newCust;
      }
    } catch (err) {
      console.warn('Failed to update customer record', err);
      return null;
    }
  }
}

