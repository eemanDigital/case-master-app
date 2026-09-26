# Current objective
Improve the invoice / billing section UI/UX so creating and editing an invoice is
clear and understandable — especially making **Fixed Fee** billing obvious and
distinguishable from Hourly and the other billing methods, giving the user a live
totals preview, and making it easy to open the created invoice and edit it. This is
the replacement for the previous matter-list unification objective (DONE — see
"Frontend unification work" below).

STATUS: the form refactor (create + edit) is DONE, build + eslint verified — see
"Invoice billing UI/UX work" section.

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

# Invoice billing UI/UX work (current objective — DONE)
Shared kit + both forms refactored so billing methods are visible, explained, and
mutually exclusive, totals preview live, and post-save navigation opens the invoice.

- **Kit**: `frontend/src/components/invoices/ui/invoiceBillingKit.jsx`
  - `BILLING_METHODS` (hourly / fixed_fee / item / retainer / contingency) each with
    icon, color, plain-English description, and the ONLY input fields they use.
    `fixed_fee` is flagged `highlight: true` (gold "billed at a single flat rate" callout)
    so it reads differently from hourly.
  - `ServiceBillingCard` — per-service card: description + `BillingMethodPicker`
    (colored tiles) + description text + conditional fields ONLY for the active method
    + category + date, plus a live per-service "Amount ₦" in the card header and a
    delete affordance.
  - `ExpenseCard` — shared expenses card (description, ₦ amount, category, receipt,
    Reimbursable switch with tooltip, date).
  - `InvoiceSummary` — live totals using `Form.useWatch([], form)` (empty path = whole
    form — verified in rc-field-form source) mirroring the backend formulas exactly:
    `computeServiceAmount` (matches `invoiceModel.pre("save")`) and
    `computeInvoiceTotals` (services+expenses, discount only on currentCharges, tax on
    discounted, + previousBalance).
  - Shared `nairaFormatter`/`nairaParser`/`formatNaira`, `SERVICE_CATEGORY_OPTIONS`,
    `EXPENSE_CATEGORY_OPTIONS`, `BILLING_METHOD_SELECT_OPTIONS`.
  - Shared client-scoping helpers `matterClientId(matter)` + `filterMattersByClient(options,
    clientId)` — used to narrow the "Select Matter" dropdown to only the SELECTED client's
    matters. Rationale: matter list responses populate `client` with `{_id, firstName,
    lastName, email, phone}` (see `backend/config/modelConfigs.js` `Matter.defaultPopulate`),
    so each `mattersOptions[i].matter.client` carries the owner; filtering is done client-side
    (instant, no global-Redux side effects). `matterClientId` accepts either the populated
    object or a raw id string/ref.
  - File header disables `react/prop-types` + `react-refresh/only-export-components`
    (same convention as the matter kit).
- **`frontend/src/components/CreateInvoiceForm.jsx`** (rewritten):
  - Form `initialValues` now seeds ONE service row (defaults to "hourly") + one expense
    row, so the form is not empty on load (previously it started with zero rows until
    you hit "+ Add").
  - Client field moved first; specific per-field validation messages + tooltips;
    `linkType`/`publishOnSave`/`discountType` read via `Form.useWatch` (no more
    useState duplication).
  - "How will this service be billed?" tiles replace the flat dropdown; helper text on
    the section explains Fixed Fee vs Hourly.
  - **Discount & Tax** is now conditional: choosing "Percentage (%)" shows a `%` input
    (`addonAfter="%"`), "Fixed Amount (₦)" shows a ₦ input, "No Discount" shows a
    disabled placeholder — previously the amount was always formatted as ₦ even for
    percentages.
  - **Publishing** is now an explicit `Segmented` "Save as Draft / Save & Publish"
    (replacing the ambiguous switch); explanatory text under it.
  - Dead `formData`/`invoiceInitialValue` state removed; expense/service numeric values
    normalized (""/null → 0, quantity → 1) before submit.
  - **Post-save navigation** → `/dashboard/billings/invoices/{createdId}/details`
    (from `data._id`; falls back to list). Details page already has "Edit Invoice".
  - **Root cause of "Save & Publish does nothing"**: `useHandleSubmit`'s `onSubmit`
    is declared with NO parameters (`useHandleSubmit.jsx:25`) — it re-validates and
    posts the RAW form store, IGNORING any transformed payload passed to it. So the
    create form's `finalValues` (which set `status:"sent"`/`issueDate` for publish)
    were silently discarded and invoices always saved as `draft`. `CreateInvoiceForm`
    no longer uses the hook for submission: it builds its own `useDataFetch()` and
    posts `finalValues` directly (then `notify`, `fetchData("invoices")`,
    `form.resetFields()`, navigate). `UpdateInvoice` still relies on the hook (its
    `status` is a real form field, so that path submits correctly).
  - Regression test: `frontend/src/tests/segmentedPublish.regression.test.jsx`
    (isolated `Segmented`-in-`Form.Item` driven by `Form.useWatch`) — proves the
    toggle writes to the form store. NOTE: vitest.config.js has no react plugin, so
    test JSX needs `import React` (classic runtime); the file-level
    `eslint-disable no-unused-vars` silences the resulting unused-import warning.
  - **Client-scoped matter picker** (create): watch `client` via `Form.useWatch
    ("client", form)`; matter Select is `disabled` until a client is picked, then shows
    ONLY that client's active matters (`filterMattersByClient`) with a live count hint and
    a "No active matters for this client" empty state; changing/clearing the client clears
    a previously selected `matter` so the link can never point at another client's matter.
- **`frontend/src/pages/UpdateInvoice.jsx`** (rewritten):
  - Same `ServiceBillingCard` + `ExpenseCard` + conditional discount + `InvoiceSummary`
    + **client-scoped matter picker** (identical `filterMattersByClient` behavior; the
    preset client from `setFieldsValue` does NOT trigger the Select onChange, so a
    pre-existing matter link survives initial load).
  - **Fixed a latent bug**: `const { ..., data } = useInitialDataFetcher(...)` never had
    `data` (that hook returns only `{formData, loading}`), so after a successful PATCH
    the render-time `if (data) return navigate("invoices")` NEVER fired and the form just
    stayed put. Now `data` comes from `useHandleSubmit` and an effect navigates to
    `/dashboard/billings/invoices/{id}/details` on `data.success`.
  - Non-editable status alert (`paid`/`cancelled`/`void` → warning Alert + disabled
    Update button); backend also blocks those in `updateInvoice`.
- **Unchanged intentionally**: `InvoiceList.jsx` / `InvoiceDetails.jsx` (their existing
  Edit links are correct under React Router v6 route-relative `..` semantics); the
  retainer `BillingForm.jsx`; the backend.
- **`InvoiceDetails.jsx` cleanup**: duplicate "Payment History" card removed (the
  SECOND one, without the per-row "Receipt" download button, was deleted — the first,
  with receipt download, is kept; its unused `(payment, index)` map param dropped).
  Also fixed a stray `/>` after `</Suspense>` inside the Record Payment `Modal`
  (line ~318 — invalid JSX that eslint's parser rejected) and removed never-used
  `MoreOutlined`/`DocumentArrowDownIcon` imports.
- **Verification**: `npm run build` passes; `npx eslint` clean on all three files.
  Gotchas while building: duplicate `const newExpense` from a mis-merged edit (SyntaxError —
  fixed by removing the dup); keep per-service field names identical to the schema
  (`hourly`→`hours`+`rate`, `fixed_fee`→`fixedAmount`, `item`→`quantity`+`unitPrice`,
  `retainer`/`contingency`→`fixedAmount`) so `invoiceModel.pre("save")` computes as before.

# Staff/client directory + leave balance polish (this session)
- **Row-click navigation** on `UserListTable.jsx`: whole table row is now clickable and
  navigates to `/dashboard/{staff|clients}/:id/details` (the Name column was already a
  link). Clicks on `a,button,input,select,textarea` are ignored, so the delete button
  and name link still behave. Note: `prop-types` NOT installed → UserListTable carries a
  top-of-file `eslint-disable react/prop-types` (repo convention). Also removed pre-existing
  lint cruft in `ClientLists.jsx`/`StaffList.jsx` (unused `React`, `ButtonWithIcon`,
  `totalPages`, `paginationData`).
- **`LeaveBalanceDisplay.jsx` redesigned** (shown inside `StaffDetails`, staff
  `/staff/:id/details`) from colorful `border-l-4` Statistic cards to the app's mature
  language: rounded-2xl white card, indigo icon-chip header, an indigo→slate gradient
  "Total Available Leave" summary banner with gold "Year" tag, 6 neutral per-type tiles
  (uppercase label + tinted icon chip + value + muted "days"), and a slate-50 footer
  strip for Year / Last Updated / Created. Data contract unchanged
  (`GET leaves/balances/:userId`); loading now shows a `Skeleton` grid instead of a
  full-page spinner. Icons verified against installed `@ant-design/icons` (e.g.
  `CalendarCheckOutlined` does NOT exist here → used `ScheduleOutlined`).
- Lint clean on all touched files; `npm run build` passes.

# Leave management access + approving authority (this session)
Per user spec: "only HR or Super-admin should see approve leaves; remove the leave app
list page and balance for others; in the user profile add an Apply-for-Leave button for
whoever has leave balance; the approving authority should be HR / super-admin."
- **New route guard** `ShowHRAdminRoute` in `frontend/src/components/protect/Protect.jsx`
  (hr role OR adminLevel admin/super-admin; "Access Denied" Alert otherwise). Wrapped the
  two management routes in `App.jsx`: `staff/leave-application` (LeaveApplicationList) and
  `staff/leave-balance` (LeaveBalanceList). The standalone `leave-application` route
  (renders LeaveAppForm) and the details route are unchanged (self-service/details).
- **Sidebar + search**: `SideBar.jsx` now only renders the Staff → Leave submenu
  (Applications/Balance) when `isAdminOrHr`; `DashboardLayout.jsx` search entries for
  Leave Applications/Balance are likewise conditionally included. `LeaveNotification`
  was already hr/admin-gated.
- **Approving authority fix (root cause)**: `LeaveAppForm.jsx` used
  `useUserSelectOptions()` defaulting to `type="staff"` (userType staff/lawyer/admin/
  super-admin — empty under the new role+adminLevel model), and emails were sent to the
  raw `_id`. Now it uses `useUserSelectOptions({ fetchAll: true })` and builds
  `approvingAuthorityOptions = [...admins, ...hr]` deduped by `value` (admins includes
  super-admins; labels include `- Position`). `applyTo` stores the authority display
  label (the model's String field is literally "Authority name"); new `applyToId` field
  holds the user `_id`; notification `send_to` now uses the selected approver's `email`.
- **Backend enforcement** (`backend/controllers/leaveAppController.js`): on create,
  `applyToId` (if provided) must resolve to an ACTIVE, non-deleted user of the SAME firm
  who is `role === "hr"` or `isAdmin()`; otherwise 400 "Selected approving authority is
  not an active HR or administrator for this firm". Approve/reject and balance writes
  were already `restrictTo("super-admin","admin","hr")`, and `restrictTo` maps admin→
  `user.isAdmin()` / super-admin→`isSuperAdmin()` / else `role===`.
- **Profile Apply button**: `LeaveBalanceDisplay.jsx` gained a `canApply` prop; when true
  AND a balance exists it renders `<LeaveAppForm />` in its header. `StaffDetails.jsx`
  passes `canApply={isCurrentUser}` so only the logged-in user can apply for their own
  leave (LeaveAppForm submits as `user.data._id`). LeaveAppForm trigger button is now
  prop-driven (`buttonText`/`buttonClassName`/`buttonSize`) + PropTypes.
- Note: regular staff can no longer see a "My Applications" list (per spec). Follow-up if
  wanted later: a self-service "My leave" list inside the profile.
- **Profile.jsx Apply button (follow-up)**: the *own-profile* page at `/dashboard/profile`
  uses `LeaveSummaryCard`, not `LeaveBalanceDisplay`, so the earlier `canApply` wiring on
  `StaffDetails` never surfaced here. Fixed inside `LeaveSummaryCard.jsx`: new
  `showApplyButton` prop renders `<LeaveAppForm />` in the Card `extra` whenever a summary
  (i.e. a leave balance) exists, with `onSuccess={fetchSummary}` to refresh the counts.
  `Profile.jsx` passes `showApplyButton` (card is already non-client-gated). Also removed
  leftover debris in Profile.jsx: `console.log(user)`, unused icons, unescaped apostrophe.
- Lint clean on all touched files + `npm run build` passes; `node --check` on backend.

# Known prior-art / gotchas
- esbuild `node_modules/.bin/esbuild` is NOT installed (Windows) — use `node --check`.
- `generate()` in generateGenericPdf.js streams the buffer to `res.end(pdfBuffer)` after
  writing the file; the file lands under `backend/output/<matterNumber-paths>/...`.
- When re-running the smoke harness, remove prior outputs under
  `backend/output/MTR/SMK/2026/*_report_*.pdf` first (matterNumber "MTR/SMK/2026/0001"
  contains "/" so it nests directories — do NOT delete pre-existing MTC/MTL/MTA/PPT dirs).