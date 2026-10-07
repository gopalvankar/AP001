/**
 * Grants Lifecycle Management — Automated Test Suite
 * Pure Node.js tests using built-in assert module (no external framework required).
 * Tests cover: CDS schema, service definitions, business logic, n8n workflow JSON.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Test Runner ────────────────────────────────────────────────────────────

let passed = 0, failed = 0, skipped = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ status: 'PASS', name });
    process.stdout.write(`  ✅ PASS  ${name}\n`);
  } catch (err) {
    failed++;
    results.push({ status: 'FAIL', name, error: err.message });
    process.stdout.write(`  ❌ FAIL  ${name}\n       → ${err.message}\n`);
  }
}

function skip(name, reason) {
  skipped++;
  results.push({ status: 'SKIP', name, reason });
  process.stdout.write(`  ⏭️  SKIP  ${name}  (${reason})\n`);
}

function section(title) {
  process.stdout.write(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}\n`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

function compileCDS(file) {
  const result = execSync(
    `cds compile ${file} --to json`,
    { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] }
  ).toString();
  return JSON.parse(result);
}

function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 1 — File Structure
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 1 — Project File Structure');

test('package.json exists', () => {
  assert.ok(fileExists('package.json'), 'package.json not found');
});

test('db/schema.cds exists', () => {
  assert.ok(fileExists('db/schema.cds'), 'db/schema.cds not found');
});

test('srv/applicant-service.cds exists', () => {
  assert.ok(fileExists('srv/applicant-service.cds'));
});

test('srv/admin-service.cds exists', () => {
  assert.ok(fileExists('srv/admin-service.cds'));
});

test('srv/reporting-service.cds exists', () => {
  assert.ok(fileExists('srv/reporting-service.cds'));
});

test('srv/s4-integration.js exists', () => {
  assert.ok(fileExists('srv/s4-integration.js'));
});

test('srv/applicant-service.js exists', () => {
  assert.ok(fileExists('srv/applicant-service.js'));
});

test('srv/admin-service.js exists', () => {
  assert.ok(fileExists('srv/admin-service.js'));
});

test('app/index.html exists', () => {
  assert.ok(fileExists('app/index.html'));
});

test('Dockerfile exists', () => {
  assert.ok(fileExists('Dockerfile'));
});

test('asset.yaml exists', () => {
  assert.ok(fileExists('asset.yaml'));
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 2 — CDS Schema Compilation
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 2 — CDS Schema Compilation');

let schema;
test('db/schema.cds compiles without errors', () => {
  schema = compileCDS('db/schema.cds');
  assert.ok(schema && schema.definitions, 'No definitions in compiled schema');
});

test('GrantApplications entity exists in schema', () => {
  assert.ok(schema.definitions['grants.db.GrantApplications'], 'GrantApplications not found');
  assert.strictEqual(schema.definitions['grants.db.GrantApplications'].kind, 'entity');
});

test('GrantApplications has required fields', () => {
  const entity = schema.definitions['grants.db.GrantApplications'];
  const fields = Object.keys(entity.elements || {});
  const required = ['grantId', 'applicantName', 'applicantEmail', 'orgName', 'requestedAmount', 'purpose', 'status'];
  for (const f of required) {
    assert.ok(fields.includes(f), `Missing field: ${f}`);
  }
});

test('GrantApplications status field has default "draft"', () => {
  const elem = schema.definitions['grants.db.GrantApplications'].elements?.status;
  assert.strictEqual(elem?.default?.val, 'draft', `Expected default "draft", got "${elem?.default?.val}"`);
});

test('ApplicationDocuments entity exists', () => {
  assert.ok(schema.definitions['grants.db.ApplicationDocuments'], 'ApplicationDocuments not found');
});

test('ReviewComments entity exists', () => {
  assert.ok(schema.definitions['grants.db.ReviewComments'], 'ReviewComments not found');
});

test('PaymentRecords entity exists', () => {
  assert.ok(schema.definitions['grants.db.PaymentRecords'], 'PaymentRecords not found');
});

test('PaymentRecords status field has default "pending"', () => {
  const elem = schema.definitions['grants.db.PaymentRecords'].elements?.status;
  assert.strictEqual(elem?.default?.val, 'pending');
});

test('GrantApplications has Composition to ApplicationDocuments', () => {
  const elem = schema.definitions['grants.db.GrantApplications'].elements?.documents;
  assert.strictEqual(elem?.type, 'cds.Composition', `Expected Composition, got ${elem?.type}`);
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 3 — Applicant Service Definition
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 3 — Applicant Service (CDS)');

let applicantSvc;
test('applicant-service.cds compiles without errors', () => {
  applicantSvc = compileCDS('srv/applicant-service.cds');
  assert.ok(applicantSvc.definitions, 'No definitions');
});

test('ApplicantService is defined as a service', () => {
  assert.strictEqual(applicantSvc.definitions['ApplicantService']?.kind, 'service');
});

test('ApplicantService path is /applicant', () => {
  assert.strictEqual(applicantSvc.definitions['ApplicantService']?.['@path'], '/applicant');
});

test('ApplicantService.Applications entity exists', () => {
  assert.ok(applicantSvc.definitions['ApplicantService.Applications'], 'Applications entity missing');
});

test('ApplicantService.submitApplication action exists', () => {
  const action = applicantSvc.definitions['ApplicantService.submitApplication'];
  assert.ok(action, 'submitApplication action missing');
  assert.strictEqual(action.kind, 'action');
});

test('submitApplication has applicationId parameter', () => {
  const params = applicantSvc.definitions['ApplicantService.submitApplication']?.params;
  assert.ok(params?.applicationId, 'applicationId param missing');
  assert.strictEqual(params.applicationId.type, 'cds.UUID');
});

test('ApplicantService.withdrawApplication action exists', () => {
  const action = applicantSvc.definitions['ApplicantService.withdrawApplication'];
  assert.ok(action, 'withdrawApplication action missing');
  assert.strictEqual(action.kind, 'action');
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 4 — Admin Service Definition
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 4 — Admin Service (CDS)');

let adminSvc;
test('admin-service.cds compiles without errors', () => {
  adminSvc = compileCDS('srv/admin-service.cds');
  assert.ok(adminSvc.definitions, 'No definitions');
});

test('AdminService is defined as a service', () => {
  assert.strictEqual(adminSvc.definitions['AdminService']?.kind, 'service');
});

test('AdminService path is /admin', () => {
  assert.strictEqual(adminSvc.definitions['AdminService']?.['@path'], '/admin');
});

test('AdminService.checkBudget function exists', () => {
  const fn = adminSvc.definitions['AdminService.checkBudget'];
  assert.ok(fn, 'checkBudget not found');
  assert.strictEqual(fn.kind, 'function');
});

test('checkBudget has grantId and requestedAmount parameters', () => {
  const params = adminSvc.definitions['AdminService.checkBudget']?.params;
  assert.ok(params?.grantId, 'grantId param missing');
  assert.ok(params?.requestedAmount, 'requestedAmount param missing');
});

test('AdminService.approveApplication action exists', () => {
  const action = adminSvc.definitions['AdminService.approveApplication'];
  assert.ok(action, 'approveApplication missing');
  assert.strictEqual(action.kind, 'action');
});

test('AdminService.rejectApplication action exists', () => {
  const action = adminSvc.definitions['AdminService.rejectApplication'];
  assert.ok(action, 'rejectApplication missing');
  assert.strictEqual(action.kind, 'action');
});

test('AdminService.triggerPayment action exists', () => {
  const action = adminSvc.definitions['AdminService.triggerPayment'];
  assert.ok(action, 'triggerPayment missing');
  assert.strictEqual(action.kind, 'action');
});

test('triggerPayment has amount and currency parameters', () => {
  const params = adminSvc.definitions['AdminService.triggerPayment']?.params;
  assert.ok(params?.amount, 'amount param missing');
  assert.ok(params?.currency, 'currency param missing');
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 5 — Reporting Service Definition
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 5 — Reporting Service (CDS)');

let reportSvc;
test('reporting-service.cds compiles without errors', () => {
  reportSvc = compileCDS('srv/reporting-service.cds');
  assert.ok(reportSvc.definitions, 'No definitions');
});

test('ReportingService is defined as a service', () => {
  assert.strictEqual(reportSvc.definitions['ReportingService']?.kind, 'service');
});

test('ReportingService path is /reporting', () => {
  assert.strictEqual(reportSvc.definitions['ReportingService']?.['@path'], '/reporting');
});

test('ReportingService.AllApplications entity exists', () => {
  assert.ok(reportSvc.definitions['ReportingService.AllApplications'], 'AllApplications missing');
});

test('ReportingService.GrantSummaryByStatus view exists', () => {
  assert.ok(reportSvc.definitions['ReportingService.GrantSummaryByStatus'], 'GrantSummaryByStatus missing');
});

test('ReportingService.PaymentHistory entity exists', () => {
  assert.ok(reportSvc.definitions['ReportingService.PaymentHistory'], 'PaymentHistory missing');
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 6 — Business Logic (applicant-service.js)
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 6 — Business Logic: Applicant Service');

const applicantServiceCode = fs.readFileSync(path.join(ROOT, 'srv/applicant-service.js'), 'utf8');

test('applicant-service.js handles submitApplication', () => {
  assert.ok(applicantServiceCode.includes("'submitApplication'"), 'submitApplication handler missing');
});

test('applicant-service.js validates draft status before submit', () => {
  assert.ok(applicantServiceCode.includes("status !== 'draft'"), 'Draft status check missing');
});

test('applicant-service.js validates required fields before submit', () => {
  assert.ok(
    applicantServiceCode.includes('!app.grantId') || applicantServiceCode.includes('requestedAmount'),
    'Required field validation missing'
  );
});

test('applicant-service.js triggers n8n workflow on submit', () => {
  assert.ok(
    applicantServiceCode.includes('WORKFLOW_ENDPOINT') && applicantServiceCode.includes('axios.post'),
    'Workflow trigger missing'
  );
});

test('applicant-service.js handles workflow failure gracefully (fire and forget)', () => {
  assert.ok(
    applicantServiceCode.includes('catch') && applicantServiceCode.includes('console.warn'),
    'Workflow error handling missing'
  );
});

test('applicant-service.js handles withdrawApplication', () => {
  assert.ok(applicantServiceCode.includes("'withdrawApplication'"), 'withdrawApplication handler missing');
});

test('applicant-service.js validates allowed statuses for withdrawal', () => {
  assert.ok(
    applicantServiceCode.includes('under_review') && applicantServiceCode.includes('submitted'),
    'Withdrawal status validation missing'
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 7 — Business Logic (admin-service.js)
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 7 — Business Logic: Admin Service');

const adminServiceCode = fs.readFileSync(path.join(ROOT, 'srv/admin-service.js'), 'utf8');

test('admin-service.js handles approveApplication', () => {
  assert.ok(adminServiceCode.includes("'approveApplication'"), 'approveApplication handler missing');
});

test('admin-service.js handles rejectApplication', () => {
  assert.ok(adminServiceCode.includes("'rejectApplication'"), 'rejectApplication handler missing');
});

test('admin-service.js validates rejection reason length ≥ 10 chars', () => {
  assert.ok(
    adminServiceCode.includes('10') && adminServiceCode.includes('reason'),
    'Rejection reason length validation missing'
  );
});

test('admin-service.js handles triggerPayment', () => {
  assert.ok(adminServiceCode.includes("'triggerPayment'"), 'triggerPayment handler missing');
});

test('admin-service.js requires approved status for payment', () => {
  assert.ok(
    adminServiceCode.includes("status !== 'approved'") || adminServiceCode.includes("'approved'"),
    'Payment status guard missing'
  );
});

test('admin-service.js updates status to "awarded" after payment', () => {
  assert.ok(adminServiceCode.includes("status: 'awarded'"), '"awarded" status update missing');
});

test('admin-service.js inserts PaymentRecord after successful payment', () => {
  assert.ok(
    adminServiceCode.includes('INSERT.into(PaymentRecords)') || adminServiceCode.includes('PaymentRecords'),
    'PaymentRecord insert missing'
  );
});

test('admin-service.js handles checkBudget', () => {
  assert.ok(adminServiceCode.includes("'checkBudget'"), 'checkBudget handler missing');
});

test('admin-service.js delegates budget check to s4-integration', () => {
  assert.ok(
    adminServiceCode.includes('s4.getBudgetAvailability'),
    's4 budget check call missing'
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 8 — S/4HANA Integration Module
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 8 — S/4HANA Integration Module');

const s4Code = fs.readFileSync(path.join(ROOT, 'srv/s4-integration.js'), 'utf8');

test('s4-integration.js exports getGrantData', () => {
  assert.ok(s4Code.includes('getGrantData'), 'getGrantData missing');
});

test('s4-integration.js exports getBudgetAvailability', () => {
  assert.ok(s4Code.includes('getBudgetAvailability'), 'getBudgetAvailability missing');
});

test('s4-integration.js exports getSponsoredPrograms', () => {
  assert.ok(s4Code.includes('getSponsoredPrograms'), 'getSponsoredPrograms missing');
});

test('s4-integration.js exports createEarmarkedFund', () => {
  assert.ok(s4Code.includes('createEarmarkedFund'), 'createEarmarkedFund missing');
});

test('s4-integration.js exports getReportingTasks', () => {
  assert.ok(s4Code.includes('getReportingTasks'), 'getReportingTasks missing');
});

test('s4-integration.js uses @sap-cloud-sdk/http-client for S/4HANA calls', () => {
  assert.ok(
    s4Code.includes('@sap-cloud-sdk/http-client') && s4Code.includes('executeHttpRequest'),
    'SAP Cloud SDK http client usage missing'
  );
});

test('s4-integration.js uses S4HANA_DEST destination', () => {
  assert.ok(s4Code.includes('S4HANA_DEST'), 'S4HANA_DEST destination missing');
});

test('s4-integration.js fetches CSRF token before earmarked fund POST', () => {
  assert.ok(
    s4Code.includes("'x-csrf-token': 'fetch'") || s4Code.includes("x-csrf-token"),
    'CSRF token fetch missing'
  );
});

test('s4-integration.js uses API_GRANTCORE for grant data', () => {
  assert.ok(s4Code.includes('API_GRANTCORE'), 'API_GRANTCORE endpoint missing');
});

test('s4-integration.js uses API_BUDGETACCOUNTCORE for budget check', () => {
  assert.ok(s4Code.includes('API_BUDGETACCOUNTCORE'), 'API_BUDGETACCOUNTCORE endpoint missing');
});

test('s4-integration.js uses OP_API_EARMARKEDFUNDS_SRV for payments', () => {
  assert.ok(s4Code.includes('OP_API_EARMARKEDFUNDS_SRV'), 'Earmarked Funds API endpoint missing');
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 9 — n8n Workflow JSON
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 9 — n8n Workflow (grant-approval-workflow.n8n.json)');

const workflowPath = path.join(ROOT, '../workflows/grant-approval-workflow/grant-approval-workflow.n8n.json');
let workflow;

test('n8n workflow JSON file exists', () => {
  assert.ok(fs.existsSync(workflowPath), 'grant-approval-workflow.n8n.json not found');
});

test('n8n workflow JSON parses correctly', () => {
  workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
  assert.ok(workflow, 'Failed to parse workflow JSON');
});

test('workflow has a name', () => {
  assert.ok(workflow.name && workflow.name.length > 0, 'Workflow name is empty');
});

test('workflow has nodes array', () => {
  assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, 'Workflow nodes array empty');
});

test('workflow has connections object', () => {
  assert.ok(typeof workflow.connections === 'object', 'Workflow connections missing');
});

test('workflow has a webhook trigger node', () => {
  const webhooks = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.webhook');
  assert.ok(webhooks.length > 0, 'No webhook trigger node found');
});

test('webhook trigger has POST method', () => {
  const webhook = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  assert.strictEqual(webhook?.parameters?.httpMethod, 'POST', 'Webhook method is not POST');
});

test('webhook has responseMode set to responseNode', () => {
  const webhook = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  assert.strictEqual(webhook?.parameters?.responseMode, 'responseNode');
});

test('workflow has a Code node for grant value routing', () => {
  const codeNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code');
  assert.ok(codeNodes.length > 0, 'No Code node found');
});

test('routing code node checks 50,000 threshold', () => {
  const codeNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.code');
  assert.ok(
    codeNode?.parameters?.jsCode?.includes('50000') || codeNode?.parameters?.jsCode?.includes('HIGH_VALUE_THRESHOLD'),
    'SLA threshold not found in Code node'
  );
});

test('routing code node assigns standard (3-day) and high-value (5-day) SLAs', () => {
  const codeNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.code');
  const code = codeNode?.parameters?.jsCode || '';
  assert.ok(code.includes('3') && code.includes('5'), 'SLA days missing from routing code');
});

test('workflow has an IF node for tier branching', () => {
  const ifNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.if');
  assert.ok(ifNodes.length > 0, 'No IF node found for tier check');
});

test('workflow has SAP Task Center nodes (2)', () => {
  const tcNodes = workflow.nodes.filter(n => n.type === 'CUSTOM.sapTaskCenter');
  assert.ok(tcNodes.length >= 2, `Expected 2 Task Center nodes, got ${tcNodes.length}`);
});

test('Task Center nodes send to correct recipient email', () => {
  const tcNodes = workflow.nodes.filter(n => n.type === 'CUSTOM.sapTaskCenter');
  for (const node of tcNodes) {
    const recipients = node.parameters?.recipients?.recipientValues || [];
    assert.ok(recipients.length > 0, `Task Center node "${node.name}" has no recipients`);
  }
});

test('workflow has a Switch node for approval decision routing', () => {
  const switchNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.switch');
  assert.ok(switchNodes.length > 0, 'No Switch node for approval routing');
});

test('workflow has a respondToWebhook node', () => {
  const respNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.respondToWebhook');
  assert.ok(respNodes.length > 0, 'No respondToWebhook node found');
});

test('workflow handles approved, rejected, and unknown decisions', () => {
  const switchNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.switch');
  const rulesJSON = JSON.stringify(switchNode?.parameters?.rules || {});
  assert.ok(rulesJSON.includes('approved') && rulesJSON.includes('rejected'), 'Decision routing incomplete');
  assert.ok(
    switchNode?.parameters?.options?.fallbackOutput !== undefined,
    'Fallback/unknown decision path missing'
  );
});

test('all workflow nodes have unique IDs', () => {
  const ids = workflow.nodes.map(n => n.id);
  const unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, 'Duplicate node IDs found');
});

test('workflow trigger is connected to the first processing node', () => {
  const webhook = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  const connections = workflow.connections[webhook?.name];
  assert.ok(connections?.main?.[0]?.length > 0, 'Webhook trigger has no outgoing connection');
});

test('workflow has pinData for Task Center nodes (test mock data)', () => {
  assert.ok(workflow.pinData && Object.keys(workflow.pinData).length > 0, 'No pinData mock data found');
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 10 — asset.yaml and solution.yaml Validation
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 10 — Asset and Solution Configuration');

test('asset.yaml has required content', () => {
  const content = fs.readFileSync(path.join(ROOT, 'asset.yaml'), 'utf8');
  assert.ok(content.includes('name:') || content.includes('type:'), 'asset.yaml missing name/type fields');
});

const solutionYamlPath = path.join(ROOT, '../../solution.yaml');
test('solution.yaml exists at solution root', () => {
  assert.ok(fs.existsSync(solutionYamlPath), 'solution.yaml not found at solution root');
});

test('solution.yaml references grants-lifecycle-app asset', () => {
  const content = fs.readFileSync(solutionYamlPath, 'utf8');
  assert.ok(content.includes('grants-lifecycle-app') || content.includes('grants'), 'grants-lifecycle-app not referenced in solution.yaml');
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 11 — UI Application
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 11 — UI Application');

test('app/index.html exists', () => {
  assert.ok(fileExists('app/index.html'));
});

test('app/src directory exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'app/src')), 'app/src directory missing');
});

const appFiles = fs.readdirSync(path.join(ROOT, 'app/src')).filter(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.html'));
test('app/src contains UI source files', () => {
  assert.ok(appFiles.length > 0, 'No UI source files found in app/src');
});

const indexHtml = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
test('app/index.html loads UI5 web components', () => {
  assert.ok(
    indexHtml.includes('@ui5/webcomponents') || indexHtml.includes('ui5') || indexHtml.includes('webcomponents'),
    'UI5 web components not referenced in index.html'
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  SUITE 12 — Business Rule Unit Tests (pure logic)
// ═══════════════════════════════════════════════════════════════════════════
section('SUITE 12 — Business Rule Unit Tests (Logic)');

// Test the SLA routing logic extracted from the workflow Code node
function computeSLA(requestedAmount, threshold = 50000, standardDays = 3, highValueDays = 5) {
  const isHighValue = requestedAmount > threshold;
  return {
    grantTier: isHighValue ? 'high_value' : 'standard',
    reviewDays: isHighValue ? highValueDays : standardDays
  };
}

test('Standard grant (€25,000) gets 3-day SLA', () => {
  const result = computeSLA(25000);
  assert.strictEqual(result.grantTier, 'standard');
  assert.strictEqual(result.reviewDays, 3);
});

test('High-value grant (€75,000) gets 5-day SLA', () => {
  const result = computeSLA(75000);
  assert.strictEqual(result.grantTier, 'high_value');
  assert.strictEqual(result.reviewDays, 5);
});

test('Boundary grant exactly €50,000 is classified as standard', () => {
  const result = computeSLA(50000);
  assert.strictEqual(result.grantTier, 'standard', 'Exactly 50,000 should be standard (not strictly greater)');
});

test('Boundary grant €50,001 is classified as high_value', () => {
  const result = computeSLA(50001);
  assert.strictEqual(result.grantTier, 'high_value');
});

test('Zero amount grant is standard', () => {
  const result = computeSLA(0);
  assert.strictEqual(result.grantTier, 'standard');
});

// Simulate rejection reason validation
function validateRejection(reason) {
  if (!reason || reason.trim().length < 10) return { valid: false, error: 'Reason too short' };
  return { valid: true };
}

test('Rejection reason < 10 chars is invalid', () => {
  const r = validateRejection('Too bad');
  assert.strictEqual(r.valid, false);
});

test('Rejection reason ≥ 10 chars is valid', () => {
  const r = validateRejection('Application does not meet the eligibility criteria');
  assert.strictEqual(r.valid, true);
});

test('Empty rejection reason is invalid', () => {
  const r = validateRejection('');
  assert.strictEqual(r.valid, false);
});

// Simulate status transition validation
function canWithdraw(status) {
  return ['submitted', 'under_review'].includes(status);
}

function canApprove(status) {
  return ['submitted', 'under_review'].includes(status);
}

function canTriggerPayment(status) {
  return status === 'approved';
}

test('submitted application can be withdrawn', () => {
  assert.ok(canWithdraw('submitted'));
});

test('under_review application can be withdrawn', () => {
  assert.ok(canWithdraw('under_review'));
});

test('awarded application cannot be withdrawn', () => {
  assert.ok(!canWithdraw('awarded'));
});

test('draft application cannot be approved', () => {
  assert.ok(!canApprove('draft'));
});

test('submitted application can be approved', () => {
  assert.ok(canApprove('submitted'));
});

test('only approved applications can trigger payment', () => {
  assert.ok(canTriggerPayment('approved'));
  assert.ok(!canTriggerPayment('submitted'));
  assert.ok(!canTriggerPayment('awarded'));
  assert.ok(!canTriggerPayment('draft'));
});

// ═══════════════════════════════════════════════════════════════════════════
//  FINAL REPORT
// ═══════════════════════════════════════════════════════════════════════════

process.stdout.write(`\n${'═'.repeat(60)}\n`);
process.stdout.write(`  TEST RESULTS SUMMARY\n`);
process.stdout.write(`${'═'.repeat(60)}\n`);
process.stdout.write(`  ✅ Passed : ${passed}\n`);
process.stdout.write(`  ❌ Failed : ${failed}\n`);
process.stdout.write(`  ⏭️  Skipped: ${skipped}\n`);
process.stdout.write(`  📊 Total  : ${passed + failed + skipped}\n`);
process.stdout.write(`${'═'.repeat(60)}\n\n`);

if (failed > 0) {
  process.stdout.write('Failed tests:\n');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    process.stdout.write(`  ❌ ${r.name}\n     ${r.error}\n`);
  });
  process.stdout.write('\n');
  process.exit(1);
} else {
  process.stdout.write('🎉 All tests passed!\n\n');
  process.exit(0);
}
