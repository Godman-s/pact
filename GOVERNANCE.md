# GOVERNANCE — PACT Protocol

> PACT is an open protocol, not a product. Anyone can implement it. No one owns the agents that run it.

## Stewardship

PACT is stewarded by **Kognai** under the [Godman Protocols](https://github.com/Godman-s) portfolio.

Kognai maintains:
- The canonical schema (`src/core.ts`, `src/types.ts`)
- The reference TypeScript implementation
- This repository and the npm package `@godman-protocols/pact`

Kognai does **not** own your PACT-compatible agent, your mandate store, or your coordination frames. Those are yours.

---

## Design Philosophy: HTTP Model, Not AOL Model

PACT is designed like HTTP — an open, forkable standard where authority is earned through adoption, not locked behind a registry.

The alternative (what we call the AOL model) would be a curated agent catalog where Kognai controls which agents are "certified" to use the protocol. We explicitly rejected this. Trust in PACT is cryptographic and scoped — a mandate either passes `verifyMandate()` or it doesn't. No central authority needed.

---

## Versioning

PACT follows [Semantic Versioning](https://semver.org):

| Change type | Version bump |
|-------------|-------------|
| Breaking schema change | Major (1.x → 2.x) |
| New optional fields, new exports | Minor (0.2 → 0.3) |
| Bug fixes, security patches | Patch (0.2.0 → 0.2.1) |

**v0.x is pre-stable.** Breaking changes may occur at minor versions with a changelog entry and a 30-day deprecation notice in the README.

**v1.0 stability guarantee**: Once v1.0 ships, the `MandateSchema`, `CoordinationFrame`, and `verifyMandate()` signature are frozen. Extensions happen via opt-in fields only.

---

## RFC Process

Changes to the PACT schema or core semantics follow an RFC (Request for Comments) process:

1. **Open an issue** titled `[RFC] <short description>` — describe the problem and proposed change
2. **Discussion period** — minimum 14 days open for community comment
3. **Kognai review** — Kognai maintainers evaluate against the Five Laws and existing compatibility commitments
4. **Merge or close** — accepted RFCs are implemented in a PR linked to the issue; rejected RFCs are closed with a written rationale

Security fixes skip the RFC process and are shipped as patch releases immediately.

---

## Compatible Runtimes

PACT is designed to work across:

| Runtime | Notes |
|---------|-------|
| **OpenClaw / Claude Code** | Install via `.openclaw` plugin; available on ClaWHub |
| **Cursor** | Install via `.cursor-plugin` config |
| **Codex CLI** | Install via `.codex` config |
| **OpenCode** | Install via `.opencode` config |
| **Any Node 20+ runtime** | `npm install @godman-protocols/pact` |

No PACT-specific infrastructure is required. Mandates are in-process data structures unless you opt into persistence.

---

## Constitutional Constraints

PACT is part of the Kognai constitutional swarm. All implementations must respect:

1. **Mandate scope is non-negotiable** — a grantee may not exceed the scope declared in the mandate, even if the grantor requests it verbally/via prompt
2. **Revocation is irreversible** — once a `RevocationEntry` is created, it cannot be undone; re-grant requires a new mandate
3. **Payment caps are hard limits** — `maxPaymentUsdc` in `MandateScope` is enforced before execution, not after
4. **No implicit trust** — agents without a valid mandate in scope cannot act on behalf of another agent; silence is not consent
5. **Human brake** — any mandate chain that would result in an irreversible real-world action (financial transaction, public post, deletion) requires a human-approval step in the frame unless the frame was explicitly opened with `humanBrakeDisabled: true` and the grantor is a verified human

---

## Contribution

Pull requests are welcome. By contributing you agree that your work is licensed under Apache 2.0 and that you have the right to grant that license.

For large changes, open an RFC issue first. For typos and documentation fixes, PR directly.

**Do not open issues requesting Kognai to certify or "approve" your agent.** PACT doesn't work that way. If your implementation passes `verifyMandate()`, it's valid.

---

## Contact

- GitHub: [github.com/Godman-s/pact](https://github.com/Godman-s/pact)
- Kognai: [kognai.ai](https://kognai.ai)
- X: [@kognai_ai](https://x.com/kognai_ai)
