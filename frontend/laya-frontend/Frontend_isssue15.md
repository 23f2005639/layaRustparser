# Agent Instructions --- Issue #15: Parser & Integrity Management

## 1. Objective

Implement the complete frontend for **Issue #15: Parser & Integrity
Management** in the existing ULPF frontend.

Repository: - `ShantanuPaliwal2419/layaRustparser` - Frontend:
`frontend/laya-frontend`

This task adds three management pages and their sidebar entries:

1.  **Parser Registry & Onboarding Wizard**
2.  **Cryptographic Integrity & Isolated Tamper Drill**
3.  **System Settings & Diagnostics Scorecard**

This is an extension of the existing #13/#14 frontend. Do not rebuild or
redesign the application.

------------------------------------------------------------------------

# 2. IMPORTANT: Backend Must Be Checked Before Frontend Implementation

Before implementing the frontend, inspect BOTH of these backend sources
in the repository:

-   `CONTRACTS.md`
-   the relevant backend `handler.rs`

Do not rely only on the frontend issue description.

The backend implementation in `handler.rs` must be checked against
`CONTRACTS.md` for the actual:

-   endpoint paths
-   HTTP methods
-   request bodies
-   response shapes
-   status codes
-   validation behavior
-   error responses
-   LIVE behavior
-   side effects
-   tamper-drill safety behavior
-   parser onboarding behavior
-   system payload

If `CONTRACTS.md` and `handler.rs` differ:

1.  Do not silently guess.
2.  Identify the actual implemented behavior.
3.  Prefer the real backend implementation for what the frontend must
    safely handle.
4.  Preserve the documented contract where possible.
5.  Do not invent an endpoint simply because the UI design seems to
    require it.
6.  Mention any contract/implementation mismatch in the final report.

Also inspect the existing frontend API layer and the already implemented
#13/#14 pages before changing anything.

------------------------------------------------------------------------

# 3. Existing Design Is the Source of Truth

Find and read the repository's existing `design.md` before implementing
UI.

The Issue #15 pages must follow the existing Issue #14 visual design
specification supplied for this project.

Do NOT invent a new visual language.

## Design System

### Canvas

-   Base: `#F3F3F3`

### Sidebar

-   Fill: `#E2E4E8`
-   Text: `#1E293B`
-   Active indicator/accent: `#0284C7`

### Cards / Containers

-   Fill: `#FFFFFF`
-   Border: `#E2E8F0`

### Primary buttons / dark actions

-   Base: `#1A1D20`
-   Hover: `#2E343A`

### Primary tech accent

-   `#0284C7`

Use this for: - interactive controls - proof/audit paths - active tabs -
input focus rings - relevant technical indicators

### Telemetry / integrity statuses

-   PASS / verified: `#10B981`
-   FAIL / tampering: `#FF5C5C`

### Typography

-   UI headings/labels: `#1E293B`
-   Metadata: `#64748B`
-   Inter for UI
-   JetBrains Mono for:
    -   Merkle roots
    -   block IDs
    -   hashes
    -   audit paths
    -   other cryptographic identifiers

Reuse existing font/configuration if already implemented.

------------------------------------------------------------------------

# 4. Required Sidebar

Add the Issue #15 pages to the EXISTING sidebar.

Do not replace the sidebar.

Required navigation entries:

-   **Parsers**
-   **Vault**
-   **Health**

Use the project's existing icon/navigation conventions.

The designs supplied for this issue use:

-   Parsers → `/parsers-norm`
-   Vault → `/crypto-vault`
-   Health → `/system-health`

If the repository already has an established route naming convention
that conflicts with these names, inspect the existing routing structure
first and use a consistent route while preserving these three page
concepts.

Sidebar requirements:

-   all three entries visible;
-   active entry highlighted using the existing active-state design;
-   navigation works;
-   existing Dashboard/Threat/Alerts/Query/etc. navigation continues
    working;
-   no duplicated sidebar implementation;
-   no broken active-state behavior.

------------------------------------------------------------------------

# 5. Page 1 --- Parser Registry & Onboarding Wizard

Suggested route:

`/parsers-norm`

Purpose: - display registered parsers; - test a parser against a raw
log; - onboard a new parser through preview → confirmation → hot-load.

------------------------------------------------------------------------

## 5.1 Active Parsers Table

API:

`GET /parsers`

The contract defines fields including:

``` text
vendor
device_model
parser_type
status
confidence_score
```

Display:

``` text
Vendor
Device Model
Type
Status
Confidence
```

Example design:

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔄 Dynamic Parser Registry & Onboarding Wizard                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Active Parsers Table                                                     │
│                                                                          │
│ Vendor      Device Model       Type               Status    Confidence   │
│ ─────────   ─────────────────  ─────────────────  ───────   ──────────  │
│ cisco_asa   ASA 5500-X         native_extractor   active       100%      │
│ fortigate   FortiGate NGFW     native_extractor   active       100%      │
└──────────────────────────────────────────────────────────────────────────┘
```

Use: - white card; - subtle border; - existing table design; - readable
status badge; - confidence shown as percentage; - metadata typography
consistent with existing UI.

Do not fabricate parser fields not supplied by the API.

------------------------------------------------------------------------

# 6. Parser Test Interface

API:

`POST /parsers/test`

Purpose: dry-run a raw log against an existing parser without modifying
disk.

Request shape from the contract is approximately:

``` json
{
  "raw_log": "...",
  "vendor": "cisco_asa"
}
```

UI should allow:

-   vendor input/selection;
-   raw log input;
-   submit/test action.

Display the response where available:

-   matched;
-   vendor;
-   parsed OCSF;
-   parse duration;
-   raw hash;
-   protocol detected;
-   notes.

The API contract explicitly describes this as read-only/dry-run.

Do not claim that this operation modifies or persists a parser.

Handle:

-   loading;
-   success;
-   no match;
-   validation errors;
-   4xx;
-   5xx;
-   offline;
-   mock mode.

------------------------------------------------------------------------

# 7. Parser Onboarding Wizard

API:

`POST /onboard`

The frontend must NOT generate the parser regex itself.

The backend synthesizes the parser from sample lines.

------------------------------------------------------------------------

## 7.1 Input

Collect:

-   Vendor Slug
-   Device Model
-   3--5 sample raw log lines

Example:

``` text
Vendor Slug:
[ juniper_srx ]

Device Model:
[ srx-340 ]

Sample Raw Log Lines:
┌──────────────────────────────────────────────────────────────────────────┐
│ RT_FLOW: session created 192.168.10.55/49152->10.0.0.1/443...            │
│ ...                                                                      │
│ ...                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

Validate the required number of sample lines according to the backend
contract/handler behavior.

------------------------------------------------------------------------

## 7.2 Preview

First call:

``` json
{
  "vendor": "...",
  "device_model": "...",
  "sample_lines": ["...", "...", "..."],
  "confirm": false
}
```

Preview must NOT be treated as persistence.

Display:

-   onboarding validation result;
-   match percentage;
-   generated regex;
-   action mappings;
-   confidence score;
-   validation errors;
-   passed/failed status;
-   backend message.

Example:

``` text
Onboarding Validation Result

Match: 100.0%

Generated Regex:
^RT_FLOW:\s+(?P<event_type>\S+)...

Action Mappings:
created → Allowed
denied  → Blocked

Confidence:
100%

Validation:
3 / 3 samples matched
```

Use monospace styling for regex and other technical output.

------------------------------------------------------------------------

## 7.3 Explicit Confirmation

Never automatically execute `confirm=true`.

The user must explicitly confirm.

Confirmation should clearly explain that this action will
persist/hot-load the parser according to backend behavior.

Example action:

``` text
[ 💾 Confirm & Hot-Load to Disk ]
```

Use a confirmation modal if consistent with the existing application.

------------------------------------------------------------------------

## 7.4 Hot Load

Call:

``` json
{
  "vendor": "...",
  "device_model": "...",
  "sample_lines": ["...", "...", "..."],
  "confirm": true
}
```

Handle the backend's actual success response from `handler.rs`.

The contract describes the successful response as:

``` text
status: hot_loaded
persisted: true
vendor
device_model
json_path
yaml_path
message
```

After successful hot-load:

-   show success state;
-   display persistence paths when supplied;
-   refresh the parser registry;
-   make it clear that the parser is now hot-loaded/persisted.

Do not claim success if the backend request failed.

------------------------------------------------------------------------

# 8. Parser Enable / Disable

Do not invent an enable/disable API.

The supplied contract defines `GET /parsers`, but does not define a
parser-toggle endpoint.

Before implementing any enable/disable control:

1.  inspect `handler.rs`;
2.  inspect existing backend routes;
3.  inspect the existing frontend API layer.

If no real endpoint exists:

-   display current parser status;
-   do not create fake persistence;
-   do not send unsupported requests.

If the backend already contains a valid route, use that actual route and
document it.

------------------------------------------------------------------------

# 9. Page 2 --- Cryptographic Integrity & Isolated Tamper Drill

Suggested route:

`/crypto-vault`

Purpose: - ledger/block viewer; - cryptographic proof workflow; - safe
tamper simulation.

Use the existing #14 block/evidence components wherever practical.

------------------------------------------------------------------------

# 10. Archived Parquet Blocks & Ledger Viewer

API:

`GET /blocks`

Display:

``` text
Block ID
Leaf Count
Master Merkle Root Hash
Status
Actions
```

The backend contract defines fields including:

``` text
block_id
timestamp
leaf_count
merkle_root
parquet_file
status
size_bytes
file_exists
```

Statuses:

-   `PASS`
-   `FAIL`
-   `FILE_MISSING`
-   `UNAUDITED`

Example design:

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔐 Cryptographic Integrity & Ledger Viewer                               │
├──────────────────────────────────────────────────────────────────────────┤
│ Archived Parquet Blocks & Ledger Anchors                                  │
│                                                                          │
│ Block ID │ Leaf Count │ Master Merkle Root Hash      │ Status │ Actions   │
│ #00000   │ 1,000      │ e12dfacf15b6...             │ FAIL   │ [Proof]   │
│ #00001   │ 1,000      │ 398e59a6304e...             │ PASS   │ [Proof]   │
└──────────────────────────────────────────────────────────────────────────┘
```

Merkle roots and block IDs should use JetBrains Mono.

PASS should use the existing emerald integrity styling.

FAIL should use the existing coral/red styling.

------------------------------------------------------------------------

# 11. Merkle Proof

API:

`GET /prove/:block/:leaf?live=true`

The contract says:

-   default proof request can return `501`;
-   `live=true` performs the live RFC 6962 proof calculation;
-   live response contains:
    -   block_id
    -   leaf_index
    -   tree_size
    -   leaf_hash
    -   calculated_merkle_root
    -   ledger_merkle_root
    -   verified
    -   audit_path
    -   standard

The proof UI should display these clearly.

Audit paths should use monospace formatting and the primary cyan accent
where appropriate.

------------------------------------------------------------------------

## 11.1 501 Handling

The default endpoint may return:

`501 Not Implemented`

Handle this explicitly.

Do NOT show:

``` text
Verified
```

when the backend returned 501.

Instead show an informative state explaining that live proof computation
requires the supported `?live=true` flow.

Do not invent another endpoint.

------------------------------------------------------------------------

# 12. Tamper Drill

API:

`POST /tamper/drill`

Request:

``` json
{
  "block_id": 1,
  "leaf_index": 0,
  "spoofed_ip": "10.99.99.99",
  "confirm": true
}
```

The UI should provide:

-   target block;
-   leaf index;
-   spoofed IP;
-   explicit confirmation;
-   safety explanation.

Design:

``` text
⚠️ Safe Adversarial Simulation

Target Block:
[#00001]

Leaf Index:
[0]

Spoofed IP:
[10.99.99.99]

┌──────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Evidence Protection                                                   │
│                                                                          │
│ Real evidence in data/parquet/ is NEVER modified.                       │
│ The backend clones the block to data/scratch/ before injecting damage.  │
└──────────────────────────────────────────────────────────────────────────┘

[ 🔴 Simulate Tamper Drill ]
```

The final action MUST open a confirmation step/modal.

Do not execute automatically.

------------------------------------------------------------------------

# 13. Tamper Drill Result

Display the backend response fields where supplied:

-   status;
-   executed;
-   target block ID;
-   target leaf index;
-   spoofed IP;
-   source evidence path;
-   scratch drill path;
-   original evidence unmodified;
-   message.

The contract explicitly states that real evidence is never modified and
the target is cloned into the scratch directory.

The UI must preserve this distinction.

Example:

``` text
Drill Result

Tamper Detected on Scratch Copy

Original Evidence:
100% UNMODIFIED

Source:
data/parquet/block_00001.parquet

Scratch:
data/scratch/tamper_drill_block_00001.parquet
```

Do not tell the user that production/real evidence was corrupted.

------------------------------------------------------------------------

# 14. Page 3 --- System Settings & Diagnostics Scorecard

Suggested route:

`/system-health`

API:

`GET /system`

Purpose: display system configuration, queue status, parser count,
archive count, and diagnostic information.

------------------------------------------------------------------------

# 15. System Page Layout

Use the supplied Issue #14 design direction:

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚡ System Settings & Diagnostics Scorecard                               │
├──────────────────────────────┬───────────────────────────────────────────┤
│ ⚙️ Engine & Batcher          │ 📊 RingBuffer Queue & Status              │
│ Thresholds                   │                                           │
│                              │                                           │
│ Service: ULPF Air-Gapped     │ Queue Depth: 0 / 50,000                  │
│ Air-Gapped: true             │ Dynamic Parsers: 2 Loaded                │
│ Max Batch Size: 1,000        │ Archived Blocks: 25 Sealed               │
│ Flush Timeout: 2,000 ms      │ Uptime: 3,600 secs                      │
│ Storage: WORM Parquet        │ Queue/health data from backend            │
│ Compression: Snappy          │                                           │
├──────────────────────────────┴───────────────────────────────────────────┤
│ System Status Payload: [🟢 200 OK - Fully Operational]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

Use the ACTUAL response from the backend.

The contract's `/system` response includes:

``` text
service_name
version
air_gapped
uptime_secs
batcher.max_batch_size
batcher.max_batch_duration_ms
batcher.storage_dir
batcher.ledger_path
batcher.compression
ingest_queue_capacity
ingest_queue_depth
dynamic_parsers_loaded
total_archived_blocks
```

Do not fabricate fields.

For example, if the backend does not provide a "loss rate", do not
invent a loss-rate value just because the visual mockup shows one.

------------------------------------------------------------------------

# 16. Benchmark / Scorecard Requirement

Inspect both:

-   `CONTRACTS.md`
-   `handler.rs`

for benchmark/diagnostic data.

If the backend actually returns benchmark fields, display them.

If `GET /system` does not return a benchmark metric, do not fabricate
it.

If an existing repository artifact or supported endpoint provides
benchmark JSON, inspect and use it.

Do not invent:

-   benchmark values;
-   loss rates;
-   health percentages;
-   performance scores.

------------------------------------------------------------------------

# 17. API Architecture

Reuse the existing API abstraction used by #13/#14.

Do not scatter direct `fetch()` implementations throughout every
component.

Add Issue #15 types and API functions to the existing API/type
architecture.

Potential types:

``` text
Parser
ParserTestResponse
OnboardPreviewResponse
OnboardHotLoadedResponse
TamperDrillResponse
SystemResponse
```

Use actual backend shapes from `CONTRACTS.md` and `handler.rs`.

Do not duplicate existing types.

------------------------------------------------------------------------

# 18. MOCK / LIVE / OFFLINE --- CRITICAL REQUIREMENT

This behavior is mandatory.

The existing application already supports backend modes/statuses:

-   LIVE
-   MOCK
-   OFFLINE

Issue #15 MUST use the same infrastructure.

Do not create a separate mode system.

------------------------------------------------------------------------

## 18.1 LIVE Mode

When backend is running and mode is LIVE:

-   use real backend API responses;
-   `/parsers` → real parser list;
-   `/parsers/test` → real dry-run;
-   `/onboard` → real backend;
-   `/blocks` → real blocks;
-   `/prove` → real proof;
-   `/tamper/drill` → real backend;
-   `/system` → real system payload.

The UI status must correctly indicate LIVE.

------------------------------------------------------------------------

# 19. MOCK Mode --- MUST Replace Live Data

When the user switches from LIVE to MOCK:

**the Issue #15 page must replace the currently displayed LIVE data with
the specific Issue #15 mock data.**

Do not leave old LIVE data on screen.

Do not merely change a badge from LIVE to MOCK.

The actual dataset must change.

Relevant fixtures:

``` text
data/fixtures/api/parsers.json
data/fixtures/api/parsers_test.json
data/fixtures/api/onboard_preview.json
data/fixtures/api/system.json
```

For block/proof/tamper UI, reuse the existing #14 mock
fixtures/infrastructure where appropriate.

POST operations in MOCK mode must follow the existing mock behavior used
by #13/#14.

Do not accidentally send real destructive/backend requests when the
application is explicitly in MOCK mode.

------------------------------------------------------------------------

# 20. OFFLINE Mode

When the backend is unavailable:

-   status must become OFFLINE;
-   the UI must not claim LIVE;
-   operations requiring the backend must show an appropriate offline
    state;
-   follow the established offline behavior from #13/#14.

If the existing application preserves stale data while offline, preserve
that behavior, but clearly mark the application as OFFLINE.

Do not silently convert OFFLINE into MOCK.

------------------------------------------------------------------------

# 21. Mode Transition Testing

This is a required acceptance criterion.

## LIVE → MOCK

1.  Start backend.
2.  Open an Issue #15 page.
3.  Confirm LIVE data appears.
4.  Switch to MOCK.
5.  Confirm MOCK status appears.
6.  Confirm the displayed data changes to the corresponding mock
    fixture.
7.  Confirm the previous LIVE data is not still displayed as if it were
    mock data.

## MOCK → LIVE

1.  Switch to MOCK.
2.  Confirm mock data appears.
3.  Start backend if necessary.
4.  Switch to LIVE.
5.  Confirm fresh backend data replaces mock data.

## LIVE → OFFLINE

1.  Start backend.
2.  Confirm LIVE data.
3.  Stop backend.
4.  Confirm OFFLINE.
5.  Confirm the page follows existing offline behavior.
6.  Confirm it does not claim LIVE.

## OFFLINE → LIVE

1.  Stop backend.
2.  Confirm OFFLINE.
3.  Start backend.
4.  Confirm recovery.
5.  Confirm fresh LIVE data replaces stale/offline data.

Test these transitions on the Issue #15 pages, not only on #13/#14.

------------------------------------------------------------------------

# 22. Avoid Stale Mode Data

When the backend mode changes, prevent a previous mode's response from
overwriting the current mode.

Example:

``` text
LIVE response arrives
↓
user switches to MOCK
↓
MOCK data should become authoritative
↓
late LIVE response must NOT replace it
```

Use the existing request/status architecture where possible.

Do not introduce unnecessary duplicate requests.

------------------------------------------------------------------------

# 23. Design Fidelity

The implementation should visually resemble the supplied Issue #14
design.

Use:

-   `#F3F3F3` page canvas;
-   `#E2E4E8` sidebar;
-   `#FFFFFF` cards;
-   `#E2E8F0` borders;
-   `#1A1D20` primary dark actions;
-   `#0284C7` technical accent;
-   `#10B981` PASS/verified;
-   `#FF5C5C` FAIL/tamper;
-   `#1E293B` headings;
-   `#64748B` metadata;
-   Inter;
-   JetBrains Mono for cryptographic data.

Do not make the pages visually heavier than the existing application.

------------------------------------------------------------------------

# 24. Responsive / Usability Requirements

Ensure:

-   tables do not overflow destructively;
-   hashes remain readable;
-   long regexes/logs are scrollable;
-   technical content uses monospace;
-   buttons have clear states;
-   loading states are visible;
-   errors are visible;
-   destructive/sensitive operations require confirmation;
-   forms have labels;
-   keyboard interaction remains usable.

------------------------------------------------------------------------

# 25. Error Handling

The contract defines a common non-2xx error shape:

``` json
{
  "error": "Error Category",
  "code": 404,
  "message": "Human readable explanation of the failure."
}
```

Handle relevant statuses such as:

-   `400`
-   `404`
-   `422`
-   `501`
-   `500`

Do not expose an unhandled JSON dump as the only UI.

Use readable error states consistent with the existing application.

------------------------------------------------------------------------

# 26. No Unsupported API Inventing

Before adding any API call:

1.  verify it exists in `CONTRACTS.md`;
2.  verify it exists/works in `handler.rs`;
3.  verify request/response shape;
4.  implement it through the existing API layer.

If the UI design requests functionality for which there is no backend
support:

-   do not fake it;
-   do not create a made-up endpoint;
-   either reuse a supported existing operation or document the gap.

------------------------------------------------------------------------

# 27. Do Not Break Existing Issues

After implementing Issue #15, verify that these still work:

-   #13 Analyst Dashboard
-   #14 Investigation
-   #14 Query Explorer
-   block selection;
-   records;
-   proof/export flows;
-   LIVE/MOCK/OFFLINE mode behavior;
-   sidebar navigation.

Avoid unrelated refactors.

------------------------------------------------------------------------

# 28. Testing --- MANDATORY

Do not say the task is complete just because the code was written.

You MUST test the implementation.

## 28.1 Static Checks

Inspect `package.json` and run the project's actual validation scripts.

At minimum, where available:

``` bash
npm run lint
npm run build
```

Also run type checking if the project exposes a separate typecheck
command.

Fix errors caused by your changes.

------------------------------------------------------------------------

# 29. Browser Functional Testing

Run the frontend and test all three Issue #15 pages.

## Parser Registry

Test:

-   page opens;
-   sidebar navigation works;
-   parser list loads;
-   parser statuses display;
-   confidence displays;
-   parser test form works;
-   parser test response renders;
-   onboarding accepts required inputs;
-   preview request works;
-   preview response renders;
-   generated regex is readable;
-   validation result renders;
-   confirmation is required;
-   hot-load request works when backend is available;
-   registry refreshes after successful onboarding.

## Integrity

Test:

-   page opens;
-   blocks load;
-   Merkle roots display;
-   statuses display;
-   proof action works;
-   501 is handled;
-   live proof works when backend supports it;
-   audit path renders;
-   tamper drill form works;
-   confirmation modal appears;
-   drill result renders;
-   original-evidence-unmodified state is visible.

## System

Test:

-   page opens;
-   system API loads;
-   cards render;
-   queue depth/capacity render;
-   parser count renders;
-   archive count renders;
-   batch settings render;
-   air-gapped state renders;
-   uptime renders;
-   backend errors render correctly.

------------------------------------------------------------------------

# 30. Network Verification

Use the browser Network tab where practical.

Verify:

### LIVE

Requests go to the backend.

### MOCK

Issue #15 pages use mock data and do not accidentally continue relying
on the LIVE response.

### OFFLINE

The UI correctly transitions to offline behavior.

### Mode changes

Verify data replacement actually happens.

Also check that the implementation does not create obvious duplicate API
requests during mode changes or ordinary page loading.

------------------------------------------------------------------------

# 31. Backend Verification

Before completion, test the frontend against the actual backend wherever
possible.

Use the repository's documented backend startup command and inspect
`handler.rs`.

At minimum verify:

``` text
GET /parsers
POST /parsers/test
POST /onboard
GET /blocks
GET /prove/:block/:leaf?live=true
POST /tamper/drill
GET /system
```

Verify actual response behavior, not just the mock fixtures.

If an endpoint cannot be tested because the backend cannot be started,
explicitly state that.

Do NOT claim the endpoint passed testing if it was not actually tested.

------------------------------------------------------------------------

# 32. Final Completion Checklist

Before declaring Issue #15 complete:

-   [ ] `CONTRACTS.md` inspected.
-   [ ] Relevant backend `handler.rs` inspected.
-   [ ] Any contract/handler mismatch identified.
-   [ ] Existing `design.md` inspected.
-   [ ] Existing #13/#14 pages inspected.
-   [ ] Parser Registry page implemented.
-   [ ] Integrity/Vault page implemented.
-   [ ] System/Health page implemented.
-   [ ] All three pages added to sidebar.
-   [ ] Sidebar active state works.
-   [ ] `GET /parsers` integrated.
-   [ ] `POST /parsers/test` integrated.
-   [ ] `POST /onboard` preview integrated.
-   [ ] `confirm=true` requires explicit confirmation.
-   [ ] Parser registry refreshes after successful onboarding.
-   [ ] No fake enable/disable API implemented.
-   [ ] `GET /blocks` integrated/reused.
-   [ ] Merkle proof flow integrated.
-   [ ] `501` proof response handled.
-   [ ] `?live=true` proof flow tested where available.
-   [ ] Tamper drill requires confirmation.
-   [ ] Tamper drill safety explanation shown.
-   [ ] `GET /system` integrated.
-   [ ] No unsupported benchmark values fabricated.
-   [ ] LIVE mode tested.
-   [ ] MOCK mode tested.
-   [ ] OFFLINE mode tested.
-   [ ] LIVE → MOCK tested.
-   [ ] MOCK → LIVE tested.
-   [ ] LIVE → OFFLINE tested.
-   [ ] OFFLINE → LIVE tested.
-   [ ] MOCK data actually replaces LIVE data.
-   [ ] OFFLINE state is not mislabeled as LIVE.
-   [ ] Existing #13/#14 behavior still works.
-   [ ] Lint passes.
-   [ ] Build passes.
-   [ ] Browser functional testing completed.
-   [ ] Network behavior checked.
-   [ ] Backend endpoints checked where possible.
-   [ ] No unrelated changes introduced.

------------------------------------------------------------------------

# 33. Final Response Requirement

Only declare the task complete after testing.

The final response from the coding agent must report:

1.  Pages implemented.
2.  Sidebar changes.
3.  API endpoints integrated.
4.  Important backend behavior discovered from `handler.rs`.
5.  Any contract/handler mismatch.
6.  Files/components changed.
7.  Validation commands run.
8.  Browser tests performed.
9.  LIVE results.
10. MOCK results.
11. OFFLINE results.
12. Mode-transition results.
13. Any limitation that could not be tested.

If something was not tested, say so explicitly.

Never claim "tested" or "working" based only on static code inspection.
