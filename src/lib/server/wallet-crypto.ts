import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/** A separate 256-bit deployment key; never a Supabase anon/service role key. */
function encryptionKey(): Buffer {
  const encoded = process.env.WALLET_CONNECTOR_ENCRYPTION_KEY;
  if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) throw new Error('Wallet encryption key not configured');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) throw new Error('Invalid wallet encryption key');
  return key;
}
export function walletEncryptionReady() {
  try { encryptionKey(); return true; } catch { return false; }
}
export function sealWalletKey(apiKey: string): string {
  if (!/^ww_live_[0-9a-f]{32}$/.test(apiKey)) throw new Error('Invalid WalletWallet API key format');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  return `v1:${Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64')}`;
}
export function openWalletKey(sealed: string): string {
  if (!sealed.startsWith('v1:')) throw new Error('Unsupported wallet secret format');
  const parts = Buffer.from(sealed.slice(3), 'base64');
  if (parts.length < 29) throw new Error('Invalid wallet secret');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), parts.subarray(0, 12));
  decipher.setAuthTag(parts.subarray(12, 28));
  const plain = Buffer.concat([decipher.update(parts.subarray(28)), decipher.final()]).toString('utf8');
  if (!/^ww_live_[0-9a-f]{32}$/.test(plain)) throw new Error('Invalid decrypted wallet key');
  return plain;
}
