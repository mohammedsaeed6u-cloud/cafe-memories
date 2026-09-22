/**
 * UTM Tracking Parameter Utility
 * Automatically appends standard marketing campaign tracking to outbound links.
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const DEFAULT_UTM: UtmParams = {
  source: 'memories_saas',
  medium: 'web_referral',
  campaign: 'platform_showcase',
};

/**
 * Appends UTM query parameters to any outbound URL.
 */
export function withUtm(url: string, customParams?: UtmParams): string {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }

    const parsed = new URL(url);
    const params = { ...DEFAULT_UTM, ...customParams };

    if (params.source) parsed.searchParams.set('utm_source', params.source);
    if (params.medium) parsed.searchParams.set('utm_medium', params.medium);
    if (params.campaign) parsed.searchParams.set('utm_campaign', params.campaign);
    if (params.term) parsed.searchParams.set('utm_term', params.term);
    if (params.content) parsed.searchParams.set('utm_content', params.content);

    return parsed.toString();
  } catch {
    return url;
  }
}
