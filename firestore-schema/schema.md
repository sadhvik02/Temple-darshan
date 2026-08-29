# Firestore Schema Reference

> This document defines the Cloud Firestore data model for the Temple Digital Platform MVP.
> All collections, fields, types, and relationships are documented here.

---

## Collections Overview

| Collection | Purpose | Public Read | User Access | Admin Access |
|---|---|---|---|---|
| `templeInfo` | Temple details (single doc) | ✅ | Read | Full |
| `banners` | Homepage banners | ✅ (active) | Read active | Full |
| `services` | Sevas/services offered | ✅ (active) | Read active | Full |
| `slots` | Availability per service | ❌ | Read active + book | Full |
| `bookings` | User booking records | ❌ | Own bookings | Full |
| `users` | User profiles | ❌ | Own profile | Full |
| `admins` | Admin accounts | ❌ | ❌ | Own doc (read only) |
| `news` | News articles | ✅ (published) | Read published | Full |
| `events` | Temple events | ✅ (published) | Read published | Full |
| `notifications` | Push notification log | ❌ | Own + global | Full |

---

## Status & Enum Values

### Booking Status
| Value | Meaning |
|---|---|
| `pending` | Booking created, awaiting confirmation |
| `confirmed` | Booking confirmed |
| `cancelled` | Booking cancelled |
| `completed` | Service completed |

### Payment Status
| Value | Meaning |
|---|---|
| `pending` | Payment not yet received |
| `paid` | Payment received |
| `failed` | Payment failed |
| `refunded` | Payment refunded |

### Admin Roles
| Value | Meaning |
|---|---|
| `admin` | Full admin access |

> Additional roles should be discussed with the client before implementation.

---

## Collection: `templeInfo`

**Path**: `templeInfo/main` (single document)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Temple name |
| `description` | string | ✅ | About the temple |
| `address` | string | ✅ | Street address |
| `city` | string | ✅ | City |
| `state` | string | ✅ | State |
| `pincode` | string | ✅ | PIN code |
| `phone` | string | ✅ | Contact phone |
| `email` | string | ❌ | Contact email |
| `website` | string | ❌ | Website URL |
| `timings` | map | ✅ | `{ morning: "6:00 AM - 12:00 PM", evening: "4:00 PM - 9:00 PM" }` |
| `imageUrl` | string | ❌ | Main temple image (Firebase Storage URL) |
| `updatedAt` | timestamp | ✅ | Last update time |

---

## Collection: `banners`

**Path**: `banners/{bannerId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Banner title |
| `imageUrl` | string | ✅ | Image URL (Firebase Storage) |
| `isActive` | boolean | ✅ | Whether to display |
| `displayOrder` | number | ✅ | Sort order (ascending) |
| `actionUrl` | string | ❌ | Optional link/deeplink |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

---

## Collection: `services`

**Path**: `services/{serviceId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Service/seva name |
| `description` | string | ✅ | Service description |
| `imageUrl` | string | ❌ | Service image (Firebase Storage) |
| `price` | number | ✅ | Price in ₹ (0 if free) |
| `bookingEnabled` | boolean | ✅ | Whether online booking is available |
| `isActive` | boolean | ✅ | Whether to display |
| `displayOrder` | number | ✅ | Sort order (ascending) |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

---

## Collection: `slots`

**Path**: `slots/{slotId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `serviceId` | string | ✅ | Reference to `services/{serviceId}` |
| `date` | string | ✅ | Slot date (`YYYY-MM-DD`) |
| `startTime` | string | ✅ | Start time (`HH:mm`) |
| `endTime` | string | ✅ | End time (`HH:mm`) |
| `capacity` | number | ✅ | Maximum bookings allowed |
| `bookedCount` | number | ✅ | Current number of bookings (starts at 0) |
| `isActive` | boolean | ✅ | Whether slot is available for booking |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

### Capacity Enforcement

Booking capacity is enforced at **two levels**:

**1. Firestore Security Rules (server-side)**
```
// Users can update slots ONLY if:
// - Only bookedCount and updatedAt are changing
// - bookedCount is increasing
// - bookedCount does not exceed capacity
// - Slot is active
request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['bookedCount', 'updatedAt'])
&& request.resource.data.bookedCount > resource.data.bookedCount
&& request.resource.data.bookedCount <= resource.data.capacity
&& resource.data.isActive == true
```

**2. Client-side Firestore Transaction (atomicity)**
```kotlin
// Pseudocode — actual implementation in Phase 3 (Android)
firestore.runTransaction { transaction ->
    val slotRef = firestore.collection("slots").document(slotId)
    val slotDoc = transaction.get(slotRef)

    val bookedCount = slotDoc.getLong("bookedCount") ?: 0
    val capacity = slotDoc.getLong("capacity") ?: 0

    if (bookedCount + quantity > capacity) {
        throw FirebaseFirestoreException(
            "Slot is fully booked",
            FirebaseFirestoreException.Code.ABORTED
        )
    }

    // Atomically increment bookedCount
    transaction.update(slotRef, mapOf(
        "bookedCount" to bookedCount + quantity,
        "updatedAt" to FieldValue.serverTimestamp()
    ))

    // Create the booking document
    val bookingRef = firestore.collection("bookings").document()
    transaction.set(bookingRef, bookingData)
}
```

**Why this is safe without Cloud Functions:**
- The Firestore **transaction** ensures the read-check-write is atomic. If two users try to book the last slot simultaneously, one transaction will retry and fail.
- The **security rules** enforce `bookedCount <= capacity` on the server, so even a malicious client that bypasses the transaction check cannot exceed capacity.

---

## Collection: `bookings`

**Path**: `bookings/{bookingId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | string | ✅ | Reference to `users/{userId}` (= Firebase Auth UID) |
| `serviceId` | string | ✅ | Reference to `services/{serviceId}` |
| `serviceName` | string | ✅ | Denormalized service name (for display without join) |
| `slotId` | string | ❌ | Reference to `slots/{slotId}` (if slot-based) |
| `bookingRef` | string | ✅ | Unique booking reference code (e.g., `BK-20260828-A1B2`) |
| `bookingDate` | string | ✅ | Date of service (`YYYY-MM-DD`) |
| `devoteeDetails` | map | ❌ | `{ name, phone, ... }` — CLIENT CLARIFICATION REQUIRED |
| `quantity` | number (int) | ✅ | Number of persons/tickets |
| `status` | string | ✅ | `pending` / `confirmed` / `cancelled` / `completed` |
| `paymentStatus` | string | ✅ | `pending` / `paid` / `failed` / `refunded` |
| `totalAmount` | number | ✅ | Total price in ₹ |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

### Entity Relationships
```
bookings.userId      → users/{userId}
bookings.serviceId   → services/{serviceId}
bookings.slotId      → slots/{slotId}  (optional)
```

---

## Collection: `users`

**Path**: `users/{userId}` — document ID = Firebase Auth UID

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Full name |
| `phone` | string | ✅ | Phone number |
| `email` | string | ❌ | Email address |
| `createdAt` | timestamp | ✅ | Account creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

---

## Collection: `admins`

**Path**: `admins/{adminId}` — document ID = Firebase Auth UID

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Admin name |
| `email` | string | ✅ | Admin email |
| `role` | string | ✅ | `admin` |
| `createdAt` | timestamp | ✅ | Account creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

> **⚠ SECURITY**: Admin documents are NEVER writable via client SDKs.
> Admin provisioning must be done manually via Firebase Console or Admin SDK.
> See `firestore.rules` — all client write operations on `admins` return `false`.

---

## Collection: `news`

**Path**: `news/{newsId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Headline |
| `content` | string | ✅ | Article body |
| `imageUrl` | string | ❌ | Image URL (Firebase Storage) |
| `isPublished` | boolean | ✅ | Whether publicly visible |
| `publishedAt` | timestamp | ❌ | When published (set on publish) |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

---

## Collection: `events`

**Path**: `events/{eventId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Event name |
| `description` | string | ✅ | Event description |
| `imageUrl` | string | ❌ | Event image (Firebase Storage) |
| `eventDate` | string | ✅ | Event date (`YYYY-MM-DD`) |
| `startTime` | string | ✅ | Start time (`HH:mm`) |
| `endTime` | string | ✅ | End time (`HH:mm`) |
| `isPublished` | boolean | ✅ | Whether publicly visible |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

---

## Collection: `notifications`

**Path**: `notifications/{notificationId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Notification title |
| `body` | string | ✅ | Notification body |
| `type` | string | ✅ | `booking` / `announcement` / `event` / `news` |
| `targetUserId` | string | ❌ | Specific user (null if global) |
| `isGlobal` | boolean | ✅ | Whether sent to all users |
| `createdAt` | timestamp | ✅ | Creation time |

---

## Firebase Storage Folder Structure

```
/temple/          ← Temple images (main photo, gallery)
/banners/         ← Banner images
/services/        ← Service/seva images
/events/          ← Event images
/news/            ← News article images
```

All folders: public read, admin-only write, max 5 MB images.

---

## Collection: `darshans`

**Path**: `darshans/{darshanId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Darshan name (e.g., "VIP Darshan") |
| `description` | string | ✅ | Darshan description |
| `imageUrl` | string | ❌ | Image URL |
| `price` | number | ✅ | Price in ₹ (0 if free) |
| `bookingEnabled` | boolean | ✅ | Whether online booking is available |
| `isActive` | boolean | ✅ | Whether to display |
| `displayOrder` | number | ✅ | Sort order (ascending) |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

> Mirrors the `services` collection structure for consistency.

---

## Collection: `donationTypes`

**Path**: `donationTypes/{donationTypeId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Donation title (e.g., "Temple Renovation Fund") |
| `description` | string | ✅ | Description of the donation purpose |
| `imageUrl` | string | ❌ | Image URL |
| `category` | string | ✅ | Category (e.g., "general", "festival", "renovation") |
| `suggestedAmounts` | array\<number\> | ✅ | Suggested donation amounts (e.g., [101, 501, 1001]) |
| `isActive` | boolean | ✅ | Whether to display |
| `displayOrder` | number | ✅ | Sort order (ascending) |
| `createdAt` | timestamp | ✅ | Creation time |
| `updatedAt` | timestamp | ✅ | Last update time |

> `donationTypes` stores only admin-managed donation categories/content.
> Actual donation transaction records will be introduced during the payment integration phase.

---

## Multi-Source Booking: `sourceType` field

The `slots` and `bookings` collections support both Seva and Darshan offerings via a `sourceType` discriminator field:

### `slots.sourceType`
| Value | Meaning |
|---|---|
| `seva` (default) | Slot belongs to a service in `services/{serviceId}` |
| `darshan` | Slot belongs to a darshan in `darshans/{serviceId}` |

> The `serviceId` field in `slots` acts as the **offering ID**. The `sourceType` field determines whether it references `services` or `darshans`.

### `bookings.sourceType`
| Value | Meaning |
|---|---|
| `seva` (default) | Booking is for a service. `serviceId` → `services/{serviceId}` |
| `darshan` | Booking is for a darshan. `serviceId` → `darshans/{serviceId}` |

> Existing bookings without `sourceType` are interpreted as `seva` bookings.
> The `totalAmount` security rule validates price against the correct collection based on `sourceType`.

