# Phase 1 — Technical Documentation

> Firebase Backend, Database & Project Foundation

---

## 1. Existing Project Analysis

| Item | Finding |
|---|---|
| Repository | `/Users/sadhviknayakwadi/Documents/Freelacing_Projects/Temple` |
| Initial state | **Empty directory** — no prior code, config, or Firebase project |
| Existing Firebase project | None for this client. 4 unrelated projects exist under the account |
| Android project | None |
| Dependencies | None |
| Signing / release config | None |

**Conclusion**: Greenfield project — all infrastructure created from scratch.

---

## 2. Firebase Architecture

### Selected Plan: **Spark (No-Cost)**

```
┌─────────────────────────────────────────────────┐
│                FIREBASE PROJECT                  │
│                (Spark Plan)                      │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Firebase     │  │  Cloud Firestore         │ │
│  │  Auth         │  │  (10 collections)        │ │
│  │  (Email/Pwd)  │  │                          │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Firebase     │  │  Firebase Cloud          │ │
│  │  Storage      │  │  Messaging (FCM)         │ │
│  │  (Images)     │  │  (Push notifications)    │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                  │
│  ┌──────────────┐                                │
│  │  Crashlytics │  (Android only — Phase 3)     │
│  └──────────────┘                                │
└─────────────────────────────────────────────────┘
         │                │               │
    Admin Dashboard    Android App     Website
      (Phase 2)        (Phase 3)      (Phase 6)
```

### Services NOT Used (Cost Avoidance)

| Service | Reason |
|---|---|
| Cloud Functions | Requires Blaze plan. Not needed for MVP |
| Phone Auth (OTP) | SMS costs. CLIENT CLARIFICATION REQUIRED |
| Firebase Extensions | Requires Blaze. Not needed |
| Firebase Hosting | Not needed for Phase 1 |
| Firebase Analytics | Deferred to Phase 3 |
| Realtime Database | Firestore is sufficient |

---

## 3. Firestore Collections

### Overview

| # | Collection | Docs | Purpose |
|---|---|---|---|
| 1 | `templeInfo` | 1 (singleton) | Temple details, timings, contact |
| 2 | `banners` | Multiple | Homepage banner images |
| 3 | `services` | Multiple | Sevas/services offered |
| 4 | `slots` | Multiple | Time-slot availability per service |
| 5 | `bookings` | Multiple | User booking records |
| 6 | `users` | Multiple | User profiles (ID = Auth UID) |
| 7 | `admins` | Manual only | Admin accounts (ID = Auth UID) |
| 8 | `news` | Multiple | News articles |
| 9 | `events` | Multiple | Temple events |
| 10 | `notifications` | Multiple | In-app notification log |

Full schema with field types, constraints, and examples: [schema.md](../firestore-schema/schema.md)

---

## 4. Data Relationships

```
users/{uid}
  └─── bookings (via bookings.userId)

services/{id}
  ├─── slots (via slots.serviceId)
  └─── bookings (via bookings.serviceId)

slots/{id}
  └─── bookings (via bookings.slotId, optional)

admins/{uid}
  └─── (no direct references; used for auth checks in security rules)
```

### Denormalization

`bookings.serviceName` is denormalized from `services.name` to avoid a join when displaying booking history. If the service name changes, existing booking records retain the name at time of booking.

---

## 5. Authentication Approach

### Method: Email/Password

| Property | Value |
|---|---|
| Provider | Firebase Authentication |
| Method | Email + Password |
| Cost | Free (up to 50K MAU on Spark) |
| Admin login | Same provider, checked via `admins` collection |

### Two-Role Model

| Role | Detection | Provisioning |
|---|---|---|
| User | Has Firebase Auth account + `users/{uid}` doc | Self-registration |
| Admin | Has Firebase Auth account + `admins/{uid}` doc | **Manual only** (Firebase Console or Admin SDK) |

### Admin Provisioning (Manual Process)

1. Create a Firebase Auth account via Firebase Console
2. Copy the UID
3. Create `admins/{uid}` document in Firestore with: `name`, `email`, `role: "admin"`, `createdAt`, `updatedAt`

> **Security**: The `admins` collection has `allow create: if false; allow update: if false; allow delete: if false;` in Firestore rules. No client SDK can create or modify admin documents. This prevents privilege escalation.

---

## 6. Firestore Security Rules

### File: `firestore.rules`

### Key Security Properties

| Property | Enforcement |
|---|---|
| Admin privilege escalation prevention | `admins` collection: all client writes → `false` |
| User data isolation | `users/{userId}`: only `isOwner(userId)` can read/write |
| Booking ownership | `bookings`: `userId == request.auth.uid` required for create/read |
| Booking immutability (by user) | Users cannot update or delete bookings |
| Capacity enforcement | Slot updates: `bookedCount <= capacity` enforced in rules |
| Content protection | `services`, `banners`, `templeInfo`, `news`, `events`: admin-only write |
| Public content filtering | `isActive == true` / `isPublished == true` required for public read |
| Timestamp integrity | `createdAt` immutable on update; `updatedAt` must be server timestamp |
| Booking validation | Required fields, types, and initial status values enforced |

### Admin Detection

```
function isAdmin() {
  return isAuthenticated()
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

This uses `exists()` to check the `admins` collection. Each admin-gated rule consumes one Firestore read for the existence check. On the Spark plan (50K reads/day), this is within free limits for an MVP.

---

## 7. Booking Capacity Enforcement

### Problem

Two users simultaneously booking the last slot could exceed capacity if only checked client-side.

### Solution: Security Rules + Firestore Transactions

**Layer 1 — Security Rules (server-side enforcement)**:
- Users can only update `bookedCount` and `updatedAt` on slot documents
- `bookedCount` must increase (no decrements)
- `bookedCount` must not exceed `capacity`
- Slot must be `isActive == true`

**Layer 2 — Client Transaction (atomicity)**:
- The booking flow runs inside `firestore.runTransaction()`
- Inside the transaction: read slot → check capacity → increment `bookedCount` → create booking
- If the slot was modified between read and write, the transaction automatically retries
- If capacity is exceeded, the transaction aborts

**Why Cloud Functions are NOT needed**:
- Security rules enforce the invariant `bookedCount <= capacity` at the Firebase server
- Transactions provide atomicity at the client SDK level
- A malicious client that skips the transaction still cannot violate security rules

### Limitation

> Without Cloud Functions, admin-side booking management (e.g., cancellation with `bookedCount` decrement) must be done via:
> 1. Firebase Console (manual)
> 2. Admin SDK (local script or Admin Dashboard)
> 3. Security rules allow admins full write access to slots
>
> Regular users can only increment `bookedCount`, never decrement.

---

## 8. Firebase Storage

### Structure

```
/temple/        ← Temple images
/banners/       ← Banner images
/services/      ← Service images
/events/        ← Event images
/news/          ← News article images
```

### Security Rules (`storage.rules`)

| Path | Public Read | Write |
|---|---|---|
| `/temple/**` | ✅ | Admin only + image validation |
| `/banners/**` | ✅ | Admin only + image validation |
| `/services/**` | ✅ | Admin only + image validation |
| `/events/**` | ✅ | Admin only + image validation |
| `/news/**` | ✅ | Admin only + image validation |
| All other paths | ❌ | ❌ |

**Upload validation**: Content type must be `image/*`, max size 5 MB.

---

## 9. Notification Foundation

### Current State (Phase 1)

- `notifications` Firestore collection created for in-app notification history
- Schema supports both global (all users) and targeted (specific user) notifications
- FCM infrastructure will be set up during Android development (Phase 3)

### Future Implementation (Phase 3+)

- FCM topic subscriptions for broadcast notifications
- Device token storage in user documents
- Notification sending via Admin SDK (from Admin Dashboard)
- No Cloud Functions required — Admin Dashboard can call FCM Admin SDK directly

---

## 10. Android Data Requirements

The Firestore schema supports all planned Android screens:

| Screen | Firestore Query |
|---|---|
| Home — Banners | `banners` where `isActive == true` order by `displayOrder` |
| Home — Temple Info | `templeInfo/main` |
| Home — Featured Services | `services` where `isActive == true` order by `displayOrder` limit 5 |
| Services List | `services` where `isActive == true` order by `displayOrder` |
| Service Detail | `services/{serviceId}` |
| Slot Selection | `slots` where `serviceId == X` and `date == Y` and `isActive == true` |
| Create Booking | Transaction: update `slots/{slotId}`, create `bookings/{new}` |
| My Bookings | `bookings` where `userId == currentUser.uid` order by `createdAt desc` |
| Booking Detail | `bookings/{bookingId}` |
| News | `news` where `isPublished == true` order by `publishedAt desc` |
| Events | `events` where `isPublished == true` order by `eventDate asc` |
| Profile | `users/{currentUser.uid}` |
| Notifications | `notifications` where `targetUserId == uid` or `isGlobal == true` order by `createdAt desc` |

---

## 11. Admin Dashboard Requirements

The Admin Dashboard (Phase 2) will need these capabilities:

| Feature | Firestore Operations |
|---|---|
| Login | Firebase Auth (email/password) + verify `admins/{uid}` exists |
| Temple Info | Read/update `templeInfo/main` |
| Banners | CRUD on `banners` + image upload to Storage `/banners/` |
| Services | CRUD on `services` + image upload to Storage `/services/` |
| Slots | CRUD on `slots` (filtered by service and date) |
| Bookings | Read all `bookings`, update status |
| Users | Read `users`, basic management |
| News | CRUD on `news` + image upload to Storage `/news/` |
| Events | CRUD on `events` + image upload to Storage `/events/` |
| Notifications | Create `notifications`, send FCM via Admin SDK |

---

## 12. Website Compatibility

The data model is fully reusable by a future website:

- Same Firestore collections and documents
- Same security rules (public content is readable without auth)
- Same Firebase Storage URLs for images
- Same Firebase Auth for user login
- No website-specific data separation needed

---

## 13. Firebase Billing Status

| Property | Status |
|---|---|
| Plan | **Spark (No-Cost)** — NOT on Blaze |
| Billing enabled | **No** |
| Cloud Functions | **Not enabled** |
| Phone Auth (OTP) | **Not enabled** |
| Paid extensions | **None** |
| Expected cost | **₹0** during development |

### Spark Plan Free Limits

| Resource | Free Limit | MVP Impact |
|---|---|---|
| Firestore reads | 50,000/day | Sufficient |
| Firestore writes | 20,000/day | Sufficient |
| Firestore storage | 1 GiB | Sufficient |
| Storage (files) | 5 GB | Sufficient |
| Storage download | 1 GB/day | Sufficient |
| Auth MAU | 50,000 | Sufficient |
| FCM messages | Unlimited | N/A |

---

## 14. Client Information Required

| Item | Status | Impact |
|---|---|---|
| Temple name & identity | ❓ CLIENT CLARIFICATION REQUIRED | Affects branding, package ID |
| Phone OTP requirement | ❓ CLIENT CLARIFICATION REQUIRED | May incur SMS costs |
| Payment gateway | ❓ CLIENT CLARIFICATION REQUIRED | Payment flow design |
| Booking devotee details | ❓ CLIENT CLARIFICATION REQUIRED | `devoteeDetails` map fields |
| QR code / digital ticket | ❓ CLIENT CLARIFICATION REQUIRED | Booking confirmation screen |
| Cancellation/refund rules | ❓ CLIENT CLARIFICATION REQUIRED | Status transitions |
| Android package ID | ❓ CLIENT CLARIFICATION REQUIRED | `com.templename.app` |
| Slot-based vs date-only booking | ❓ CLIENT CLARIFICATION REQUIRED | Slot collection usage |

---

## 15. Risks & Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| No Firebase project created yet | **Blocker** | Must create before Phase 2 |
| Client hasn't confirmed temple identity | Medium | Can proceed with placeholders |
| Booking capacity without Cloud Functions | Low | Solved with security rules + transactions |
| Phone OTP cost if required | Medium | Defer until confirmed |
| Payment gateway unknown | Medium | Schema supports adding later |
| 13 days to Sept 10 deadline | **High** | Prioritize Android development |

---

## 16. Recommended Phase 2 Implementation

### Phase 2: Admin Dashboard

**Tech stack**: React + Vite + Firebase Web SDK

**Priority order**:
1. Admin login
2. Temple info management
3. Service management + image upload
4. Banner management + image upload
5. Slot management
6. Booking management (view, update status)
7. News management
8. Event management
9. Notification sending

**Estimated scope**: 8-12 screens, 1 Firebase project, no additional backend.

> Phase 2 should NOT be started until Phase 1 is reviewed and the Firebase project is created.
