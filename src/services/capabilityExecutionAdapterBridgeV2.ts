import { getCapabilityExecutionAdapter, listCapabilityExecutionAdapters, registerCapabilityExecutionAdapter } from './capabilityExtensionService.js';
import type { CapabilityExtensionExecutionAdapter } from './capabilityExtensionExecutionTypes.js';

export const getExecutionAdapter = (name: string): CapabilityExtensionExecutionAdapter | undefined =>
  getCapabilityExecutionAdapter(name) as CapabilityExtensionExecutionAdapter | undefined;

export function registerExecutionAdapter(name: string, adapter: CapabilityExtensionExecutionAdapter): void {
  registerCapabilityExecutionAdapter(name, adapter as any);
}

export const listExecutionAdapters = listCapabilityExecutionAdapters as unknown as () => Array<{ capability: string } & CapabilityExtensionExecutionAdapter>;
