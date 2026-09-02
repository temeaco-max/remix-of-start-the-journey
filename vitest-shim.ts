// vitest-shim.ts – maps Vitest imports to Jest globals (CJS-compatible)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const jest: any;

export const describe = global.describe;
export const it = global.it;
export const test = global.test;
export const expect = global.expect;
export const beforeAll = global.beforeAll;
export const beforeEach = global.beforeEach;
export const afterAll = global.afterAll;
export const afterEach = global.afterEach;

export const vi = {
  fn: jest.fn.bind(jest),
  mocked: (obj: unknown) => obj,
  stubGlobal: (name: string, value: unknown) => {
    (globalThis as Record<string, unknown>)[name] = value;
  },
};
