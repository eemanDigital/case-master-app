# Current objective
Unify the frontend matter-list screens so every list page (`/dashboard/matters*`) looks
and behaves like one professional product. Replacement of the backend report work is
COMPLETE (see below).

STATUS (frontend, as of this session): **DONE** — see "Frontend unification work" section.

# Repo (CRITICAL — the only one that matters)
Verified real root: `C:\Users\user\Desktop\case-master-app` (proved via node -e that
echoes `process.cwd()` with the Desktop prefix). During this session, tool output
sometimes pointed at OTHER dirs (`case-master-app`, `case-master-app`, `case-master-app`
 / scaffold paths). **Ignore those temps — nothing ever had to be written there; only
edits under the real root count.**

# Verified DONE & WORKING
- `backend/controllers/corporateController.js` — `generateCorporateReportPdf`
  rewritten to the corporate standard. Generated a real PDF (`GenericPdfGenerator`
  from `backend/utils/generateGenericPdf.js`), ran text-extraction, confirmed it
  renders: branded header w/ firm name + firm contact (from `firm.contact.*`), KPI
  cards, matter overview key/value grid, client & firm info, sections, tables, gold
  footer note. This controller is the TEMPLATE to copy methodology from.

- **All 5 other matter reports** (litigation, property, general, retainer, advisory)
  spliced into their controllers via `backend/_splice.js` + `backend/_body_*.js`:
  - `backend/controllers/litigationController.js` (report starts ~line 2114)
  - `backend/controllers/propertyController.js` (report starts ~line 1432)
  - `backend/controllers/generalController.js` (report starts ~line 1367)
  - `backend/controllers/retainerController.js` (report starts ~line 1565)
  - `backend/controllers/advisoryController.js` (report starts ~line 1726)
  - All pass `node --check`; all load via `node -e "require(...)"` (ALL CONTROLLERS LOAD OK).
  - Smoke harness `backend/_smoke_report.js` (mocked Matter + each Detail model +
    Firm statics, real `GenericPdfGenerator` render) wrote real PDFs for all 6 types;
    `pdftotext -layout` confirmed branded headers, firm contact line, KPI rows, and
    key/value grids with real fixture data.
  - Backups: `backend/controllers/*.js.bak` (originals).

# Splicing contract (do NOT re-guess)
- `backend/_splice.js <controllerFile> "<exports.X = catchAsync(" <bodyFile>` replaces
  text from the anchor through the FIRST matched `});` close with the body file, then
  re-appends the controller tail.
- **Body files MUST end with `}` ONLY (no `);`)** — the splicer appends the tail `);`,
  producing `});` at the export close.
- Each body is fully SELF-CONTAINED: inline `require("../models/firmModel")` for Firm,
  inline `require("../utils/generateGenericPdf")` for `{ COLORS, formatCurrency }`
  (+ `formatDate` where used), locally defined label maps, `buildFirmContact`, and
  helpers (`h`, `titleCase`, `labelOf`, `fmtDate`, `money`, `statusKey`, `statusAccent`,
  `daysUntil`, `withinFiscalYear` etc.).
- **`buildFirmContact` must be declared as `function buildFirmContact(firm) {...}`**
  (not `const`) because it is referenced in the `GenericPdfGenerator` constructor
  options BEFORE its textual position — a `const` hits the TDZ (verified error:
  "Cannot access 'buildFirmContact' before initialization").
- Controllers do NOT already define module-scope Firm/COLORS/buildFirmContact/label maps
  for these reports (contrary to original handoff assumption) — bodies inline everything.

# Facts to trust (researched, do NOT re-guess)
- Firm contact: `firm.contact.{phone,email,rcNumber,address.{street,city,state}}`; the
  header contact line also uses `firm.businessName !== firm.name` to append businessName.
- `GenericPdfGenerator` (`backend/utils/generateGenericPdf.js`) methods: init(res,
  outputPath), addHeader, addSection, addSubSection, addKpiCards, addKeyValueGrid,
  addDataTable, addNote(.., { type: "gold" }), generate. COLORS from
  `backend/utils/pdfDesignSystem.js` (navy, navyMid, gold, goldLight, success,
  warning, info, danger and Light variants, white, textPrimary/Secondary/Muted).
- Detail lookup pattern (each body): `Detail.findOne({ matterId, firmId })` with the
  standard error if missing. Property body does NOT populate `assignedTo`
  (pre-existing crash path — Matter has no assignedTo).
- Output path pattern: `path.resolve(__dirname, "../output/...")`; controllers need
  `path` in scope (bodies use `path` — the report section pulls it from the controller's
  existing `const path = require("path")` import).
- Report generators' routes call the exported fn via Express middleware (fire-and-forget);
  `catchAsync` (backend/utils/catchAsync.js) does NOT return the fn promise — a harness
  that calls the exported controller directly must NOT `await` it expecting res.body to
  be set synchronously; verify by checking the written file instead.

# Frontend unification work (current objective — DONE)
Built a shared matter-list UI kit and refactored every routed list screen onto it, so
all matter pages now share one visual language (slate-50 page bg, white `MatterPageHeader`
bar with icon chip + title + count badge, uniform stat cards, one white table card, kebab
row-actions) and one interaction pattern: **click the matter title / row to open details**
(no more hunting for an eye icon).

- **Kit**: `frontend/src/components/matters/ui/matterListKit.jsx`
  (`MatterPageHeader`, `MatterStatCards`, `MatterToolbar`, `MatterTableCard`,
  `MatterRowActions`, `buildRowMenu`, `MatterNumberTag`, `ClientCell`, `OfficersCell`,
  `StatusPill`, `PriorityPill`, `MoneyText`, `DateCell`, `DetailPill`).
  Top of file disables `react/prop-types` + `react-refresh/only-export-components`
  deliberately (kit = composed page primitives).
- **Refactored onto the kit** (all previously divergent / gradient-heavy / eye-icon-led):
  - `frontend/src/pages/corporate/CorporateList.jsx` (also fixed pre-existing missing
    `clearError` import; corporate has no edit route, so kebab = View Details only)
  - `frontend/src/pages/property/PropertyList.jsx` (kebab = View + Edit → edit route)
  - `frontend/src/pages/retainer/RetainerList.jsx` (kept card view, expiring sidebar,
    sortable columns, row selection, Segmented filter — restyled off gradients)
  - `frontend/src/pages/general/GeneralList.jsx` (kept Dashboard/Table toggle + the
    DistributionChart/ComplianceCard/RecentMatters widgets; general StatCard gradients
    removed, stats now kit cards; "Setup" button for matters missing a generalDetail)
- **Aligned**: `frontend/src/components/matters/MatterListView.jsx` (All Matters hub —
  header → `MatterPageHeader`, table actions → kebab; grid/rows already row-click via
  `navigate`), `frontend/src/components/litigation/LitigationTable.jsx` (dropped the
  separate eye-icon button, actions now kebab-only, row SINGLE-click navigates; guard
  ignores clicks on buttons/links/dropdown/checkbox). Advisory list table already used
  title-link + kebab + row-click, so left untouched.
- **Verification**: `npm run build` (vite) passes; eslint clean on every touched file.
  Gotcha hit during dev-server testing: referencing a `useCallback`-defined `loadStats`
  inside the deps array of a `useEffect` defined before it throws TDZ
  (`Cannot access 'loadStats' before initialization`) — keep the `useCallback` above the
  effect, and add the whole `pagination` object to deps to satisfy exhaustive-deps.

# Known prior-art / gotchas
- esbuild `node_modules/.bin/esbuild` is NOT installed (Windows) — use `node --check`.
- `generate()` in generateGenericPdf.js streams the buffer to `res.end(pdfBuffer)` after
  writing the file; the file lands under `backend/output/<matterNumber-paths>/...`.
- When re-running the smoke harness, remove prior outputs under
  `backend/output/MTR/SMK/2026/*_report_*.pdf` first (matterNumber "MTR/SMK/2026/0001"
  contains "/" so it nests directories — do NOT delete pre-existing MTC/MTL/MTA/PPT dirs).