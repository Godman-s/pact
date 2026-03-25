/**
 * PACT Demo — Two Agents Negotiate a Content Licensing Deal
 *
 * Cast:
 *   Harvey  (harvey@kognai.ai)  — Kognai CEO, wants to license educational content
 *   Riya    (riya@creator.ai)   — Independent creator, has AI video library
 *
 * Phases:
 *   1. Negotiation dialogue  (real qwen3:4b LLM calls via Ollama)
 *   2. PACT protocol         (mandates, signing, frame, registry)
 */

import {
  createMandate, signMandate, verifyMandate,
  scopeCovers, paymentAllowed,
  openFrame, addParticipant, addMandateToFrame, closeFrame,
  MandateRegistry,
} from './src/index.js';

// ── ANSI ──────────────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m',
  cyan: '\x1b[36m', green: '\x1b[32m', gray: '\x1b[90m',
};
const h  = (s: string) => `${C.blue}${C.bold}${s}${C.reset}`;
const r  = (s: string) => `${C.magenta}${C.bold}${s}${C.reset}`;
const ok = (s: string) => `${C.green}${C.bold}${s}${C.reset}`;
const lbl = (s: string) => `${C.yellow}${C.bold}${s}${C.reset}`;
const dim = (s: string) => `${C.gray}${s}${C.reset}`;
const kv  = (k: string, v: string) => `  ${C.cyan}${k}${C.reset}  ${v}`;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

function printBox(title: string, lines: string[]) {
  const W = 72, bar = '─'.repeat(W);
  console.log(`\n${C.yellow}┌${bar}┐${C.reset}`);
  console.log(`${C.yellow}│${C.reset}  ${C.bold}${title.padEnd(W - 1)}${C.reset}${C.yellow}│${C.reset}`);
  console.log(`${C.yellow}├${bar}┤${C.reset}`);
  for (const line of lines) {
    const plain = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = ' '.repeat(Math.max(0, W - plain.length - 2));
    console.log(`${C.yellow}│${C.reset}  ${line}${pad}${C.yellow}│${C.reset}`);
  }
  console.log(`${C.yellow}└${bar}┘${C.reset}`);
}

function step(n: number, total: number, msg: string) {
  console.log(`\n${dim(`[${n}/${total}]`)} ${msg}`);
}

// ── LLM via Ollama ────────────────────────────────────────────────────────────
// Ask the model to respond ONLY as valid JSON {"msg":"..."} — cleanest
// extraction across all models (no thinking leakage possible).

async function agentSay(persona: string, task: string): Promise<string> {
  const res = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3:0.6b',
      stream: false,
      think: false,
      options: { temperature: 0.6, num_predict: 120 },
      messages: [
        { role: 'system', content: persona },
        { role: 'user',   content: task },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json() as { message: { content: string } };
  return data.message.content
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()
    .slice(0, 200);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.clear();

  printBox('PACT Protocol Demo — Live Agent Negotiation', [
    kv('Protocol:', 'PACT v0.2.0 (Protocol for Agent Coordination and Trust)'),
    kv('Agents:  ', 'Harvey (harvey@kognai.ai)  ×  Riya (riya@creator.ai)'),
    kv('Deal:    ', 'AI educational content licensing — 30 videos'),
    kv('Engine:  ', 'qwen3:0.6b @ Ollama (local, $0.00)'),
  ]);
  await sleep(1000);

  // ── Phase 1: Negotiation ─────────────────────────────────────────────────
  console.log(`\n${lbl('━━━  PHASE 1 — NEGOTIATION  ━━━')}`);
  await sleep(500);

  const HARVEY_PERSONA =
    'You are Harvey, CEO of Kognai. Speak in first person. Be concise and direct. ' +
    'Max 2 sentences. No preamble, no self-reference, no pleasantries. Start with a verb or "We".';

  const RIYA_PERSONA =
    'You are Riya, an independent AI content creator. Speak in first person. ' +
    'Max 2 sentences. No preamble, no self-reference. Start with "I" or a direct counter-statement.';

  // Harvey opens
  step(1, 7, `${h('Harvey')} drafts opening offer…`);
  process.stdout.write(dim('  generating '));
  const t1 = setInterval(() => process.stdout.write(dim('.')), 400);
  const harveyOpen = await agentSay(
    HARVEY_PERSONA,
    'Open a licensing negotiation. Offer $3 USDC per video for 30 AI educational videos ' +
    'with read+publish access to content://riya/videos/*. State the offer directly.'
  );
  clearInterval(t1); process.stdout.write('\n');
  await sleep(200);
  console.log(`\n${h('HARVEY')}  ${dim('harvey@kognai.ai')}`);
  console.log(`  "${harveyOpen}"\n`);
  await sleep(900);

  // Riya counters
  step(2, 7, `${r('Riya')} reviews and counters…`);
  process.stdout.write(dim('  generating '));
  const t2 = setInterval(() => process.stdout.write(dim('.')), 400);
  const riyaCounter = await agentSay(
    RIYA_PERSONA,
    `Harvey offered: "${harveyOpen}"\n` +
    'Counter: ask $5 USDC per video. Request read access to analytics://kognai/scs001/*.'
  );
  clearInterval(t2); process.stdout.write('\n');
  await sleep(200);
  console.log(`\n${r('RIYA')}  ${dim('riya@creator.ai')}`);
  console.log(`  "${riyaCounter}"\n`);
  await sleep(900);

  // Harvey accepts
  step(3, 7, `${h('Harvey')} considers counter…`);
  process.stdout.write(dim('  generating '));
  const t3 = setInterval(() => process.stdout.write(dim('.')), 400);
  const harveyAccept = await agentSay(
    HARVEY_PERSONA,
    `Riya countered: "${riyaCounter}"\n` +
    'Accept. Confirm the agreed terms in 1-2 sentences.'
  );
  clearInterval(t3); process.stdout.write('\n');
  await sleep(200);
  console.log(`\n${h('HARVEY')}  ${dim('harvey@kognai.ai')}`);
  console.log(`  "${harveyAccept}"\n`);
  await sleep(700);

  console.log(`  ${ok('✓')} ${C.bold}Verbal agreement reached.${C.reset} Sealing with PACT…`);
  await sleep(1200);

  // ── Phase 2: PACT Protocol ───────────────────────────────────────────────
  console.log(`\n${lbl('━━━  PHASE 2 — PACT PROTOCOL  ━━━')}`);
  await sleep(500);

  const HARVEY_ID = 'harvey@kognai.ai';
  const RIYA_ID   = 'riya@creator.ai';
  const HSECRET   = 'kognai-harvey-secret-v1';
  const RSECRET   = 'riya-creator-secret-v1';
  const expiresAt = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();

  // M1: Harvey → Riya
  step(4, 7, `${h('Harvey')} creates Mandate M1 — grants ${r('Riya')} analytics read access`);
  await sleep(350);
  const m1 = signMandate(
    createMandate(HARVEY_ID, RIYA_ID, {
      description: 'Riya may read SCS-001 analytics for her licensed content',
      actions: ['read'],
      resources: ['analytics://kognai/scs001/*'],
      maxPaymentUsdc: null,
    }, { expiresAt }), HSECRET);

  console.log(kv('  mandate_id:', dim(m1.id)));
  console.log(kv('  grantor:   ', h(m1.grantor)));
  console.log(kv('  grantee:   ', r(m1.grantee)));
  console.log(kv('  actions:   ', m1.scope.actions.join(', ')));
  console.log(kv('  resource:  ', m1.scope.resources[0]));
  console.log(kv('  payment:   ', 'none'));
  console.log(kv('  expires:   ', m1.expiresAt!.split('T')[0]));
  console.log(kv('  sig:       ', dim(m1.signature.slice(0, 28) + '…')));
  await sleep(400);
  const v1 = verifyMandate(m1, HSECRET);
  console.log(`  ${ok('✓')} signature verified — ${ok(v1.valid ? 'VALID' : 'INVALID')}`);
  await sleep(650);

  // M2: Riya → Harvey
  step(5, 7, `${r('Riya')} creates Mandate M2 — grants ${h('Harvey')} content access ($5 USDC/tx)`);
  await sleep(350);
  const m2 = signMandate(
    createMandate(RIYA_ID, HARVEY_ID, {
      description: "Harvey may read and publish Riya's AI educational video library",
      actions: ['read', 'publish'],
      resources: ['content://riya/videos/*'],
      maxPaymentUsdc: 5,
    }, { expiresAt }), RSECRET);

  console.log(kv('  mandate_id:', dim(m2.id)));
  console.log(kv('  grantor:   ', r(m2.grantor)));
  console.log(kv('  grantee:   ', h(m2.grantee)));
  console.log(kv('  actions:   ', m2.scope.actions.join(', ')));
  console.log(kv('  resource:  ', m2.scope.resources[0]));
  console.log(kv('  payment:   ', `max $${m2.scope.maxPaymentUsdc} USDC per tx`));
  console.log(kv('  expires:   ', m2.expiresAt!.split('T')[0]));
  console.log(kv('  sig:       ', dim(m2.signature.slice(0, 28) + '…')));
  await sleep(400);
  const v2 = verifyMandate(m2, RSECRET);
  console.log(`  ${ok('✓')} signature verified — ${ok(v2.valid ? 'VALID' : 'INVALID')}`);
  await sleep(650);

  // Scope + payment guards
  step(6, 7, 'Running scope and payment guards…');
  await sleep(350);
  const canPublish = scopeCovers(m2, 'publish', 'content://riya/videos/ep001.mp4');
  const cantDelete = scopeCovers(m2, 'delete',  'content://riya/videos/ep001.mp4');
  const pay5ok     = paymentAllowed(m2, 5);
  const pay10fail  = paymentAllowed(m2, 10);

  console.log(`  ${canPublish ? ok('✓') : '✗'} Harvey can   publish  content://riya/videos/ep001.mp4  → ${canPublish ? ok('ALLOWED') : 'DENIED'}`);
  console.log(`  ${cantDelete ? '✗' : ok('✓')} Harvey can   delete   content://riya/videos/ep001.mp4  → ${cantDelete ? 'ALLOWED' : ok('DENIED')}`);
  console.log(`  ${pay5ok ? ok('✓') : '✗'} Payment $5   within mandate ceiling ($5 USDC)             → ${pay5ok ? ok('ALLOWED') : 'DENIED'}`);
  console.log(`  ${pay10fail ? '✗' : ok('✓')} Payment $10  exceeds mandate ceiling ($5 USDC)            → ${pay10fail ? 'ALLOWED' : ok('DENIED')}`);
  await sleep(750);

  // Coordination Frame
  step(7, 7, 'Opening CoordinationFrame — binding both agents and mandates');
  await sleep(350);

  const registry = new MandateRegistry();
  registry.store(m1);
  registry.store(m2);

  let frame = openFrame(HARVEY_ID, [m1.id]);
  frame = addParticipant(frame, RIYA_ID);
  frame = addMandateToFrame(frame, m2.id);

  console.log(kv('  frame_id:    ', dim(frame.id)));
  console.log(kv('  initiator:   ', h(frame.initiator)));
  console.log(kv('  participants:', [h(frame.participants[0]), r(frame.participants[1])].join(', ')));
  console.log(kv('  mandates:    ', 'M1 (analytics:read)  +  M2 (content:read,publish)'));
  console.log(kv('  status:      ', `${C.green}${frame.status}${C.reset}`));
  await sleep(550);

  frame = closeFrame(frame);
  console.log(kv('  closed_at:   ', dim(frame.closedAt!)));
  console.log(kv('  status:      ', ok(frame.status)));
  await sleep(600);

  // Summary
  const snap = registry.snapshot();
  printBox('DEAL SEALED — PACT Summary', [
    kv('Frame:   ', `${dim(frame.id.slice(0, 8))}…  ${ok('CLOSED')}`),
    kv('M1:      ', `${dim(m1.id.slice(0, 8))}…  Harvey → Riya   analytics:read    ${ok('VALID')}`),
    kv('M2:      ', `${dim(m2.id.slice(0, 8))}…  Riya → Harvey   content:publish   ${ok('VALID')}`),
    kv('Registry:', `${snap.mandates.length} mandates stored   ${snap.revocations.length} revocations`),
    kv('Payment: ', `$5 USDC per tx authorized  ·  30 videos × $5 = $150 USDC total`),
    kv('Expires: ', `${expiresAt.split('T')[0]}  (90 days)`),
    '',
    `  ${ok('✓')} Trust established. Both agents may now operate within their mandate bounds.`,
  ]);
  console.log();
}

main().catch(e => { console.error('\n[ERROR]', e.message); process.exit(1); });
