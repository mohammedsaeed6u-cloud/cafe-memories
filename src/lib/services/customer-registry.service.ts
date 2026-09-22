export interface RegisteredCustomer {
  phone: string;
  name: string;
  role?: string;
  registeredAt: string;
  lastVisit: string;
  totalVisits: number;
}

export class CustomerRegistryService {
  private static getCustomerNameKey(phone: string): string {
    const clean = phone.trim().replace(/[^0-9]/g, '');
    return `memories_customer_name_${clean}`;
  }

  private static getCrmKey(cafeSlug: string): string {
    return `memories_crm_customers_${cafeSlug}`;
  }

  /**
   * Looks up if a customer phone is already registered.
   * Checks both direct phone-keyed storage and the CRM registry.
   */
  static lookupCustomer(phone: string, cafeSlug: string = 'espresso-lab'): {
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
        } catch {}
      }

      // 3. Check CRM list
      const crmRaw = localStorage.getItem(this.getCrmKey(cafeSlug));
      let crmCustomer: RegisteredCustomer | undefined;
      if (crmRaw) {
        try {
          const parsed: RegisteredCustomer[] = JSON.parse(crmRaw);
          crmCustomer = parsed.find((c) => c.phone === clean);
        } catch {}
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
   * Registers a customer's phone and name permanently.
   * Ensures instant auto-login on all subsequent visits.
   */
  static registerCustomer(
    phone: string,
    name: string,
    role: string = 'coffee_lover',
    cafeSlug: string = 'espresso-lab'
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
          } catch {}
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

    return {
      phone: clean,
      name: cleanName,
      role,
      registeredAt: now,
      lastVisit: now,
      totalVisits: 1,
    };
  }

  /**
   * Retrieves all registered real customers for the given cafe.
   */
  static getRegisteredCustomers(cafeSlug: string = 'espresso-lab'): RegisteredCustomer[] {
    if (typeof window === 'undefined') return [];
    try {
      const crmKey = this.getCrmKey(cafeSlug);
      const existingRaw = localStorage.getItem(crmKey);
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }
}
