# Product Requirements Document (PRD)

**Title:** Grants Lifecycle Management Solution
**Date:** 2026-10-07
**Owner:** Grants Management Program Office
**Solution Category:** CAP Application + n8n Workflow

---

## Product Purpose & Value Proposition

**Elevator Pitch:**
Funding organizations today manage grants through disconnected, paper-based processes that delay awards, cause budget overruns, and make compliance reporting a burden. This solution delivers a unified digital platform — an applicant-facing portal, an administration console, and automated workflows — all connected in real time to SAP S/4HANA, so every grant moves faster, stays on budget, and stays compliant.

**Business Need:**
There is no unified digital channel for external applicants to submit or track grants. Internal review and approval is manual, causing delays. Budget and fund data lives exclusively in S/4HANA with no accessible visibility for administrators or applicants. Compliance reporting requires manual data extraction, leading to errors and late submissions. The organization needs a solution that bridges all these gaps in a single, integrated platform.

**Expected Value:**
- Grant application processing time reduced from 7–10 days to 3 days within 2 months of go-live.
- Percentage of grants experiencing budget or compliance issues reduced from 50% to under 10% within 2 months of go-live.

**Product Objectives (Prioritized):**
1. Eliminate manual, paper-based application intake with a self-service applicant portal.
2. Provide real-time budget and fund visibility by integrating with SAP S/4HANA Grants Management, Budget, and Fund Accounting APIs.
3. Automate the review and approval routing process to reduce processing time and prevent bottlenecks.
4. Deliver a compliance reporting dashboard that gives finance and compliance officers live grant data.
5. Integrate payment disbursement directly with S/4HANA Finance to eliminate manual payment processing errors.

---

## Business Metrics

| Metric | Baseline | Target | Timeline | Process / Capability | Source |
|--------|----------|--------|----------|----------------------|--------|
| Grant application processing time | 7–10 days | 3 days | 2 months | Grant Application Intake & Award | user |
| Grants with budget/compliance issues | 50% | <10% | 2 months | Budget Tracking & Compliance Reporting | user |

---

## User Profiles & Personas

### Primary Persona: Alex — Grant Administrator

Alex is a 35-year-old grants program officer at a public-sector funding organization. He receives 30–50 grant applications per cycle, reviews eligibility and documentation, coordinates with finance for budget approval, and communicates decisions to applicants. He currently juggles spreadsheets, email chains, and manual S/4HANA lookups. He frequently misses SLAs because there is no system to track where each application stands. He wants a single place to see all applications, their status, and the budget available — without switching between systems.

### Secondary Persona: Maria — Grant Applicant

Maria is a 42-year-old program director at a non-profit organization applying for public funding. She submits applications by filling in paper forms or emailing documents, then waits weeks for a response with no visibility into the process. She wants a simple online portal where she can submit her application, upload supporting documents, track the status in real time, and receive automated notifications when decisions are made.

### Tertiary Persona: David — Finance / Budget Officer

David is a 48-year-old senior finance officer responsible for fund allocation and payment disbursement. He approves budget availability for each grant and processes payments once awards are made. Today he runs manual checks in S/4HANA and receives payment requests via email. He wants automated budget validation to flag overruns before they happen, and a streamlined payment trigger that eliminates manual data entry.

### Other User Types

- **Compliance & Reporting Officer:** Reviews grant usage data, produces regulatory reports, and monitors adherence to grant conditions. Needs real-time dashboards instead of periodic manual exports.
- **Program Manager:** Oversees one or more grant programs, monitors budget consumption, and tracks portfolio-level reporting.

---

## User Goals & Tasks

### For Alex (Grant Administrator):

**Goals:**
- Review and process all grant applications within 3 business days.
- Maintain real-time visibility of budget availability across all active grants.
- Communicate award decisions to applicants promptly and accurately.

**Key Tasks:**
- Open a consolidated application queue and review submitted applications.
- Check budget availability against S/4HANA without leaving the portal.
- Approve, reject, or request additional information from applicants.
- Trigger the approval workflow to route to finance or senior reviewer when required.
- Monitor the status of all applications in the current cycle.

### For Maria (Grant Applicant):

**Goals:**
- Submit a grant application quickly and without requiring technical expertise.
- Know at all times what stage her application is in and what is expected of her.

**Key Tasks:**
- Create an account and fill in an online grant application form.
- Upload required supporting documents.
- Track application status in real time via a status tracker.
- Receive automated email notifications on status changes and decisions.

### For David (Finance / Budget Officer):

**Goals:**
- Validate budget availability before grants are approved.
- Disburse payments accurately and on time once awards are confirmed.

**Key Tasks:**
- Receive automated budget check alerts when an application reaches approval stage.
- Approve or flag budget availability directly from the administration console.
- Review and confirm payment disbursement requests that are triggered to S/4HANA.

---

## Product Principles

1. **Single source of truth:** Financial data (budgets, funds, payments) is always read from and written to SAP S/4HANA — never duplicated or maintained separately.
2. **Transparency for applicants:** Every applicant must be able to see the current status of their application at any time without contacting a human.
3. **Automate routing, not decisions:** The workflow automates routing, notifications, and escalations — award decisions remain with human reviewers.
4. **Compliance by design:** Every grant record must maintain a full audit trail — who reviewed, who approved, when, and with what budget data.
5. **Simple before powerful:** Prioritize ease of use for non-technical applicants and administrators over feature richness.

---

## Business Context

**Current State:**
Grant applications are submitted via paper forms or email. Review is coordinated manually by administrators across email and spreadsheets. Budget checks require logging into SAP S/4HANA separately. Payment requests are emailed to finance and entered manually. Compliance reports are assembled from spreadsheet exports. This results in 7–10 day processing times, frequent budget overruns, and compliance incidents affecting 50% of active grants.

**Strategic Alignment:**
This solution supports the organization's digital transformation agenda, its commitment to public accountability and regulatory compliance, and its mandate to disburse funds efficiently to grant recipients.

**Success Criteria:**
See the Business Metrics section above.

---

## Goals and Non-Goals

### Goals (In Scope)

- Self-service applicant portal for application submission, document upload, and real-time status tracking.
- Grant administration console for reviewing, approving, rejecting, and awarding grants.
- Real-time budget and fund availability checks integrated with SAP S/4HANA Cloud Public Edition.
- Automated review and approval routing via n8n workflow with SLA monitoring and escalation.
- Payment disbursement integration via S/4HANA Finance OData APIs.
- Compliance and grant reporting dashboard drawing live data from S/4HANA.
- Email notifications to applicants and administrators at key lifecycle events.

### Non-Goals (Out of Scope)

- Grant program configuration and master data setup within SAP S/4HANA (assumed pre-existing).
- SAP Analytics Cloud or BW/4HANA integration for extended analytics.
- Migration of historical grant data from legacy systems.
- Mobile native application (portal will be responsive but not a dedicated mobile app).
- Integration with external grant registries or government portals.

---

## Requirements

### Must-Have Requirements

**R1: Applicant Self-Service Portal**

- **Problem to Solve:** External applicants have no digital channel to submit or track grant applications, leading to delays and lack of transparency.
- **User Story:** As a grant applicant, I need an online portal to submit my application and supporting documents and track its status in real time, so that I do not have to rely on phone calls or emails to know where my application stands.
- **Acceptance Criteria:**
  - Given I am a registered applicant, when I complete and submit the application form with required attachments, then my application is recorded with a unique reference number and I receive an email confirmation.
  - Given my application is under review, when I log in to the portal, then I can see the current status and the last action taken on my application.
- **Maps to Objective:** Objective 1 — Eliminate manual application intake.
- **Priority Rank:** 1

---

**R2: Grant Administration Console**

- **Problem to Solve:** Administrators have no centralized view of all incoming applications, their status, or associated budget data, causing missed SLAs and inconsistent decisions.
- **User Story:** As a grant administrator, I need a consolidated dashboard showing all applications, their current status, and available budget, so that I can review and act on applications efficiently without switching between systems.
- **Acceptance Criteria:**
  - Given I am logged in as an administrator, when I open the dashboard, then I can see all active applications sorted by submission date with status indicators.
  - Given I am reviewing an application, when I check budget availability, then the system fetches real-time data from SAP S/4HANA and displays remaining budget for the applicable grant/fund.
  - Given I approve or reject an application, then the decision is recorded with a timestamp and the applicant is notified automatically.
- **Maps to Objective:** Objectives 1, 2 — Eliminate manual intake; provide budget visibility.
- **Priority Rank:** 2

---

**R3: Automated Review & Approval Workflow**

- **Problem to Solve:** Manual routing of applications for review and approval causes delays, missed escalations, and no SLA visibility.
- **User Story:** As a grant administrator, I need applications to be automatically routed to the correct reviewer, with reminders and escalations if SLAs are breached, so that no application stalls in the queue.
- **Acceptance Criteria:**
  - Given an application is submitted, when the workflow triggers, then it is assigned to the correct reviewer role based on grant type and value.
  - Given a review step has not been completed within the defined SLA, then an escalation notification is sent to the reviewer's manager.
  - Given all approval steps are completed, then the grant status is updated to "Awarded" and the applicant is notified.
- **Maps to Objective:** Objective 3 — Automate review and approval routing.
- **Priority Rank:** 3

---

**R4: Real-Time Budget & Fund Tracking**

- **Problem to Solve:** Budget overruns occur because administrators cannot check fund availability in real time before approving grants.
- **User Story:** As a finance officer, I need the system to automatically validate budget availability in SAP S/4HANA before an award can be confirmed, so that no grant is awarded against an insufficient or exhausted fund.
- **Acceptance Criteria:**
  - Given an administrator initiates a grant award, when the system checks S/4HANA budget availability, then it blocks the award and raises an alert if available budget is insufficient.
  - Given a grant is awarded, then the committed amount is reflected in S/4HANA fund accounting within 60 seconds.
- **Maps to Objective:** Objective 2 — Real-time budget visibility.
- **Priority Rank:** 4

---

**R5: Payment Disbursement Integration**

- **Problem to Solve:** Manual payment requests emailed to finance result in errors, delays, and a lack of traceability.
- **User Story:** As a finance officer, I need awarded grants to automatically generate a payment disbursement request in SAP S/4HANA, so that payments are processed accurately and on time without manual data re-entry.
- **Acceptance Criteria:**
  - Given a grant is awarded and confirmed, when the payment step is triggered, then an earmarked funds document is created in S/4HANA via the Earmarked Funds API.
  - Given the payment is processed in S/4HANA, then the grant record in the portal is updated with the payment reference and disbursement date.
- **Maps to Objective:** Objective 5 — Eliminate manual payment processing.
- **Priority Rank:** 5

---

**R6: Compliance & Reporting Dashboard**

- **Problem to Solve:** Compliance officers must manually extract and compile grant data for regulatory reporting, which is time-consuming and error-prone.
- **User Story:** As a compliance officer, I need a real-time dashboard showing grant status, budget utilization, and disbursement history, so that I can produce regulatory reports without manual data extraction.
- **Acceptance Criteria:**
  - Given I am logged in as a compliance officer, when I open the reporting dashboard, then I can see all active grants, their budget consumption as a percentage, and disbursement history updated in real time from S/4HANA.
  - Given I need to produce a report, when I export the dashboard data, then I receive a structured file (CSV or PDF) covering all selected grants and date ranges.
- **Maps to Objective:** Objective 4 — Compliance reporting dashboard.
- **Priority Rank:** 6

---

### High-Want Requirements

**R7: Applicant Notification Engine**

- **Problem to Solve:** Applicants receive no proactive communication about their application status, driving inbound queries to administrators.
- **User Story:** As a grant applicant, I need automatic email notifications when my application status changes, so that I am always informed without having to log in repeatedly.
- **Priority Rank:** 1

---

**R8: Document Management**

- **Problem to Solve:** Supporting documents submitted with applications are emailed and stored inconsistently, making retrieval and audit difficult.
- **User Story:** As a grant administrator, I need all application documents stored centrally and linked to the grant record, so that reviewers can access them instantly and auditors can retrieve them on demand.
- **Priority Rank:** 2

---

### Nice-to-Have Requirements

**R9: Sponsor & Program Management View**

- **Problem to Solve:** Program managers have no consolidated view of sponsor commitments and sponsored program budgets across grant cycles.
- **User Story:** As a program manager, I need a summary view of all sponsored programs and their remaining budgets, so that I can plan future grant cycles proactively.
- **Priority Rank:** 1

**R10: Multi-Language Support**

- **Problem to Solve:** Applicants from diverse regions may need the portal in their local language.
- **User Story:** As a grant applicant, I need the portal available in my preferred language, so that language is not a barrier to applying.
- **Priority Rank:** 2

---

## Non-Functional Requirements

### Performance

- **Latency:** Portal pages and dashboard widgets must load within 3 seconds under normal load.
- **Throughput:** The system must support at least 200 concurrent applicant sessions and 50 concurrent administrator sessions.

### Reliability

- **Availability:** 99.5% uptime during business hours (06:00–22:00 local time).
- **Fallback:** If S/4HANA APIs are unavailable, budget checks display a warning and defer the award action — the portal remains accessible for non-financial operations.

### Security

- **Authentication:** All users authenticate via SAP BTP Identity Authentication Service (IAS).
- **Authorization:** Role-based access control distinguishes applicants, administrators, finance officers, compliance officers, and program managers.
- **Data isolation:** Applicants can only view their own applications; administrators see all applications for their assigned programs.

### Explainability

- **Traceability:** Every budget check, approval action, and payment trigger is logged with user, timestamp, and data payload.
- **Decision Logging:** All workflow state transitions are persisted and viewable in the administration console audit trail.

---

## Solution Architecture

**Architecture Overview:**
The solution is deployed on SAP BTP. A CAP (Node.js) backend service acts as the integration hub between the React UI front end and SAP S/4HANA Cloud Public Edition. An n8n workflow engine handles application review routing, notifications, and escalations. The CAP service exposes RESTful APIs consumed by the React front end and calls S/4HANA OData APIs for grants, budget, fund, and payment data.

**Key Components:**

- **React UI (SAP UI5 Web Components):** Applicant portal and grants administration console. Two distinct UX surfaces with role-based navigation.
- **CAP Backend (Node.js):** Core application logic, data persistence (SAP HANA Cloud), API gateway to S/4HANA OData services, authentication/authorization enforcement.
- **n8n Workflow:** Automated review routing, SLA monitoring, escalation handling, and outbound email notifications.
- **SAP S/4HANA Cloud Public Edition:** System of record for grants, budgets, funds, sponsors, and payments. Accessed via OData APIs.
- **SAP BTP Identity Authentication Service:** User identity and authentication for all roles.
- **SAP HANA Cloud:** Persistence layer for application records, document references, workflow state, and audit logs.

**Integration Points:**

- **SAP S/4HANA — Grant Management APIs** (`API_GRANTCORE:v1`, `API_GRANTCOREHIERARCHY:v1`): Read grant master data and hierarchy for display and validation. Read direction.
- **SAP S/4HANA — Budget & Fund APIs** (`API_BUDGETACCOUNTCORE:v1`, `OP_API_FNDSMGMTBDGTDOCITEM_0001:v1`): Real-time budget availability checks and commitment posting. Read and write.
- **SAP S/4HANA — Sponsored Program & Class APIs** (`CE_SPONSOREDPROGRAM_0001:v1`, `CE_SPONSOREDCLASS_0001:v1`): Sponsor and program data for administration console. Read direction.
- **SAP S/4HANA — Earmarked Funds API** (`OP_API_EARMARKEDFUNDS_SRV_0001:v1`): Creates earmarked fund documents to trigger payment disbursement. Write direction.
- **SAP S/4HANA — Statutory Reporting API** (`CE_STATUTORYREPORTINGTASK_0001:v1`): Feeds compliance dashboard with reporting task data. Read direction.

**Deployment Environments:**

- **Development:** SAP BTP subaccount with sandboxed S/4HANA APIs; no production data.
- **Production:** Dedicated SAP BTP subaccount connected to the live S/4HANA Cloud tenant via OAuth 2.0 destination.

---

## Automation & Agent Behaviour

**Automation Level:** Rule-based workflow automation

**Actions the system performs without human approval:**
- Route application to the appropriate reviewer based on grant type and value thresholds.
- Send automated status notification emails to applicants on every lifecycle state change.
- Escalate overdue review tasks to the reviewer's manager when SLA is breached.
- Perform real-time budget availability checks against S/4HANA when an award action is initiated.

**Actions that require human review or approval:**
- Approving or rejecting a grant application (grant administrator decision).
- Confirming budget availability and unlocking award confirmation (finance officer).
- Confirming payment disbursement trigger to S/4HANA (finance officer).
- Any grant value above a configurable threshold requires secondary approval from a program manager.

**Model or engine used:** n8n workflow engine (rule-based, no AI model required)

**Knowledge & data sources accessed:**
- SAP S/4HANA Cloud Public Edition: grants master data, budget, fund, sponsor, and payment data.
- SAP HANA Cloud (CAP persistence): application records, document metadata, workflow state, audit logs.

**Tools or connectors invoked:**
- SAP S/4HANA OData APIs (via CAP service destinations): grant lifecycle, budget, fund accounting, payment disbursement.
- Email connector (n8n): outbound notifications to applicants and administrators.

**Guardrails & fail-safes:**
- No grant award can be confirmed without a successful, real-time budget availability check from S/4HANA.
- Payment disbursement to S/4HANA requires explicit finance officer confirmation — it is never triggered automatically.
- If the S/4HANA API call fails, the system surfaces an error to the user and logs the failure; the workflow is paused, not aborted.
- All write operations to S/4HANA are idempotent — duplicate payment creation is prevented by checking for existing earmarked fund documents before posting.

---

## Configuration & Data

**Configuration Scope:**
- SAP BTP destinations to SAP S/4HANA Cloud Public Edition (OAuth 2.0).
- n8n workflow SLA thresholds and escalation rules (configurable per grant program).
- Role assignments in SAP BTP IAS for each user type.

**Organisational & Master Data:**
- Grant programs, fund centers, and sponsored programs are assumed to be pre-configured in SAP S/4HANA. The portal reads this data; it does not create or maintain it.
- Applicant user accounts are created via self-registration in SAP BTP IAS.

**Data Migration & Cutover:**
- Historical grant data migration is out of scope for the initial release.
- Open grant applications active at go-live will be migrated manually if required — a data migration runbook will be produced separately.

---

## Governance, Risk & Compliance

**Data Handling:**
- Applicant personal data (name, contact, organization) is stored in SAP HANA Cloud and processed under applicable data protection regulations.
- No PII is transmitted to S/4HANA beyond what is required for payment processing (payee reference).
- Documents uploaded by applicants are stored in SAP BTP Object Store with access restricted to the applicant and authorized administrators.

**Compliance Frameworks:**
- Grants disbursed through this platform are subject to the organization's internal grants policy and applicable public sector financial regulations.
- Full audit trail of all review, approval, and payment actions is mandatory.

**Approval Flows:**
- Award confirmation requires budget officer sign-off for all applications.
- Applications above a configurable value threshold require program manager co-approval before award.

---

## Release Criteria

- **Performance:** Portal pages load within 3 seconds for 95% of requests under load testing.
- **Reliability:** All S/4HANA API integrations pass end-to-end integration tests in the QA environment with the target S/4HANA tenant.
- **Security:** Role-based access is validated — applicants cannot access other applicants' data; unauthorized roles cannot trigger payment disbursement.
- **Usability:** At least 3 representative grant applicants and 2 administrators complete a full end-to-end test cycle without requiring support intervention.
- **Monitoring:** Application error logs and S/4HANA API call failures are surfaced in SAP BTP Cockpit alerting.

---

## Schedule & Timeline Context

**Target Timeline:** 2 months from project start to production go-live.

**Business Drivers:**
- The current manual process is creating a growing backlog of applications and increasing the risk of regulatory non-compliance.
- The organization has a grant cycle opening within the 2-month window that will be the first live use of the solution.

**Key Milestones:** See the Milestones section below.

---

## Milestones

### M1: Applicant Portal Live

- **Description:** The external grant applicant portal is deployed and accessible to registered applicants.
- **Achieved when:** At least one external applicant successfully submits a grant application through the portal and receives a confirmation email.
- **Log on achievement:** `M1.achieved: applicant portal live — first application submitted successfully`
- **Log on miss:** `M1.missed: applicant portal go-live delayed or no successful application submitted`

### M2: Budget Integration with S/4HANA Active

- **Description:** The real-time budget availability check against SAP S/4HANA is operational in the production environment.
- **Achieved when:** A grant award action in the administration console successfully retrieves and displays live budget data from S/4HANA and blocks an award when budget is insufficient.
- **Log on achievement:** `M2.achieved: S/4HANA budget integration active — real-time checks operational`
- **Log on miss:** `M2.missed: S/4HANA budget integration not operational in production`

### M3: First End-to-End Grant Processed

- **Description:** A grant application completes the full lifecycle — submission, review, approval, award, and payment disbursement — entirely through the solution.
- **Achieved when:** A payment disbursement earmarked fund document is created in S/4HANA for a grant that entered the system through the applicant portal.
- **Log on achievement:** `M3.achieved: first end-to-end grant processed — submission to payment disbursement complete`
- **Log on miss:** `M3.missed: no grant has completed the full lifecycle end-to-end through the system`

### M4: Compliance Reporting Dashboard Available

- **Description:** The compliance and reporting dashboard is live and populated with real data from S/4HANA.
- **Achieved when:** A compliance officer successfully generates and exports a grant status and budget utilization report covering at least one active grant cycle.
- **Log on achievement:** `M4.achieved: compliance dashboard live — first report exported successfully`
- **Log on miss:** `M4.missed: compliance reporting dashboard not available or not populated with live S/4HANA data`

---

## Risks, Assumptions, and Dependencies

### Risks

- **S/4HANA API stability:** All grants-related OData APIs are consumed without pre-built MCP servers. Any breaking change or throttling in the S/4HANA APIs will require immediate CAP service updates.
- **Compliance data accuracy:** The compliance dashboard is only as accurate as the data in S/4HANA. Pre-existing data quality issues in S/4HANA will surface in reports.
- **SLA for go-live:** A 2-month timeline is tight. Delays in S/4HANA API credential provisioning or destination configuration on SAP BTP could push the schedule.

### Assumptions

- SAP S/4HANA Cloud Public Edition is already live and grant programs, fund centers, and sponsored programs are already configured.
- The organization can provision OAuth 2.0 service credentials for the required S/4HANA APIs within the first 2 weeks.
- Applicants have internet access and can self-register on the portal.
- Email infrastructure (SMTP or SAP BTP Mail service) is available for outbound notifications.

### Dependencies

- SAP BTP subaccount with HANA Cloud, IAS, and Object Store entitlements.
- SAP S/4HANA Cloud Public Edition with Grants Management, Fund Accounting, and Budgetary Accounting activated.
- S/4HANA API credentials provisioned and accessible via SAP BTP Destination Service.
- n8n runtime available on SAP BTP.

---

## Open Questions

- What is the maximum file size permitted for applicant document uploads, and are there restrictions on file type?
- Is multi-currency support required for grant disbursements, or are all grants in a single currency?
- Should the portal support a draft save feature for applicants who cannot complete their application in one session?
- What are the configurable SLA thresholds per grant type for the review routing workflow?

---

## Appendix

### Glossary

- **Grant:** A financial award given to a recipient organization or individual for a specific purpose, governed by conditions.
- **Fund Center:** An SAP S/4HANA organizational unit used to manage budget allocations within Funds Management.
- **Sponsored Program / Sponsored Class:** SAP S/4HANA objects used to classify and track grant-funded expenditures.
- **Earmarked Funds:** An SAP S/4HANA instrument that reserves budget for a specific commitment before a formal payment is made.
- **CAP:** SAP Cloud Application Programming Model — a framework for building services on SAP BTP.
- **OData:** Open Data Protocol — the API standard used by SAP S/4HANA for most of its external integration APIs.

### References

- SAP S/4HANA Cloud Public Edition — Grants Management: [SAP Help Portal](https://help.sap.com)
- SAP Grants Management API (API_GRANTCORE): SAP Business Accelerator Hub
- SAP Funds Management Budget Document API: SAP Business Accelerator Hub
- SAP CAP Documentation: [cap.cloud.sap](https://cap.cloud.sap)
- SAP BTP Identity Authentication Service: [SAP Help Portal](https://help.sap.com)
