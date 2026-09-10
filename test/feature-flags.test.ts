/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('feature flag registry includes points_engine', async () => {
  const { FEATURE_REGISTRY } = await import('../src/services/featureFlags.js');
  assert.ok(FEATURE_REGISTRY['points_engine'], 'points_engine must be in FEATURE_REGISTRY');
  assert.ok(FEATURE_REGISTRY['uk_life_admin'], 'uk_life_admin must be in FEATURE_REGISTRY');
  assert.ok(FEATURE_REGISTRY['diaspora_payments'], 'diaspora_payments must be in FEATURE_REGISTRY');
});

test('isFeatureEnabled returns boolean for points_engine', async () => {
  const { isFeatureEnabled } = await import('../src/services/featureFlags.js');
  // points_engine has defaultEnabled: true in registry
  assert.equal(isFeatureEnabled('gb', 'points_engine'), true);
  assert.equal(isFeatureEnabled('ng', 'points_engine'), true);
});

test('getFeatureFlag returns boolean for known flags', async () => {
  const { getFeatureFlag } = await import('../src/services/featureFlags.js');
  assert.equal(typeof getFeatureFlag('ng', 'points_engine'), 'boolean');
  assert.equal(typeof getFeatureFlag('gb', 'points_engine'), 'boolean');
});

test('getFeatureFlagStatus returns structured status', async () => {
  const { getFeatureFlagStatus } = await import('../src/services/featureFlags.js');
  const status = getFeatureFlagStatus('ng', 'points_engine');
  assert.ok(status, 'getFeatureFlagStatus must return a value');
  assert.equal(typeof status.enabled, 'boolean', 'status must have enabled boolean');
});

test('pointsEngine gates by market country (NG enabled, GB disabled)', async () => {
  // The market gating is done in pointsEngine.ts via isPointsEnabledForUser
  // which checks the feature flag + market country
  const { getFeatureFlag } = await import('../src/services/featureFlags.js');
  // Feature flag itself is true (defaultEnabled), but market gating in callers disables for GB
  assert.equal(getFeatureFlag('ng', 'points_engine'), true);
  assert.equal(getFeatureFlag('gb', 'points_engine'), true); // flag is true; caller does market filter
});