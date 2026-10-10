# Data model and relationships

This local MVP uses SQLite to make the application self-contained. Table shapes and relationships are intended to support migration to PostgreSQL; financial amounts use integer minor units and currency codes. Schema initialization is implemented in `lib/db.ts`.

```mermaid
erDiagram
  USERS ||--o{ INITIATIVES : organizes
  USERS ||--o{ SAVED_INITIATIVES : saves
  INITIATIVES ||--o{ SAVED_INITIATIVES : receives
  ORGANIZATIONS ||--o{ INITIATIVES : sponsors
  INITIATIVES ||--o{ MILESTONES : tracks
  USERS ||--o{ VOLUNTEER_APPLICATIONS : applies
  INITIATIVES ||--o{ VOLUNTEER_APPLICATIONS : receives
  USERS ||--o{ RESOURCE_OFFERS : offers
  INITIATIVES ||--o{ RESOURCE_OFFERS : receives
  USERS ||--o{ DONATIONS : records
  INITIATIVES ||--o{ DONATIONS : receives
  USERS ||--o{ ASSISTANCE_REQUESTS : requests
  USERS ||--o{ AUDIT_LOGS : performs

  USERS {
    string id PK
    string email UK
    string password_hash
    string role
  }
  CAUSES {
    string id PK
    string slug UK
    string name
  }
  ORGANIZATIONS {
    string id PK
    string name
    int verified
    int demo
  }
  INITIATIVES {
    string id PK
    string slug UK
    string status
    int funding_goal_minor
    string currency
    string needs_json
  }
  MILESTONES {
    string id PK
    string initiative_id FK
    string status
  }
  VOLUNTEER_APPLICATIONS {
    string id PK
    string user_id FK
    string initiative_id FK
    string status
  }
  RESOURCE_OFFERS {
    string id PK
    string user_id FK
    string initiative_id FK
    string status
  }
  DONATIONS {
    string id PK
    string user_id FK
    string initiative_id FK
    int amount_minor
    string currency
    string status
    string provider_ref
  }
  ASSISTANCE_REQUESTS {
    string id PK
    string user_id FK
    string visibility
    string status
  }
  SAVED_INITIATIVES {
    string user_id PK, FK
    string initiative_id PK, FK
  }
  AUDIT_LOGS {
    string id PK
    string actor_id FK
    string action
    string object_type
  }
```

The `causes` table is seeded independently; the current initiative cause is stored as its displayed cause name rather than a foreign key. This is a migration gap to resolve when moving to PostgreSQL. Assistance review notes are stored as audit details and are not shown to requesters. Private document storage, organization membership, notification records, refunds, and provider webhook events are not implemented in the local MVP.
