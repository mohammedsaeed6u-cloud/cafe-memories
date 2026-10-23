'use client';

export type SecurityEventType =
  | 'FAILED_PIN_ATTEMPT'
  | 'BRUTE_FORCE_LOCKOUT'
  | 'UNAUTHORIZED_TENANT_ACCESS'
  | 'PRIVILEGE_ESCALATION_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TAMPERED_VOUCHER_DETECTED'
  | 'INJECTION_ATTEMPT_BLOCKED';

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceIp: string;
  userAgent: string;
  tenantId?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export class IocAuditService {
  private static events: SecurityEvent[] = [];

  public static record(
    eventType: SecurityEventType,
    severity: SecurityEvent['severity'],
    details: Record<string, unknown> = {},
    tenantId?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      severity,
      sourceIp: 'client-ip',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      tenantId,
      details,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(event);
    if (this.events.length > 500) this.events.pop();

    return event;
  }

  public static getEvents(severityFilter?: SecurityEvent['severity']): SecurityEvent[] {
    if (!severityFilter) return this.events;
    return this.events.filter((e) => e.severity === severityFilter);
  }
}
