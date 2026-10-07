# grants-lifecycle-app — CAP Application Specification

> **Guidelines**: Read [../guidelines.md](../guidelines.md) before executing ANY tasks below.

## Asset Details
- **Asset name**: `grants-lifecycle-app`
- **Asset type**: CAP Application (Node.js) + React UI (SAP UI5 Web Components)
- **Feature**: Grants lifecycle management — applicant portal, admin console, compliance dashboard

## Data Dependencies
APIs consumed via CAP destinations (no MCP servers available):
- `sap.s4:apiResource:API_GRANTCORE:v1` — Grant master data (read)
- `sap.s4:apiResource:API_GRANTCOREHIERARCHY:v1` — Grant hierarchy (read)
- `sap.s4:apiResource:API_BUDGETACCOUNTCORE:v1` — Budget account availability (read)
- `sap.s4:apiResource:OP_API_FNDSMGMTBDGTDOCITEM_0001:v1` — Budget document items (read)
- `sap.s4:apiResource:CE_SPONSOREDPROGRAM_0001:v1` — Sponsored programs (read)
- `sap.s4:apiResource:CE_SPONSOREDCLASS_0001:v1` — Sponsored classes (read)
- `sap.s4:apiResource:OP_API_EARMARKEDFUNDS_SRV_0001:v1` — Earmarked funds creation (read-write)
- `sap.s4:apiResource:CE_STATUTORYREPORTINGTASK_0001:v1` — Statutory reporting (read)

MCP tool scope: read-write
Entities in scope: Grant, GrantHierarchy, BudgetAccount, BudgetDocumentItem, SponsoredProgram, SponsoredClass, EarmarkedFund, StatutoryReportingTask

## Project Structure Tasks

### Setup
- [ ] Initialize CAP project: `cds init grants-lifecycle-app --add nodejs` inside `assets/` folder
- [ ] Add SAP UI5 web components dependency: `npm install @ui5/webcomponents @ui5/webcomponents-fiori @ui5/webcomponents-icons` in the app folder
- [ ] Add required CAP dependencies: `npm install @sap-cloud-sdk/http-client @sap/cds-dk` 
- [ ] Set up `.env` file template with required environment variables (S4HANA_DESTINATION, WORKFLOW_ENDPOINT, PORT)
- [ ] Create `Dockerfile` inside `assets/grants-lifecycle-app/` for BTP deployment

### CDS Domain Model
- [ ] Create `db/schema.cds` defining the following entities:
  - `GrantApplications` — stores applicant submissions (id, grantId, applicantName, orgName, requestedAmount, purpose, status [draft/submitted/under_review/approved/rejected/awarded], submittedAt, updatedAt, s4GrantId, budgetCheckResult)
  - `ApplicationDocuments` — linked documents (id, applicationId, fileName, fileType, fileSize, storagePath, uploadedAt)
  - `ReviewComments` — reviewer notes per application (id, applicationId, reviewerEmail, comment, createdAt)
  - `PaymentRecords` — disbursement tracking (id, applicationId, earmarkedFundDoc, amount, currency, disbursedAt, s4Reference)
- [ ] Create `db/data/` with seed CSV files for testing (sample grant programs, test applications)

### CAP Services
- [ ] Create `srv/applicant-service.cds` exposing:
  - `GrantApplications` (create, read own applications — filtered by authenticated user)
  - `ApplicationDocuments` (create, read own documents)
  - Actions: `submitApplication(applicationId)`, `withdrawApplication(applicationId)`
  - Restrict to role `GrantApplicant`
- [ ] Create `srv/admin-service.cds` exposing:
  - `GrantApplications` (full read, update status)
  - `ReviewComments` (create, read)
  - `PaymentRecords` (read)
  - Actions: `approveApplication(applicationId, budgetFund)`, `rejectApplication(applicationId, reason)`, `checkBudget(grantId, amount)`, `triggerPayment(applicationId, amount, currency)`
  - Restrict to roles `GrantAdmin`, `FinanceOfficer`, `ComplianceOfficer`, `ProgramManager`
- [ ] Create `srv/reporting-service.cds` exposing:
  - Read-only views: `GrantSummaryByStatus`, `BudgetUtilizationByGrant`, `PaymentHistory`
  - Restrict to roles `ComplianceOfficer`, `FinanceOfficer`, `ProgramManager`

### CAP Service Implementation
- [ ] Create `srv/applicant-service.js` implementing:
  - `submitApplication` handler: validates required fields, sets status to "submitted", calls n8n workflow webhook to trigger review routing, returns application reference
  - `withdrawApplication` handler: checks current status (only submitted/under_review may be withdrawn), updates status
  - `READ GrantApplications` handler: filters to current user's own applications only
- [ ] Create `srv/admin-service.js` implementing:
  - `checkBudget` handler: calls S/4HANA `API_BUDGETACCOUNTCORE` OData service via CAP destination, returns available budget vs. requested amount
  - `approveApplication` handler: updates status, records approval, notifies applicant
  - `rejectApplication` handler: updates status, records rejection reason, notifies applicant
  - `triggerPayment` handler: posts earmarked fund document to S/4HANA `OP_API_EARMARKEDFUNDS_SRV` OData service, stores reference in PaymentRecords, updates application status to "awarded"
- [ ] Create `srv/reporting-service.js` implementing:
  - `BudgetUtilizationByGrant` view: aggregates PaymentRecords vs. grant budgets fetched from S/4HANA `API_BUDGETACCOUNTCORE`
  - `GrantSummaryByStatus` view: groups GrantApplications by status with counts and amounts
  - `PaymentHistory` view: joins PaymentRecords with GrantApplications for full disbursement history
- [ ] Create `srv/s4-integration.js` utility module:
  - `getGrantData(grantId)` — calls `API_GRANTCORE` via destination
  - `getBudgetAvailability(grantId, amount)` — calls `API_BUDGETACCOUNTCORE` via destination
  - `getSponsoredPrograms()` — calls `CE_SPONSOREDPROGRAM_0001` via destination
  - `createEarmarkedFund(payload)` — posts to `OP_API_EARMARKEDFUNDS_SRV` via destination
  - `getReportingTasks()` — calls `CE_STATUTORYREPORTINGTASK_0001` via destination
  - All methods use `@sap-cloud-sdk/http-client` with named destination `S4HANA_DEST`

### CAP Configuration
- [ ] Create `package.json` with start script, cds configuration pointing to db and srv folders
- [ ] Create `.cdsrc.json` with:
  - `requires.db` pointing to SAP HANA Cloud (`hana`) for production, SQLite for development
  - `requires.S4HANA` destination config (kind: `odata-v2`, credentials from environment)
  - `auth` config using SAP BTP XSUAA
- [ ] Create `xs-security.json` defining scopes: `GrantApplicant`, `GrantAdmin`, `FinanceOfficer`, `ComplianceOfficer`, `ProgramManager`
- [ ] Create `mta.yaml` for multi-target application deployment to BTP (srv module + db deployer + app router)

### React UI (SAP UI5 Web Components)
- [ ] Create `app/` folder with React application
- [ ] Create `app/package.json` with React, @ui5/webcomponents dependencies
- [ ] Create `app/src/App.jsx` with role-based routing:
  - `/apply` → GrantApplicationForm (GrantApplicant role)
  - `/my-applications` → MyApplicationsList (GrantApplicant role)
  - `/admin` → AdminDashboard (GrantAdmin, FinanceOfficer)
  - `/compliance` → ComplianceDashboard (ComplianceOfficer, ProgramManager)
  - `/` → Landing page with role-based navigation
- [ ] Create `app/src/pages/GrantApplicationForm.jsx`:
  - Multi-step form: Grant selection (dropdown from S/4HANA grant programs) → Applicant details → Project description & budget → Document upload → Review & submit
  - Uses SAP UI5 WizardStep, Input, Select, FileUploader, TextArea, Button components
  - Calls `applicant-service` submit action on final step
  - Shows application reference number and confirmation on success
- [ ] Create `app/src/pages/MyApplicationsList.jsx`:
  - Lists applicant's own submissions with status badges (ObjectStatus component)
  - Shows timeline of status changes per application
  - Allows withdrawal of submitted/under-review applications
  - Real-time status polling (30-second interval)
- [ ] Create `app/src/pages/AdminDashboard.jsx`:
  - Application queue table with filters (status, grant program, date range)
  - Per-application detail panel: full application data + uploaded documents + review history
  - Budget check panel: shows S/4HANA live budget availability when reviewing
  - Action buttons: Approve (opens budget fund selector) / Reject (requires reason) / Request Info
  - Uses UI5 Table, Panel, ObjectPage, MessageBox components
- [ ] Create `app/src/pages/ComplianceDashboard.jsx`:
  - Summary cards: total grants, total disbursed, average processing time, compliance rate
  - Budget utilization chart (AnalyticalTable with percentage bar per grant)
  - Payment history table with export to CSV functionality
  - Uses UI5 AnalyticalTable, Card, ProgressIndicator components
- [ ] Create `app/src/components/` shared components:
  - `StatusBadge.jsx` — colored status indicator using UI5 ObjectStatus
  - `BudgetAvailabilityPanel.jsx` — live budget check widget
  - `DocumentUploader.jsx` — file upload with validation (size, type)
  - `ApplicationTimeline.jsx` — timeline of status changes
- [ ] Create `app/src/api/` API client modules:
  - `applicantApi.js` — wraps calls to applicant-service endpoints
  - `adminApi.js` — wraps calls to admin-service endpoints
  - `reportingApi.js` — wraps calls to reporting-service endpoints
- [ ] Create `app/xs-app.json` for SAP AppRouter configuration routing UI calls to CAP service

### N8n Workflow Integration
- [ ] In `srv/applicant-service.js` `submitApplication` handler, after status update, post to n8n workflow webhook endpoint (configured via env var `WORKFLOW_ENDPOINT`) with payload: `{ applicationId, applicantEmail, grantId, requestedAmount, submittedAt }`
- [ ] Handle webhook call failure gracefully: log error, do not fail the submission — application is still recorded

### Testing
- [ ] Create `test/applicant-service.test.js` — unit tests for submit, withdraw, read-own-applications logic
- [ ] Create `test/admin-service.test.js` — unit tests for budget check, approve, reject, trigger-payment logic
- [ ] Create `test/s4-integration.test.js` — mock tests for all S/4HANA API calls (stub destination responses)
- [ ] Run tests: `npm test` — all tests must pass before marking complete

### Validation Checklist
- [ ] `cds build` completes without errors
- [ ] `cds deploy --to sqlite` succeeds for local dev
- [ ] All CDS entities have correct associations and keys
- [ ] All service actions are accessible only to the correct roles
- [ ] S/4HANA integration module handles API errors with informative messages
- [ ] UI builds without errors: `npm run build` in `app/`
