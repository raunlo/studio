# Plan: Template Sharing + Remove Unique Constraint

## Context

Template'id on praegu kasutajapõhised ja nimepõhise unique constraint'iga. Probleem:
1. "Loo uus niikuinii" nupp annab 500 vea (DB unique constraint blokeerib)
2. Kasutajad tahavad template'e jagada — siis on samanimelised template'id paratamatud

Lahendus: eemalda unique constraint + lisa template jagamine, kasutades **sama mustrit mis checklist sharing** (invite link → claim → share tabel).

## UX

Template'id kuvatakse kahes sektsioonis (nagu checklists):
- **"Minu mallid"** — kasutaja enda loodud template'id
- **"Jagatud mallid"** — teiste jagatud template'id, autoriga

Template jagamine toimib invite link'ide kaudu (sama UX mis checklist share).

## Changes

### 1. DB: Eemalda unique constraint + lisa jagamise tabelid

**File:** `init.sql`

```sql
-- Eemalda: UNIQUE(USER_ID, NAME) TEMPLATE tabelist

-- Lisa:
CREATE TABLE IF NOT EXISTS TEMPLATE_SHARE (
    ID BIGINT PRIMARY KEY DEFAULT NEXTVAL('template_share_id_sequence'),
    TEMPLATE_ID BIGINT NOT NULL REFERENCES TEMPLATE(ID) ON DELETE CASCADE,
    SHARED_BY_USER_ID VARCHAR(255) NOT NULL,
    SHARED_WITH_USER_ID VARCHAR(255) NOT NULL REFERENCES app_user(user_id),
    CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(TEMPLATE_ID, SHARED_WITH_USER_ID)
);

CREATE TABLE IF NOT EXISTS TEMPLATE_INVITE (
    ID BIGINT PRIMARY KEY DEFAULT NEXTVAL('template_invite_id_sequence'),
    TEMPLATE_ID BIGINT NOT NULL REFERENCES TEMPLATE(ID) ON DELETE CASCADE,
    NAME VARCHAR(255),
    INVITE_TOKEN VARCHAR(64) NOT NULL UNIQUE,
    CREATED_BY VARCHAR(255) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    EXPIRES_AT TIMESTAMP,
    CLAIMED_BY VARCHAR(255),
    CLAIMED_AT TIMESTAMP,
    IS_SINGLE_USE BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (claimed_at IS NULL OR claimed_by IS NOT NULL)
);
```

### 2. Backend: Domain model

**File:** `internal/core/domain/template_invite.go` (uus)

`TemplateInvite` struct — sama struktuur mis `ChecklistInvite`.

**File:** `internal/core/domain/template.go` (muuda)

Lisa `SharedWith []string` ja `Owner string` väljad `Template` struct'ile (nagu `Checklist`-il).

### 3. Backend: Repository

**File:** `internal/repository/template_repository.go` (muuda)

- `FindTemplatesByUserId` → muuda `UNION ALL` CTE-ks mis toob nii enda kui jagatud template'id (sama muster mis `FindAllChecklists`)
- Lisa `CheckUserHasAccessToTemplate`, `CreateTemplateShare`, `DeleteTemplateShare`
- Lisa `ClaimInviteAndCreateShare` serializable TX-is

**File:** `internal/repository/template_invite_repository.go` (uus)

- `CreateInvite`, `FindActiveInvites`, `RevokeInvite`, `ClaimInvite` — kopeerib checklist invite repo mustrit

### 4. Backend: Service

**File:** `internal/core/service/template_invite_service.go` (uus)

Sama loogika mis `checklist_invite_service.go`:
- `CreateInvite` — ownership check, max 10 active, generate token
- `ClaimInvite` — validate token, expiry, single-use, idempotent claim
- `GetActiveInvites`, `RevokeInvite`

**File:** `internal/core/service/template_service.go` (muuda)

- `LeaveSharedTemplate` — nagu `LeaveSharedChecklist`
- Guard rail: muuda `IsTemplateOwner` → `HasAccessToTemplate` (owner OR shared)

### 5. Backend: Controller + OpenAPI

**File:** `openapi/api_v1.yaml` (muuda)

Lisa endpointid:
- `POST /templates/{id}/invites` — loo kutse
- `GET /templates/{id}/invites` — aktiivsed kutsed
- `DELETE /templates/invites/{inviteId}` — tühista
- `POST /template-invites/{token}/claim` — kasuta kutset
- `DELETE /templates/{id}/leave` — lahku

**File:** `internal/server/v1/template/template_controller_impl.go` (muuda)

Lisa handler'id uutele endpointidele.

### 6. Backend: Wire

**File:** `internal/deployment/wire.go` (muuda)

Lisa `TemplateInviteService` ja `TemplateInviteRepository` providers.

→ Seejärel `./generate.sh`

### 7. Frontend: API hooks

**File:** `studio/src/api/template/template.ts` (muuda)

Lisa hookid: `useCreateTemplateInvite`, `useGetTemplateInvites`, `useRevokeTemplateInvite`, `useClaimTemplateInvite`, `useLeaveTemplate`

### 8. Frontend: Template list UI

**File:** `studio/src/components/` (uus/muuda)

Template'ide list vaates:
- `isOwner` flag'i järgi grupeeri "Minu mallid" / "Jagatud mallid"
- Jagatud mallide puhul näita autori nime
- Owner'ile näita "Share" nupp
- Jagatud kasutajale näita "Leave" nupp

### 9. Frontend: Share modal

Taaskasuta `share-checklist-modal.tsx` mustrit template'ide jaoks — sama invite link UX (nimi, expiry, single-use, kopeeri link, tühista).

## Järjekord

1. DB migratsioon (unique constraint eemalda + uued tabelid)
2. Domain models
3. Repository (queries + impl)
4. Service layer
5. OpenAPI + generate
6. Controller
7. Wire + generate
8. Frontend API hooks
9. Frontend UI

## Verification

1. Loo template → nähtav "Minu mallid" all
2. Jaga template invite link'iga → teine kasutaja claim'ib
3. Teine kasutaja näeb template't "Jagatud mallid" all koos autori nimega
4. "Loo uus niikuinii" töötab ilma veata (unique constraint eemaldatud)
5. Template omanik saab invite'i tühistada
6. Jagatud kasutaja saab lahkuda
