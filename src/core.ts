/**
 * PACT — Core mandate lifecycle
 * createMandate · hashMandate · signMandate · revokeMandate
 */

import { createHmac, createHash, randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MandateScope {
  description: string;
  actions: string[];
  resources: string[];
  maxPaymentUsdc: number | null;
}

export interface Mandate {
  id: string;
  grantor: string;
  grantee: string;
  scope: MandateScope;
  createdAt: string;
  expiresAt: string | null;
  signature: string | null;
}

export interface RevocationEntry {
  mandateId: string;
  revokedBy: string;
  revokedAt: string;
  signature: string;
  reason: string | null;
}

export interface CreateMandateOptions {
  expiresAt?: string;
  id?: string;
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export function createMandate(
  grantor: string,
  grantee: string,
  scope: MandateScope,
  options?: CreateMandateOptions,
): Mandate {
  return {
    id: options?.id ?? `mandate_${randomUUID()}`,
    grantor,
    grantee,
    scope: {
      description: scope.description,
      actions: [...scope.actions],
      resources: [...scope.resources],
      maxPaymentUsdc: scope.maxPaymentUsdc ?? null,
    },
    createdAt: new Date().toISOString(),
    expiresAt: options?.expiresAt ?? null,
    signature: null,
  };
}

/** SHA-256 hash over the signable fields of a mandate (deterministic). */
export function hashMandate(mandate: Mandate): string {
  const signable = {
    id: mandate.id,
    grantor: mandate.grantor,
    grantee: mandate.grantee,
    scope: mandate.scope,
    createdAt: mandate.createdAt,
    expiresAt: mandate.expiresAt,
  };
  return createHash('sha256').update(JSON.stringify(signable)).digest('hex');
}

/** Attach an HMAC-SHA256 signature to a mandate. Returns a new object. */
export function signMandate(mandate: Mandate, secret: string): Mandate {
  const hash = hashMandate(mandate);
  const signature = createHmac('sha256', secret).update(hash).digest('hex');
  return { ...mandate, signature };
}

/** Create a RevocationEntry for a mandate. */
export function revokeMandate(
  mandateId: string,
  revokedBy: string,
  secret: string,
  reason?: string,
): RevocationEntry {
  const revokedAt = new Date().toISOString();
  const payload = `${mandateId}:${revokedBy}:${revokedAt}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return {
    mandateId,
    revokedBy,
    revokedAt,
    signature,
    reason: reason ?? null,
  };
}
