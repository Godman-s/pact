# AGENTS — PACT Protocol

> How autonomous agents establish verifiable cooperation using PACT.

## What PACT Gives an Agent

Every agent in a PACT-aware swarm gets three capabilities:

| Capability | What it means |
|-----------|--------------|
| **Grant** | Create and sign a scoped mandate delegating authority to another agent |
| **Accept** | Receive a mandate and operate within its declared scope |
| **Verify** | Check any mandate's validity before acting on it |

No central broker. No shared secret between all agents. Trust is per-mandate, per-scope, per-expiry.

---

## Agent Roles

### Grantor
An agent that creates and signs mandates. The grantor:
- Defines the scope (`actions`, `resources`, `maxPaymentUsdc`)
- Sets the expiry (`expiresAt`)
- Controls revocation

A grantor must have a `TrustAnchor` — either a DID, an EVM wallet address (ERC-8004), or an organisation key managed by a vault.

### Grantee
An agent that operates under a mandate granted to it. The grantee:
- Must call `verifyMandate()` before executing any scoped action
- May not exceed the declared scope even if instructed to by a prompt
- Should log mandate IDs in its audit trail for traceability

### Verifier
Any agent (or external service) that validates mandates. PACT ships a standalone `verifyMandate()` function — there is no required verifier service.

---

## Quickstart: Two Agents Cooperating

```typescript
import {
  createMandate, signMandate, verifyMandate,
  openFrame, addParticipant, closeFrame,
  scopeCovers, paymentAllowed,
} from '@godman-protocols/pact';

const SECRET = process.env.PACT_SECRET!; // shared within one org

// Agent A (grantor) creates a mandate for Agent B
const mandate = createMandate(
  'agent-A',          // grantor
  'agent-B',          // grantee
  {
    actions:         ['invoice.create', 'invoice.send'],
    resources:       ['invoica:tenant:acme'],
    maxPaymentUsdc:  50,
  },
  { ttlSeconds: 3600 }
);

const signed = signMandate(mandate, SECRET);

// Agent B (grantee) verifies before acting
const result = verifyMandate(signed, SECRET);
if (!result.valid) throw new Error(result.reason);

if (!scopeCovers(signed, 'invoice.create', 'invoica:tenant:acme')) {
  throw new Error('Action out of scope');
}

// Wrap execution in a CoordinationFrame for auditability
const frame = openFrame('agent-A', [signed.id]);
addParticipant(frame, 'agent-B');

// ... do the work ...

closeFrame(frame);
```

---

## Scope Design Guidelines

Keep scopes as narrow as possible. Each action string should map to a single, auditable operation.

**Good scope:**
```typescript
{
  actions:   ['invoice.create'],
  resources: ['invoica:tenant:acme'],
  maxPaymentUsdc: 0,
}
```

**Too broad (avoid):**
```typescript
{
  actions:   ['*'],
  resources: ['*'],
  maxPaymentUsdc: 10000,
}
```

If you need an agent to do everything, reconsider the architecture — or open a `CoordinationFrame` that requires explicit mandate creation per action category.

---

## Integration Points

### Invoica (x402 payments)

`maxPaymentUsdc` in `MandateScope` maps directly to x402 payment caps. An Invoica-aware agent should call `paymentAllowed(mandate, amount)` before authorising any transaction.

### Clawcard (ERC-8004 identity)

Agents with a Clawcard identity automatically pass PACT's TrustAnchor requirement. Use the Clawcard DID as the `grantor` in `createMandate()`.

### Kognai (constitutional swarm)

Kognai wires PACT mandates into the Cerberus Airlock (AMD-23). External agents must hold a valid mandate to enter the swarm. Internal agents use ACP trust scores as a secondary gate after mandate verification.

### Helixa (credential scoring)

In Kognai's Chamber 2 integration, mandate ceilings are set by Helixa Cred Scores:

| Score range | Mandate ceiling |
|-------------|----------------|
| 85–100 | FULL |
| 70–84 | STANDARD |
| 50–69 | RESTRICTED |
| < 30 | REJECTED |
| Unverified + SIWA | PROVISIONAL |

---

## Security Checklist

Before deploying PACT in production:

- [ ] `PACT_SECRET` is stored in a vault (not in `.env` committed to git)
- [ ] Mandate expiry (`ttlSeconds`) is set — no mandate should be indefinite
- [ ] `maxPaymentUsdc` has a hard cap appropriate for the operation
- [ ] Revocation entries are persisted (database or Supabase adapter, not just in-memory)
- [ ] Audit log records mandate IDs for every scoped action taken
- [ ] Human-brake pattern is implemented for irreversible actions

---

## Roadmap: Agent Capabilities

| Version | Capability |
|---------|-----------|
| v0.2 (current) | HMAC-SHA256 mandate signing, scope/payment guards, CoordinationFrame |
| v0.3 | Ed25519 asymmetric signing — no shared secret needed between organisations |
| v0.4 | Persistent registry adapters (Supabase, SQLite) |
| v0.5 | x402 payment-gated mandate execution |
| v1.0 | Stable schema freeze |

---

## Questions?

Open an issue at [github.com/Godman-s/pact](https://github.com/Godman-s/pact) or read [GOVERNANCE.md](./GOVERNANCE.md) for the RFC process.
