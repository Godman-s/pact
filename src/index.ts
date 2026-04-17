/**
 * PACT — Protocol for Agent Constitutional Trust
 * "Negotiate before you integrate."
 * @version 0.3.0
 */

export * from './types.js';
export * from './core.js';
export * from './verifier.js';
export * from './coordinator.js';
export * from './registry.js';

/** Protocol version constant */
export const PACT_VERSION = '0.3' as const;
