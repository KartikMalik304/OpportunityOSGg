# OpportunityOS Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default-Deny Catch-All**: Any path not explicitly matched is strictly denied (`allow read, write: if false;`).
2. **Verified Identity & Ownership**:
   - All writes to `/focus_features/{featureId}` and `/focus_sessions/{sessionId}` require an authenticated, email-verified user (`request.auth != null && request.auth.token.email_verified == true`).
   - `ownerId` must strictly equal `request.auth.uid` on creation and remain immutable on all updates (`incoming().ownerId == existing().ownerId`).
3. **Relational Integrity**:
   - A `FocusSession` document in `/focus_sessions/{sessionId}` cannot be created unless its parent `/focus_features/$(incoming().featureId)` document exists AND belongs to `request.auth.uid`.
4. **Schema, Volumetric & Array Boundaries**:
   - Document IDs must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
   - `FocusFeature.title`: `1..140` chars; `description`: `1..1000` chars; `checklistItems`: list with `size() <= 20` and validated string head element (`size() <= 240`).
   - `FocusFeature` updates are partitioned into explicit actions (`updateProgress`, `editDetails`, `archiveFeature`) with `affectedKeys().hasOnly(...)` and terminal state locking once `status == 'archived'` (unless `isAdmin()`).
5. **Temporal Integrity**:
   - `createdAt` must equal `request.time` on creation and remain immutable on update.
   - `updatedAt` must equal `request.time` on both creation and update.
6. **Zero PII Leakage & Query Enforcement**:
   - No PII (`email`, `phone`, `address`) is stored in `/focus_features` or `/focus_sessions`.
   - Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Create)**: Creating a `FocusFeature` with `ownerId: "victim-uid-999"` while authenticated as `"attacker-uid-111"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Spoof)**: Attempting to create or update a `FocusFeature` as `kartikchoudhary18122005@gmail.com` with `email_verified: false`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: Creating a `FocusFeature` with all required fields plus `"isSuperAdmin": true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on Update)**: Updating a `FocusFeature` with an unlisted field `"secretFlag": "pwned"`. -> `PERMISSION_DENIED`
5. **Payload 5 (Ownership Hijack on Update)**: Updating `ownerId` on an existing `FocusFeature` to transfer ownership. -> `PERMISSION_DENIED`
6. **Payload 6 (Immortal Field Mutation)**: Mutating `createdAt` during an update operation on `FocusFeature`. -> `PERMISSION_DENIED`
7. **Payload 7 (Forged Client Timestamp)**: Sending a past or future timestamp instead of `request.time` for `updatedAt`. -> `PERMISSION_DENIED`
8. **Payload 8 (Denial-of-Wallet 1MB String Poisoning)**: Sending a 5,000-character string in `FocusFeature.title` (limit 140). -> `PERMISSION_DENIED`
9. **Payload 9 (Unbounded Array Overflow)**: Sending 50 items in `checklistItems` (limit 20). -> `PERMISSION_DENIED`
10. **Payload 10 (Orphaned FocusSession Creation)**: Creating a `FocusSession` referencing a non-existent `featureId` or a `featureId` owned by another user. -> `PERMISSION_DENIED`
11. **Payload 11 (Terminal State Bypass)**: Attempting to update a `FocusFeature` whose `existing().status == 'archived'` as a non-admin user. -> `PERMISSION_DENIED`
12. **Payload 12 (Unauthorized Blanket List Scraping)**: Running an unconstrained collection list query on `/focus_features` without filtering by `ownerId == request.auth.uid`. -> `PERMISSION_DENIED`

---

## 3. Red Team Audit & Conflict Report

- **Collection `/focus_features/{featureId}`**:
  - *Identity Spoofing*: Blocked by `data.ownerId == request.auth.uid` in `isValidFocusFeature`.
  - *State Shortcutting / Terminal State*: Locked when `existing().status == 'archived'` unless `isAdmin()`.
  - *Resource / Value Poisoning*: Blocked because `isValidFocusFeature(incoming())` wraps the entire `allow update` expression alongside `affectedKeys().hasOnly(...)`.
  - *Query Trust*: `allow list` explicitly checks `isSignedIn() && resource.data.ownerId == request.auth.uid`.
- **Collection `/focus_sessions/{sessionId}`**:
  - *Relational Gate*: Verifies `exists(/databases/$(database)/documents/focus_features/$(incoming().featureId))` and verifies parent ownership via `get(...).data.ownerId == request.auth.uid`.
  - *Terminal State*: Locked once `existing().status == 'completed'` unless `isAdmin()`.
- **Collection `/admins/{adminId}`**:
  - *Privilege Escalation*: Only `isAdmin()` (or bootstrapped verified owner `kartikchoudhary18122005@gmail.com`) can write to `/admins/{adminId}`.
