export type CustomerGoogleAction = 'sign-in' | 'link' | 'already-linked';

/** Never replace an existing Auth identity through OAuth, even if it looks empty:
 * another tab may save a memory while the user is at Google. */
export function customerGoogleAction(account: { googleLinked: boolean } | null): CustomerGoogleAction {
  if (!account) return 'sign-in';
  return account.googleLinked ? 'already-linked' : 'link';
}
