/**
 * PACT — Coordination frame lifecycle
 * openFrame · addParticipant · addMandateToFrame · closeFrame · abortFrame
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FrameStatus = 'open' | 'closed' | 'aborted';

export interface CoordinationFrame {
  id: string;
  status: FrameStatus;
  initiator: string;
  participants: string[];
  mandateIds: string[];
  openedAt: string;
  closedAt: string | null;
}

export interface OpenFrameOptions {
  id?: string;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class CoordinationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CoordinationError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Frame lifecycle
// ---------------------------------------------------------------------------

/** Open a new CoordinationFrame. The initiator is automatically added as a participant. */
export function openFrame(
  initiator: string,
  mandateIds?: string[],
  options?: OpenFrameOptions,
): CoordinationFrame {
  return {
    id: options?.id ?? `frame_${randomUUID()}`,
    status: 'open',
    initiator,
    participants: [initiator],
    mandateIds: mandateIds ? [...mandateIds] : [],
    openedAt: new Date().toISOString(),
    closedAt: null,
  };
}

/** Add a participant to a frame (idempotent). Returns a new frame object. */
export function addParticipant(
  frame: CoordinationFrame,
  agentId: string,
): CoordinationFrame {
  assertOpen(frame, 'addParticipant');
  if (frame.participants.includes(agentId)) return frame;
  return { ...frame, participants: [...frame.participants, agentId] };
}

/** Add a mandate ID to a frame (idempotent). Returns a new frame object. */
export function addMandateToFrame(
  frame: CoordinationFrame,
  mandateId: string,
): CoordinationFrame {
  assertOpen(frame, 'addMandateToFrame');
  if (frame.mandateIds.includes(mandateId)) return frame;
  return { ...frame, mandateIds: [...frame.mandateIds, mandateId] };
}

/** Mark a frame as closed (successful completion). Returns a new frame object. */
export function closeFrame(frame: CoordinationFrame): CoordinationFrame {
  assertOpen(frame, 'closeFrame');
  return { ...frame, status: 'closed', closedAt: new Date().toISOString() };
}

/** Mark a frame as aborted (constitutional violation or error). Returns a new frame object. */
export function abortFrame(frame: CoordinationFrame): CoordinationFrame {
  assertOpen(frame, 'abortFrame');
  return { ...frame, status: 'aborted', closedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function assertOpen(frame: CoordinationFrame, op: string): void {
  if (frame.status !== 'open') {
    throw new CoordinationError(
      'FRAME_NOT_OPEN',
      `Cannot call ${op} on a frame with status '${frame.status}'`,
    );
  }
}
