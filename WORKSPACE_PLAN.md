# Workspace Feature Plan

## Context
App on peamiselt kasutusel jagatud ostulistina — mitu inimest märgib itemeid tehtuks reaalajas. Praegu on template'id ja cheklistid jagatud eraldi invite linkidega. 30 template'i puhul tähendab see 30 linki, mis on kasutajale tülikas. Lahendus: **Workspace** — üks invite link annab ligipääsu kõigile workspace'i ressurssidele.

## Lähenemine

Workspace on uus top-level entity. Olemasolevad template'id ja cheklistid saavad `workspaceId: null` (personal) — tagasiühilduvus säilib.

### Andmemudel

**Uued schemad `openapi/api_v1.yaml`-sse:**
```yaml
WorkspaceResponse: { id, name, description?, isOwner, memberCount }
CreateWorkspaceRequest: { name, description? }
WorkspaceInviteResponse:  # sama struktuur kui TemplateInviteResponse aga workspaceId-ga
ClaimWorkspaceInviteResponse: { workspaceId, message? }
```

**Lisatakse olemasolevate schemade juurde** (`ChecklistResponse`, `TemplateResponse`, `CreateChecklistRequest`, `CreateTemplateRequest`):
```yaml
workspaceId:
  type: number
  nullable: true
```

### Uued API endpointid

```
GET/POST        /api/v1/workspaces
GET/PUT/DELETE  /api/v1/workspaces/{workspaceId}
GET             /api/v1/workspaces/{workspaceId}/members
DELETE          /api/v1/workspaces/{workspaceId}/members/{userId}
POST            /api/v1/workspaces/{workspaceId}/leave
GET/POST        /api/v1/workspaces/{workspaceId}/invites
DELETE          /api/v1/workspaces/{workspaceId}/invites/{inviteId}  # NB: workspaceId peab olemas olema
POST            /api/v1/workspace-invites/{token}/claim
GET             /api/v1/workspaces/{workspaceId}/templates
GET             /api/v1/workspaces/{workspaceId}/checklists
```

## Frontend muudatused

### Uued lehed
| Route | Eesmärk |
|-------|---------|
| `/workspaces` | Workspace'ide nimekiri |
| `/workspaces/[workspaceId]` | Workspace'i sisu (template'id + cheklistid) |
| `/workspaces/[workspaceId]/settings` | Liikmed, invite'id, kustutamine |
| `/workspace-invites/[token]/claim` | Claim leht (koopia `template-invites/[token]/claim`-st) |

### Uued komponendid
- `workspace-card.tsx` — nimekirikaart (sama pattern kui checklist-overview-card)
- `share-workspace-modal.tsx` — **koopia** `share-template-modal.tsx`-st, lihtsalt workspace API hooks
- `workspace-overview.tsx` — kahe sektsiooni vaade (template'id + cheklistid)
- `workspace-member-list.tsx` — settings lehel liikmete haldus

### Muutuvad komponendid
- Navigation — lisa "Workspaces" nav item (ei muuda template/checklist overview lehti)

> **NB:** Workspace selector olemasolevates lehtedes on üleliigne. Kasutaja navigeerib workspace'i `/workspaces/[id]` kaudu — eraldi leht, mitte inline selector.

## Implementatsiooni järjekord

**Faas 1 — Backend + OpenAPI** (blokeerib kõik muu)
1. Lisa schemad ja endpointid `openapi/api_v1.yaml`-sse
2. `npm run generate:api` → regenereeri `src/api/`
3. Go backend: workspace CRUD + membership + invite lifecycle
4. **SSE** — Go event stream peab kontrollima workspace liikmesust (`src/api/events/events.ts`)
5. **Olemasolevad list endpointid** — `GET /templates` ja `GET /checklists` tagastavad ainult `workspaceId = null` ressursse; workspace ressursid tulevad nested route'ist
6. **Autoriseerimine** — `PUT/DELETE /templates/{id}` ja `PUT/DELETE /checklists/{id}` peavad kontrollima workspace liikmesust
7. **DB migratsioon** — `workspace_id` nullable FK + uued tabelid `workspaces`, `workspace_members`, `workspace_invites`

**Faas 2 — Claim leht**
1. `/workspace-invites/[token]/claim/page.tsx` — koopia `src/app/template-invites/[token]/claim/page.tsx`-st

**Faas 3 — Workspace nimekiri ja kodu**
1. `workspace-card.tsx`
2. `/workspaces/page.tsx` + "New workspace" dialog
3. `/workspaces/[workspaceId]/page.tsx` + `workspace-overview.tsx`

**Faas 4 — Share modal ja settings**
1. `share-workspace-modal.tsx` (koopia share-template-modal-ist)
2. `/workspaces/[workspaceId]/settings/page.tsx` + `workspace-member-list.tsx`

**Faas 5 — Ressursside liigutamine workspace'i**
1. "Move to workspace" kontekstimenüüsse template'idel ja cheklistidel
2. Laiene `PUT /templates/{id}` ja `PUT /checklists/{id}` endpointe `workspaceId` väljaga

## Kriitilised failid

- `openapi/api_v1.yaml` — kõik muutused algavad siit
- `src/components/share-template-modal.tsx` — mall share-workspace-modal jaoks
- `src/app/template-invites/[token]/claim/page.tsx` — mall workspace claim lehe jaoks
- `src/api/events/events.ts` — SSE, vajab workspace liikmesuse kontroilli

## Autoriseerimine (Go backend)
- **Owner**: täis CRUD, liikmete eemaldamine, invite'ide haldus
- **Member**: lugemine + uute ressursside loomine workspace'is + workspace'ist lahkumine
- **Personal ressursid** (`workspaceId = null`): muutumatu käitumine

## Avatud otsused (enne implementatsiooni lahendada)

1. **Workspace kustutamine** — kas kustutab kõik ressursid, orphanib tagasi omanikule, või blokeerib kui ressursse on?
2. **"Move to workspace" omandiõigus** — soovitus: ressurss kuulub workspace'ile; liikme lahkumisel kaotab ta ligipääsu
3. **403 käsitlemine** — kui liige eemaldatakse, redirect `/workspaces`-sse toast'iga

## Verifikatsiooni plaan
1. Loo workspace → näha `/workspaces` lehel
2. Genereeri invite link → jaga → teine kasutaja nõuab → näeb workspace template'e
3. Loo template workspace'is → kõik liikmed näevad seda ilma eraldi invite'ita
4. Liigu personal template workspace'i → ilmub workspace vaates
5. Lahku workspace'ist → ressursid ei ole enam nähtavad
6. Eemaldatav liige saab 403 → redirect toast'iga
