/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create (mismatched ownerId)',
    collection: 'focus_features/feat_1',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: { ownerId: 'victim_uid', title: 'Spoofed Feature' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof of Bootstrapped Admin',
    collection: 'focus_features/feat_2',
    operation: 'create',
    auth: { uid: 'spoof_uid', email: 'kartikchoudhary18122005@gmail.com', email_verified: false },
    payload: { ownerId: 'spoof_uid', title: 'Unverified Admin Write' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Create',
    collection: 'focus_features/feat_3',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', title: 'Valid Title', isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Update',
    collection: 'focus_features/feat_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { secretFlag: 'injected' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Ownership Hijack on Update (mutating ownerId)',
    collection: 'focus_features/feat_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_2' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immortal Field Mutation (mutating createdAt)',
    collection: 'focus_features/feat_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Forged Client Timestamp on Update',
    collection: 'focus_features/feat_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { updatedAt: '2099-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial-of-Wallet Oversized String in Title (>140 chars)',
    collection: 'focus_features/feat_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', title: 'A'.repeat(500) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unbounded Array Overflow in checklistItems (>20 items)',
    collection: 'focus_features/feat_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', checklistItems: new Array(25).fill('step') },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned FocusSession Creation with Non-Existent Parent Feature',
    collection: 'focus_sessions/sess_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', featureId: 'missing_feature_id' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Bypass (Updating an Archived Feature)',
    collection: 'focus_features/archived_feat',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { status: 'active' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized Cross-User Document Read',
    collection: 'focus_features/other_user_feat',
    operation: 'get',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
