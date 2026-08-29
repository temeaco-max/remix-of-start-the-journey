/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import type { CapabilityExtensionExecutionAdapter } from './capabilityExtensionExecutionTypes.js';

const adapters = new Map<string, CapabilityExtensionExecutionAdapter>();

export function registerExecutionAdapter(capability: string, adapter: CapabilityExtensionExecutionAdapter): void {
  adapters.set(String(capability).trim().toLowerCase(), { ...adapter, actions: [...new Set(adapter.actions)] });
}

export function getExecutionAdapter(capability: string): CapabilityExtensionExecutionAdapter | undefined {
  const adapter = adapters.get(String(capability).trim().toLowerCase());
  return adapter ? { ...adapter, actions: [...adapter.actions] } : undefined;
}

export function listExecutionAdapters(): Array<{ capability: string } & CapabilityExtensionExecutionAdapter> {
  return [...adapters.entries()].map(([capability, adapter]) => ({ capability, ...adapter, actions: [...adapter.actions] }));
}
