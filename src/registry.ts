/**
 * PACT — MandateRegistry
 * In-memory store with store · get · has · list · addRevocation · isRevoked · snapshot · loadSnapshot
 */

import type { Mandate, RevocationEntry } from './core.js';

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface MandateFilter {
  grantor?: string;
  grantee?: string;
}

export interface RegistrySnapshot {
  mandates: Mandate[];
  revocations: RevocationEntry[];
}

// ---------------------------------------------------------------------------
// MandateRegistry
// ---------------------------------------------------------------------------

export class MandateRegistry {
  private readonly _mandates = new Map<string, Mandate>();
  private readonly _revocations = new Map<string, RevocationEntry>();

  // ── Write ──────────────────────────────────────────────────────────────

  /** Store a mandate. Overwrites any existing entry with the same id. */
  store(mandate: Mandate): void {
    this._mandates.set(mandate.id, mandate);
  }

  /** Append a revocation entry. Idempotent by mandateId. */
  addRevocation(entry: RevocationEntry): void {
    this._revocations.set(entry.mandateId, entry);
  }

  // ── Read ───────────────────────────────────────────────────────────────

  /** Returns the mandate with the given id, or undefined. */
  get(id: string): Mandate | undefined {
    return this._mandates.get(id);
  }

  /** Returns true if a mandate with the given id exists. */
  has(id: string): boolean {
    return this._mandates.has(id);
  }

  /** Number of stored mandates. */
  get size(): number {
    return this._mandates.size;
  }

  /**
   * List mandates, optionally filtered by grantor and/or grantee.
   * Returns a shallow copy array.
   */
  list(filter?: MandateFilter): Mandate[] {
    const all = [...this._mandates.values()];
    if (!filter) return all;
    return all.filter((m) => {
      if (filter.grantor !== undefined && m.grantor !== filter.grantor) return false;
      if (filter.grantee !== undefined && m.grantee !== filter.grantee) return false;
      return true;
    });
  }

  /** Returns true if a revocation entry exists for the given mandate id. */
  isRevoked(mandateId: string): boolean {
    return this._revocations.has(mandateId);
  }

  /** All current revocation entries as an array (used by verifyMandate). */
  get revocationLedger(): RevocationEntry[] {
    return [...this._revocations.values()];
  }

  // ── Snapshot ───────────────────────────────────────────────────────────

  /** Export current state as a plain serialisable snapshot. */
  snapshot(): RegistrySnapshot {
    return {
      mandates: [...this._mandates.values()],
      revocations: [...this._revocations.values()],
    };
  }

  /** Restore state from arrays (e.g. loaded from disk or Supabase). */
  loadSnapshot(mandates: Mandate[], revocations: RevocationEntry[]): void {
    this._mandates.clear();
    this._revocations.clear();
    for (const m of mandates) this._mandates.set(m.id, m);
    for (const r of revocations) this._revocations.set(r.mandateId, r);
  }
}

/** Singleton registry for single-process use. */
export const defaultRegistry = new MandateRegistry();
