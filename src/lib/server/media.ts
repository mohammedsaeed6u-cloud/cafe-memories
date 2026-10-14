/** Only application-generated private keys may be served. Old public URLs need an explicit migration. */
export function isPrivateMemoryKey(key: string, organizationId: string, customerId: string): boolean {
  const prefix = `${organizationId}/${customerId}/`;
  return key.startsWith(prefix) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(original|optimized|thumbnail)\.webp$/.test(key.slice(prefix.length));
}
