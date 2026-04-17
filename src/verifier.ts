/**
 * PACT — Mandate verification
 * verifyMandate · scopeCovers · paymentAllowed
 */

import { createHmac } from 'node:crypto';
import { hashMandate } from './core.js';
import type { Mandate, RevocationEntry } from './core.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal glob matcher: supports `*` (single-segment) and `**` (multi-segment). */
function globMatch(pattern: string, value: string): boolean {
  // Escape regex special chars except * which we handle
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00') // placeholder for **
    .replace(/\*/g, '[^/]*')  // * = single segment
    .replace(/\x00/g, '.*');  // ** = any segments
  return new RegExp(`^${escaped}$`).test(value);
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

/**
 * Verify a mandate's signature, expiry, and optional revocation ledger.
 * @param mandate  The signed mandate to verify
 * @param secret   The shared signing secret
 * @param ledger   Optional list of RevocationEntry objects
 * @param asOf     Optional point-in-time for expiry check (default: now)
 */
export function verifyMandate(
  mandate: Mandate,
  secret: string,
  ledger?: RevocationEntry[],
  asOf?: Date,
): VerifyResult {
  // 1. Signature check
  if (!mandate.signature) {
    return { valid: false, reason: 'mandate is unsigned' };
  }
  const hash = hashMandate({ ...mandate, signature: null });
  const expected = createHmac('sha256', secret).update(hash).digest('hex');
  if (mandate.signature !== expected) {
    return { valid: false, reason: 'signature mismatch' };
  }

  // 2. Expiry check
  if (mandate.expiresAt !== null) {
    const now = asOf ?? new Date();
    if (new Date(mandate.expiresAt) <= now) {
      return { valid: false, reason: 'mandate expired' };
    }
  }

  // 3. Revocation check
  if (ledger && ledger.length > 0) {
    const revoked = ledger.some((entry) => entry.mandateId === mandate.id);
    if (revoked) {
      return { valid: false, reason: 'mandate revoked' };
    }
  }

  return { valid: true };
}

/**
 * Test whether a mandate's scope permits `action` on `resource`.
 * Resource patterns support `*` (single-segment wildcard) and `**` (multi-segment).
 */
export function scopeCovers(
  mandate: Mandate,
  action: string,
  resource: string,
): boolean {
  const { actions, resources } = mandate.scope;
  const actionOk = actions.includes(action) || actions.includes('*');
  if (!actionOk) return false;
  return resources.some((pattern) => globMatch(pattern, resource));
}

/**
 * Test whether `amountUsdc` is within the mandate's payment cap.
 * Returns true if `maxPaymentUsdc` is null (unlimited) or amount ≤ cap.
 */
export function paymentAllowed(mandate: Mandate, amountUsdc: number): boolean {
  const cap = mandate.scope.maxPaymentUsdc;
  if (cap === null) return true;
  return amountUsdc <= cap;
}
