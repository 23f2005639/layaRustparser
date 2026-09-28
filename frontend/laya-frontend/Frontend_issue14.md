# AGENTS.md

# Issue #14 — Query Explorer / Investigation Workspace

This file defines the implementation contract for **Issue #14** in the Laya Rust Parser frontend.

The goal is to build the analyst investigation workflow:

**Alert → Search → Inspect → Pivot → Verify → Export**

Do not treat this page as a static dashboard. The important interactions must work against the existing backend contracts.

---

## 1. Backend Source of Truth

Before implementing or changing any API behavior, read these files from the repository:

### Backend handlers

```text
C:\ulpf-sih\ulpf\layaRustparser\crates\ulpf-cli\src\serve\handlers.rs
```

### API contracts

```text
C:\ulpf-sih\ulpf\layaRustparser\docs\CONTRACTS.md
```

These files are the **source of truth** for:

* available endpoints
* HTTP methods
* request parameters
* response shapes
* error responses
* proof behavior
* export behavior
* field names
* pagination
* backend implementation limitations

Do not invent frontend API contracts that are not supported by these files.

If `handlers.rs` and `CONTRACTS.md` differ, investigate the discrepancy before implementing a workaround. Do not silently invent a third contract.

---

# 2. Issue #14 Scope

Issue #14 is the analyst investigation workspace.

Required capabilities:

1. Search/query records inside a selected Parquet block.
2. Filter by:

   * IP
   * vendor
   * disposition
3. Display search results.
4. Inspect an individual record.
5. Show raw log and OCSF representation side-by-side.
6. Show record provenance.
7. Pivot investigation from:

   * IP
   * vendor
   * disposition
8. Request Merkle inclusion proof.
9. Handle the backend's `501 Not Implemented` proof state correctly.
10. Export the evidence bundle from the backend.
11. Provide useful empty, loading, error, offline, and unavailable states.

The complete analyst flow should feel like:

```text
Select Block
    ↓
Search / Query
    ↓
Filter Results
    ↓
Select Record
    ↓
Inspect Raw + OCSF
    ↓
Pivot
    ↓
Inspect Provenance
    ↓
Verify Merkle Proof
    ↓
Export Evidence Bundle
```

---

# 3. Do Not Rebuild Issue #13

Issue #14 uses the same frontend application as Issue #13.

Reuse:

* existing application shell
* sidebar
* header
* typography
* cards
* buttons
* API utilities
* mock-data infrastructure
* shared TypeScript types
* existing status indicators
* existing layout conventions

Do not create a second application shell.

Do not create a second sidebar.

Do not introduce an unrelated design system.

The Query Explorer should look like the next page of the same product.

---

# 4. Exact Visual Theme

Use this color system throughout the Query Explorer.

## Canvas Base

```text
#F3F3F3
```

Purpose:

* main application background
* page canvas
* investigation workspace background

The canvas should remain clean and neutral.

---

## Sidebar Navigation

Background:

```text
#E2E4E8
```

Sidebar text:

```text
#1E293B
```

Active navigation / active indicator:

```text
#0284C7
```

Use the existing sidebar implementation rather than creating another navigation component.

---

## Cards & Containers

Card/background:

```text
#FFFFFF
```

Borders:

```text
#E2E8F0
```

Use white cards against the `#F3F3F3` canvas.

Avoid excessive shadows.

Prefer:

```text
border: 1px solid #E2E8F0
```

over heavy visual effects.

---

# 5. Buttons & Dark Accents

Primary button:

```text
#1A1D20
```

Primary button hover:

```text
#2E343A
```

Use dark buttons for major actions such as:

* Run Query
* Inspect
* Export Evidence
* Apply
* Verify when available

---

# 6. Primary Technology Accent

Primary technology accent:

```text
#0284C7
```

Use it for:

* active navigation
* selected records
* links
* technical metadata emphasis
* focus states
* query controls
* selected filters
* investigation pivots
* informational accents

Do not turn the entire UI blue.

The accent should communicate:

**active / technical / actionable**

---

# 7. Telemetry Status Colors

PASS:

```text
#10B981
```

FAIL:

```text
#FF5C5C
```

Use these consistently for integrity/audit states.

Examples:

```text
PASS
FAIL
```

Do not use PASS/FAIL colors for unrelated UI elements.

---

# 8. Typography

Primary UI typography:

```text
Inter
```

Use Inter for:

* headings
* labels
* navigation
* buttons
* descriptions
* table content
* metadata

Technical/data typography:

```text
JetBrains Mono
```

Use JetBrains Mono for:

* SQL/query text
* UUIDs
* SHA-256 hashes
* event IDs
* block IDs when presented as technical identifiers
* raw logs
* JSON
* provenance information
* technical backend values

Metadata/timestamps/search hints:

```text
#64748B
```

Primary labels/headings:

```text
#1E293B
```

---

# 9. Page Layout

The Query Explorer should use a structured investigation layout.

Recommended hierarchy:

```text
┌──────────────────────────────────────────────────────┐
│ Header                                               │
├──────────────────────────────────────────────────────┤
│ Query Explorer                                      │
│                                                      │
│ Block Selector                                      │
│                                                      │
│ SQL / Search Console                                │
│                                                      │
│ Quick Filters                                       │
│                                                      │
│ Results                                             │
│                                                      │
│ Selected Record                                    │
│ ┌─────────────────────┬───────────────────────────┐ │
│ │ Raw Log             │ OCSF                      │ │
│ └─────────────────────┴───────────────────────────┘ │
│                                                      │
│ Provenance / Verification / Pivot / Export          │
└──────────────────────────────────────────────────────┘
```

The page should prioritize investigation data over decorative UI.

---

# 10. Block Selector

The user must be able to select a block before investigating records.

The block list comes from the backend's existing block endpoint.

Display useful block metadata such as:

* block ID
* timestamp
* leaf count
* Merkle root
* audit status
* Parquet filename
* size
* file availability

Do not fabricate block metadata.

The frontend must use the actual response fields defined by the backend contract.

---

# 11. Query / SQL Console

Issue #14 requires a SQL/search-style investigation interface.

The current backend contract must be respected.

The frontend must **not pretend that it has arbitrary SQL execution** if the backend does not expose an arbitrary SQL endpoint.

The query editor should therefore act as a SQL-style investigation interface mapped to the backend's supported record filters.

Supported concepts include:

```sql
SELECT * FROM records
WHERE vendor = 'Cisco'
```

or:

```sql
SELECT * FROM records
WHERE disposition = 'Blocked'
```

or:

```sql
SELECT * FROM records
WHERE ip = '192.168.1.10'
```

or combinations supported by the backend.

The frontend translates the query into the actual backend request parameters.

Do not add browser-side Parquet SQL execution unless the backend/API contract is explicitly changed.

---

# 12. Do NOT Add DuckDB-WASM

Do not implement:

```text
Browser
  ↓
Download Parquet
  ↓
DuckDB-WASM
  ↓
Local SQL
```

The backend owns Parquet access.

The frontend owns:

* query construction
* query controls
* request state
* result presentation
* investigation interactions

The backend owns:

* Parquet reading
* filtering
* record retrieval

---

# 13. Record Querying

The record investigation endpoint is:

```text
GET /blocks/:id/records
```

Consult:

```text
C:\ulpf-sih\ulpf\layaRustparser\crates\ulpf-cli\src\serve\handlers.rs
```

and:

```text
C:\ulpf-sih\ulpf\layaRustparser\docs\CONTRACTS.md
```

before changing its frontend implementation.

The supported query/filter concepts include:

```text
offset
limit
vendor
disposition
ip
query
```

The backend performs the filtering.

The frontend should not download an entire block and reproduce backend filtering unnecessarily.

---

# 14. Search Behavior

The general query should be sent through the backend's `query` parameter.

The backend currently searches relevant record content such as:

* raw log
* event ID
* raw hash

The frontend must not claim that `query` performs arbitrary SQL.

Use terminology such as:

```text
Search
Query
SQL-style Query
Investigation Query
```

where appropriate.

---

# 15. Pagination

Respect the backend's pagination contract.

The backend uses:

```text
offset
limit
```

The UI should provide pagination when result counts require it.

Do not load thousands of records into the browser unnecessarily.

The backend response provides:

* total records in block
* filtered records count
* offset
* limit
* records

Use these values for the pagination UI.

---

# 16. Results Table

The results table should make investigation fast.

Useful columns include:

* Timestamp
* Event ID
* Vendor
* Disposition
* Source/IP information where available
* Record/leaf index
* Investigation action

Do not invent a field that does not exist in the API response.

When a value is nested inside OCSF, extract it carefully from the returned OCSF object rather than pretending it is a top-level backend field.

Use JetBrains Mono for:

* event IDs
* hashes
* technical identifiers
* raw technical values

---

# 17. Record Inspection

Clicking a result should open the investigation view/panel.

The record response contains the backend-defined record information.

The inspection view should clearly separate:

## Raw

Show:

```text
raw_log
```

in a technical monospace viewer.

## OCSF

Show:

```text
ocsf
```

as formatted JSON.

Use a split layout:

```text
┌─────────────────────────┬─────────────────────────┐
│ RAW LOG                 │ OCSF                    │
│                         │                         │
│ original event          │ normalized event       │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
```

The purpose is to let the analyst compare:

```text
Original Evidence
        ↕
Normalized Representation
```

Do not modify the raw log in the frontend.

---

# 18. Provenance

The record investigation view must expose provenance information supplied by the backend.

Relevant fields include:

```text
event_id
block_id
leaf_index
timestamp
raw_hash
```

Display hashes and identifiers using JetBrains Mono.

Example conceptual presentation:

```text
EVENT ID
<backend value>

BLOCK
<backend value>

LEAF
<backend value>

SHA-256
<backend raw_hash>
```

Do not generate fake:

* SHA-256 hashes
* UUIDs
* block IDs
* leaf indices
* Merkle roots

If the backend does not provide a value, show:

```text
Not available
```

rather than inventing one.

---

# 19. UUID / Event Identity

Do not fabricate UUIDv7 provenance in the frontend.

If the backend returns an event ID, display the actual value.

If the contract guarantees UUIDv7 semantics, the UI can label it accordingly.

Otherwise do not infer UUID version solely from appearance.

---

# 20. Pivot Investigation

Every record should provide quick pivot actions where the required value exists.

Supported investigation pivots:

```text
IP
Vendor
Disposition
```

Example:

```text
Pivot by IP
```

should trigger another request using the backend's supported:

```text
ip=<value>
```

filter.

Likewise:

```text
Pivot by Vendor
```

uses:

```text
vendor=<value>
```

and:

```text
Pivot by Disposition
```

uses:

```text
disposition=<value>
```

The pivot should update the Query Explorer state rather than silently performing a completely different search.

Show active filters clearly.

Example:

```text
FILTERS

IP: 192.168.1.10     ×
Vendor: Cisco        ×
Disposition: Blocked ×
```

---

# 21. Clear Filters

Provide a clear/reset action.

It should remove investigation filters and restore the appropriate block-level result state.

Do not unexpectedly change the selected block unless the user explicitly requests it.

---

# 22. Merkle Proof

The proof endpoint is:

```text
GET /prove/:block/:leaf
```

Read the exact behavior from:

```text
C:\ulpf-sih\ulpf\layaRustparser\crates\ulpf-cli\src\serve\handlers.rs
```

The frontend must distinguish between:

```text
Proof unavailable
```

and:

```text
Backend offline
```

These are not the same state.

---

# 23. HTTP 501 Proof State

The proof endpoint can return:

```text
501 Not Implemented
```

This is an expected backend capability state.

It means:

```text
Backend is reachable
but this capability is currently unavailable/stubbed.
```

It does **NOT** mean:

```text
OFFLINE
```

Do not show:

```text
Backend Offline
```

for HTTP 501.

Use a clear state such as:

```text
Proof unavailable

Merkle inclusion proof is currently not implemented by the backend.
```

The exact backend error/message should be respected where appropriate.

---

# 24. Live Proof

If the backend contract supports the live proof query mode, use the documented mechanism.

Do not invent a new endpoint.

For example, if the backend contract specifies a query such as:

```text
?live=true
```

use that exact contract.

The returned proof data should be rendered from the backend response.

Relevant proof information may include:

```text
block_id
leaf_index
tree_size
leaf_hash
calculated_merkle_root
ledger_merkle_root
verified
audit_path
standard
```

Only display fields actually returned by the backend.

---

# 25. Proof Verification UI

When proof data is available, clearly show:

```text
Verification Status
```

and distinguish:

```text
VERIFIED
```

from:

```text
NOT VERIFIED
```

Use:

```text
#10B981
```

for PASS/verified states.

Use:

```text
#FF5C5C
```

for failed verification states.

Do not make a visual claim of verification merely because the request succeeded.

The backend's:

```text
verified
```

value is authoritative.

---

# 26. Evidence Bundle Export

Issue #14 requires one-click evidence bundle export.

Use the backend export endpoint defined in:

```text
C:\ulpf-sih\ulpf\layaRustparser\crates\ulpf-cli\src\serve\handlers.rs
```

and:

```text
C:\ulpf-sih\ulpf\layaRustparser\docs\CONTRACTS.md
```

The endpoint is:

```text
GET /export/bundle/:id
```

Do not generate a fake evidence bundle in the browser.

Do not create a ZIP containing arbitrary frontend JSON and call it a courtroom evidence bundle.

The backend is responsible for generating the authoritative bundle.

---

# 27. Evidence Bundle Contents

The backend-generated evidence bundle is expected to contain the documented evidence artifacts, including the self-describing README and integrity information.

The frontend should treat the returned binary as an opaque downloadable artifact.

The UI should communicate:

```text
Export Evidence Bundle
```

rather than attempting to reproduce the backend archive.

The README inside the backend-generated bundle explains verification steps.

---

# 28. Export UX

Export should be one-click from the investigation workspace.

Recommended flow:

```text
Select Record / Block
        ↓
Export Evidence
        ↓
Request backend bundle
        ↓
Download returned archive
```

During export:

```text
Preparing evidence bundle...
```

After success:

```text
Evidence bundle exported
```

On failure:

```text
Evidence export unavailable
```

Do not claim that an export succeeded until the backend request successfully returns the artifact.

---

# 29. No Block Selected

The page must have a deliberate empty state.

Example:

```text
No block selected

Select a Parquet block to begin an investigation.
```

Do not show an empty table with no explanation.

Do not attempt:

```text
GET /blocks/undefined/records
```

---

# 30. No Search Results

When a valid query returns zero records, show:

```text
No matching records

Try clearing a filter or changing the investigation query.
```

This is not an error.

Do not use the red FAIL state for an ordinary empty result.

---

# 31. Missing Block

If the backend returns:

```text
404
```

for a requested block, show a resource-specific error.

Example:

```text
Block not found

The selected Parquet block is not available.
```

Do not classify 404 as offline.

---

# 32. Backend Errors

HTTP:

```text
500
```

means the backend was reached but encountered an error.

Show an appropriate backend-error state.

Do not label HTTP 500 as:

```text
OFFLINE
```

---

# 33. Offline State

Offline means the frontend cannot reach the backend.

Typical transport failures:

```text
Failed to fetch
ERR_CONNECTION_REFUSED
network failure
```

Use:

```text
OFFLINE
```

only for transport/connectivity failures.

Example:

```text
Backend Offline

The investigation backend at 127.0.0.1:8080 could not be reached.

Start the Rust backend and retry.
```

---

# 34. Do Not Automatically Fall Back to Mock

Do not do this:

```ts
try {
  return await getRecordsFromBackend();
} catch {
  return mockRecords;
}
```

A network failure is not mock mode.

Correct conceptual behavior:

```text
Intentional mock mode
        ↓
MOCK

Backend request succeeds
        ↓
LIVE

Backend cannot be reached
        ↓
OFFLINE

Backend returns 501
        ↓
NOT IMPLEMENTED

Backend returns 404
        ↓
NOT FOUND

Backend returns 500
        ↓
BACKEND ERROR
```

---

# 35. Mock Data

Mock data may remain where the backend contract does not provide an implementation or when the application intentionally runs in mock mode.

However:

**Mock data must always be identifiable as mock data.**

Do not display fixture records while simultaneously displaying:

```text
LIVE
```

as though those records came from the backend.

---

# 36. Endpoint-Level Status

Do not assume the entire page has one global status.

Example:

```text
GET /blocks
        → LIVE

GET /blocks/1/records
        → LIVE

GET /prove/1/42
        → 501 NOT IMPLEMENTED

GET /export/bundle/1
        → LIVE
```

The page can therefore contain:

```text
LIVE DATA
```

while the proof section says:

```text
PROOF UNAVAILABLE
```

Do not turn the whole application OFFLINE because one capability returns 501.

---

# 37. Suggested Request State Model

Use explicit request state where useful:

```ts
type RequestState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "not_implemented";
```

For backend connectivity:

```ts
type ApiStatus =
  | "LIVE"
  | "MOCK"
  | "OFFLINE";
```

Keep these concepts separate.

`501` is a request/capability state, not an offline status.

---

# 38. Preserve Loaded Investigation Data

If the user has already loaded a record and the backend later becomes unavailable:

Do not immediately erase the record.

Preserve already-loaded evidence in the UI.

Backend-dependent actions can become unavailable:

```text
Verify Proof
Export Evidence
```

but previously loaded:

```text
Raw Log
OCSF
SHA
Event ID
Block
Leaf
```

should remain visible.

---

# 39. Retry

Retry should repeat the same investigation request.

Do not silently reset:

* selected block
* query
* filters
* pagination
* selected record

unless the user explicitly clears them.

---

# 40. API Layer

Keep backend communication centralized.

Do not scatter raw:

```ts
fetch("http://127.0.0.1:8080/...")
```

calls throughout components if the existing API abstraction already handles this.

Extend the existing API layer where possible.

The API layer should:

1. construct the correct endpoint
2. encode query parameters
3. parse responses
4. preserve HTTP status
5. classify transport errors
6. expose useful errors to the UI

Do not hide important backend status codes.

---

# 41. TypeScript Types

Define types matching the actual backend contracts.

Do not create frontend types that contradict the Rust structs/contracts.

Important conceptual types include:

```text
Block
BlockRecordsResponse
StoredRecord
InclusionProofResponse
ErrorResponse
```

Use the actual property names from the backend.

Avoid:

```ts
any
```

for OCSF/proof data when a reasonable type can be created.

For flexible OCSF JSON, use an appropriate JSON value type instead of arbitrary `any`.

---

# 42. OCSF Rendering

OCSF is backend-provided normalized JSON.

Render it as structured JSON.

Do not rewrite or normalize OCSF fields in the frontend.

The frontend's job is presentation.

If OCSF parsing fails or the backend returns fallback content, display what the backend actually supplied.

---

# 43. Raw Evidence Integrity

The raw log is evidence.

Never:

* trim meaningful content
* rewrite values
* normalize whitespace before displaying it as raw
* generate replacement values
* modify the SHA
* calculate a different hash and call it the authoritative hash

The backend's `raw_hash` is the provenance value to display.

---

# 44. Investigation Metadata

Metadata should be visually secondary.

Use:

```text
#64748B
```

for:

* timestamps
* hints
* secondary descriptions
* technical metadata labels where appropriate

Use:

```text
#1E293B
```

for:

* primary labels
* headings
* important values

---

# 45. Visual Density

This is an analyst tool, not a marketing landing page.

Prefer:

* compact cards
* dense tables
* clear dividers
* readable monospace data
* strong hierarchy
* minimal decoration

Avoid:

* huge hero sections
* excessive gradients
* unnecessary animations
* oversized cards
* excessive rounded containers
* decorative illustrations that reduce workspace

---

# 46. Query Editor UX

The query editor should support:

```text
Run Query
Clear
```

and should show:

* current block
* active filters
* query text
* loading state
* result count

Example:

```text
QUERY

SELECT * FROM records
WHERE vendor = 'Cisco'
  AND disposition = 'Blocked'

                    [ Run Query ]
```

Use JetBrains Mono for the query.

---

# 47. Query Validation

Invalid or unsupported query syntax should not silently execute as something else.

Show a concise validation message.

Example:

```text
Unsupported query

This query uses an operation not supported by the current backend contract.
```

Do not pretend to support:

```sql
GROUP BY
JOIN
SUM()
AVG()
ORDER BY
subqueries
```

unless the backend contract actually supports them.

---

# 48. Security / Evidence Integrity Rule

The frontend is a read-only investigation client.

It must not modify:

* Parquet evidence
* ledger entries
* Merkle roots
* raw hashes
* inclusion proofs

The frontend only requests and presents these artifacts.

---

# 49. Existing Design System Reuse

Before creating a new component, inspect the existing frontend.

Prefer reuse of:

* Button
* Card
* Badge
* Table
* Modal/Drawer
* Tabs
* Input
* Select
* existing status components

Do not duplicate components that already exist.

---

# 50. Responsive Behavior

The investigation workspace should remain usable at smaller widths.

The Raw/OCSF split may collapse vertically on narrow screens:

```text
Desktop:

Raw              OCSF
────────────     ────────────


Mobile:

Raw
────────────

OCSF
────────────
```

The investigation workflow must remain usable without horizontal overflow.

---

# 51. Accessibility

Interactive controls must have:

* visible focus states
* useful labels
* keyboard accessibility
* meaningful button names
* sufficient contrast

Do not rely exclusively on color for:

```text
PASS
FAIL
LIVE
MOCK
OFFLINE
```

Include text labels/icons where appropriate.

---

# 52. Loading States

Every backend operation should have an appropriate loading state.

Examples:

```text
Loading blocks...
Searching records...
Loading record...
Checking proof...
Preparing evidence bundle...
```

Disable duplicate submissions while a request is active.

---

# 53. Error States

Errors should identify the operation that failed.

Bad:

```text
Something went wrong.
```

Better:

```text
Unable to load records.

The backend could not read the selected Parquet block.
```

For 501:

```text
Proof unavailable.

The Merkle inclusion proof capability is not currently implemented.
```

For network failure:

```text
Backend offline.

Unable to reach the investigation service.
```

These states must remain semantically distinct.

---

# 54. Evidence Export Must Be Backend-Authoritative

Never create a frontend-generated fake:

```text
evidence.zip
```

containing invented:

```text
ledger_entry.json
SHA256SUMS
merkle proof
```

The backend-generated export is authoritative.

The frontend downloads the returned artifact.

---

# 55. What NOT to Implement

Unless the backend contract changes, do not implement:

* browser-side Parquet querying
* DuckDB-WASM
* arbitrary SQL execution
* fake Merkle proofs
* fake ledger entries
* fake SHA-256 provenance
* generated UUIDv7 values presented as backend evidence
* frontend-created courtroom evidence bundles
* automatic LIVE → MOCK fallback
* treating 501 as OFFLINE
* treating 404 as OFFLINE
* treating 500 as OFFLINE

---

# 56. Backend Changes

Issue #14 is primarily a frontend investigation workspace.

Do not modify backend behavior merely to make the UI easier.

If a required Issue #14 acceptance criterion genuinely cannot be fulfilled using the existing backend contract:

1. identify the missing contract
2. document it
3. do not fake the functionality
4. coordinate a backend change separately

The frontend must follow the actual API contract.

---

# 57. Testing Checklist

Before considering Issue #14 complete, test:

## Block

* [ ] Blocks load
* [ ] Block selector works
* [ ] Block metadata displays correctly
* [ ] Missing block handled

## Query

* [ ] Query editor works
* [ ] Run Query works
* [ ] Clear works
* [ ] Vendor filtering works
* [ ] Disposition filtering works
* [ ] IP filtering works
* [ ] Generic search works
* [ ] Pagination works
* [ ] Unsupported query states are clear

## Record

* [ ] Result selection works
* [ ] Raw log displays
* [ ] OCSF displays
* [ ] Event ID displays
* [ ] Block ID displays
* [ ] Leaf index displays
* [ ] SHA-256 displays

## Pivot

* [ ] IP pivot works
* [ ] Vendor pivot works
* [ ] Disposition pivot works
* [ ] Active filters are visible
* [ ] Filters can be cleared

## Proof

* [ ] Verify action works
* [ ] Live proof contract is respected
* [ ] Verified state is backend-derived
* [ ] 501 state is displayed as unavailable
* [ ] 501 is not classified as offline
* [ ] proof failure is clearly communicated

## Export

* [ ] Export button works
* [ ] Backend bundle is downloaded
* [ ] Loading state works
* [ ] Export failure works
* [ ] Offline export state works
* [ ] No fake evidence bundle is generated

## Connectivity

* [ ] LIVE state works
* [ ] MOCK state works where intended
* [ ] OFFLINE state works
* [ ] 404 is distinct from OFFLINE
* [ ] 500 is distinct from OFFLINE
* [ ] 501 is distinct from OFFLINE

---

# 58. Manual Backend Verification

When debugging API integration, use the actual Rust backend and verify the exact endpoints.

Base development backend:

```text
http://127.0.0.1:8080
```

Verify endpoints according to:

```text
C:\ulpf-sih\ulpf\layaRustparser\crates\ulpf-cli\src\serve\handlers.rs
```

and:

```text
C:\ulpf-sih\ulpf\layaRustparser\docs\CONTRACTS.md
```

Do not assume an endpoint exists because Issue #14 describes it conceptually.

---

# 59. Definition of Done

Issue #14 is complete when an analyst can perform this workflow without manually interacting with the backend:

```text
1. Open Query Explorer
       ↓
2. Select a block
       ↓
3. Enter a search/query
       ↓
4. Run the query
       ↓
5. Inspect results
       ↓
6. Open a record
       ↓
7. Compare Raw vs OCSF
       ↓
8. View SHA / event / block / leaf provenance
       ↓
9. Pivot by IP/vendor/disposition
       ↓
10. Request proof
       ↓
11. Correctly see verified / unavailable / error state
       ↓
12. Export the backend-generated evidence bundle
```

The page must remain truthful about backend state at every step.

---

# 60. Final Implementation Principle

The Query Explorer is an **investigation client**, not a simulated SIEM.

The UI should make the analyst's workflow fast:

```text
SEARCH
   ↓
UNDERSTAND
   ↓
CORRELATE
   ↓
VERIFY
   ↓
EXPORT
```

But every claim about evidence, integrity, provenance, verification, or export must originate from the backend contract.

**Backend truth > frontend assumptions.**

For backend behavior always consult:

```text
C:\ulpf-sih\ulpf\layaRustparser\crates\ulpf-cli\src\serve\handlers.rs
```

and:

```text
C:\ulpf-sih\ulpf\layaRustparser\docs\CONTRACTS.md
```

For visual implementation always follow the exact theme defined in this document:

```text
Canvas       #F3F3F3
Sidebar      #E2E4E8
Text         #1E293B
Metadata     #64748B
Cards        #FFFFFF
Borders      #E2E8F0
Primary      #1A1D20
Hover        #2E343A
Tech Accent  #0284C7
PASS         #10B981
FAIL         #FF5C5C
UI Font      Inter
Code Font    JetBrains Mono
```
