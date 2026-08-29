/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getCapabilityExecutionAdapter, listCapabilityExecutionAdapters, registerCapabilityExecutionAdapter } from './capabilityExtensionService.js';
import type { CapabilityExtensionExecutionAdapter } from './capabilityExtensionExecutionTypes.js';

export const getExecutionAdapter = (name: string): CapabilityExtensionExecutionAdapter | undefined =>
  getCapabilityExecutionAdapter(name) as CapabilityExtensionExecutionAdapter | undefined;

export const listExecutionAdapters = listCapabilityExecutionAdapters;
export const registerExecutionAdapter = registerCapabilityExecutionAdapter;
