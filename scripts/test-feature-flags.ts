/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';

const originalNodeEnv = process.env.NODE_ENV;
const originalTopics = process.env.FF_TOPICS;
const originalTopicsTest = process.env.FF_TEST_TOPICS;
process.env.NODE_ENV = 'test';
delete process.env.FF_TOPICS;
delete process.env.FF_TEST_TOPICS;

const { getFeatureFlagStatus } = await import('../src/services/featureFlags.ts');
let status = getFeatureFlagStatus('ng', 'topics');
assert.equal(status.source, 'default');
assert.equal(status.enabled, true);

process.env.FF_TOPICS = 'false';
status = getFeatureFlagStatus('ng', 'topics');
assert.equal(status.source, 'environment');
assert.equal(status.enabled, false);

process.env.FF_TEST_TOPICS = 'true';
status = getFeatureFlagStatus('ng', 'topics');
assert.equal(status.source, 'test_override');
assert.equal(status.enabled, true);

if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
if (originalTopics === undefined) delete process.env.FF_TOPICS; else process.env.FF_TOPICS = originalTopics;
if (originalTopicsTest === undefined) delete process.env.FF_TEST_TOPICS; else process.env.FF_TEST_TOPICS = originalTopicsTest;

console.log('Feature flag telemetry regression passed: default, environment, and test-override sources are distinguished correctly.');
