# grant-approval-workflow — n8n Workflow Specification

> **Guidelines**: Read [../guidelines.md](../guidelines.md) and [../guidelines-n8n-workflow.md](../guidelines-n8n-workflow.md) before executing ANY tasks below.

## Asset Details
- **Asset name**: `grant-approval-workflow`
- **Asset folder**: `assets/workflows/grant-approval-workflow/`
- **Asset type**: `n8nworkflow`
- **Feature**: Automated grant application review routing, SLA monitoring, approval escalation, status notifications

## Confirmed Nodes (from catalog)
| Node | type | typeVersion |
|------|------|-------------|
| Webhook | `n8n-nodes-base.webhook` | 2.1 |
| If | `n8n-nodes-base.if` | 2.3 |
| Switch | `n8n-nodes-base.switch` | 3.4 |
| SAP Task Center | `CUSTOM.sapTaskCenter` | 1 |
| Edit Fields (Set) | `n8n-nodes-base.set` | 3.4 |
| Respond to Webhook | `n8n-nodes-base.respondToWebhook` | 1.5 |
| Code | `n8n-nodes-base.code` | 2 |

## Approval Recipient
- SAP Task Center recipient: `gopalchandra.vankar@sap.com`

## Workflow Design

**Trigger**: Webhook POST from CAP `applicant-service` when a grant application is submitted
**Purpose**: Route the application for review, send it to SAP Task Center for approval, and respond with the decision

### Flow:
```
Grant Application Submitted (Webhook)
  → Set Application Context (Edit Fields)
  → Route By Grant Value (Switch)
      → Standard (≤ 50,000): Approve Grant Application (SAP Task Center)
      → High Value (> 50,000): Approve Grant Application (SAP Task Center) [HIGH priority]
      → Fallback: Set Error Response
  → Route Approval Decision (Switch on $json.result.response)
      → approved: Set Approved Response
      → rejected: Set Rejected Response
      → Fallback: Set Unknown Decision Response
  → Respond to CAP
```

## SLA Configuration
```javascript
const SLA_CONFIG = {
  STANDARD_REVIEW_DAYS: 3,
  HIGH_VALUE_THRESHOLD: 50000,
  HIGH_VALUE_REVIEW_DAYS: 5,
  ADMIN_EMAIL: "gopalchandra.vankar@sap.com"
};
```

## Tasks

### Setup
- [ ] Create folder `assets/workflows/grant-approval-workflow/`

### Build Workflow JSON
- [ ] Construct full workflow JSON in memory with all nodes and connections (single write):

  **Node: "Grant Application Submitted"** (Webhook trigger)
  - type: `n8n-nodes-base.webhook`, typeVersion: 2.1
  - httpMethod: POST
  - responseMode: `responseNode`
  - path: `grant-application-submitted` (will be rewritten by script)

  **Node: "Set Application Context"** (Edit Fields)
  - type: `n8n-nodes-base.set`, typeVersion: 3.4
  - Sets: `applicationId` ← `$json.body.applicationId`, `grantId` ← `$json.body.grantId`, `requestedAmount` ← `$json.body.requestedAmount`, `applicantEmail` ← `$json.body.applicantEmail`, `submittedAt` ← `$json.body.submittedAt`

  **Node: "Route By Grant Value"** (Code node with SLA_CONFIG constant)
  - type: `n8n-nodes-base.code`, typeVersion: 2
  - Place SLA_CONFIG constant at top: `HIGH_VALUE_THRESHOLD: 50000`, `STANDARD_REVIEW_DAYS: 3`, `HIGH_VALUE_REVIEW_DAYS: 5`, `ADMIN_EMAIL: "gopalchandra.vankar@sap.com"`
  - Adds field `grantTier` = `"high_value"` if requestedAmount > HIGH_VALUE_THRESHOLD, else `"standard"`
  - Adds `slaDeadline` = now + SLA_REVIEW_DAYS days (ISO string)
  - Adds sticky note above this node

  **Node: "Check Grant Tier"** (If node)
  - type: `n8n-nodes-base.if`, typeVersion: 2.3
  - Condition: `$json.grantTier` equals `"high_value"`
  - true → "Approve High Value Grant" (Task Center, HIGH priority)
  - false → "Approve Standard Grant" (Task Center, MEDIUM priority)

  **Node: "Approve Standard Grant"** (SAP Task Center)
  - type: `CUSTOM.sapTaskCenter`, typeVersion: 1
  - subject: `="Grant Application Review: " + $json.applicationId`
  - priority: `MEDIUM`
  - description: `="A standard grant application has been submitted requiring your review. Application ID: " + $json.applicationId + " | Grant ID: " + $json.grantId + " | Requested Amount: " + $json.requestedAmount + " | Submitted: " + $json.submittedAt`
  - dueDate: `={{ $json.slaDeadline }}`
  - taskDefinition.definitionName: `"Approve Standard Grant"`
  - recipients.recipientValues: `[{ userId: "gopalchandra.vankar@sap.com" }]`
  - autoDetectCustomAttributes: false
  - customAttributeDefinitions.attributes: applicationId (STRING), requestedAmount (FLOAT), grantId (STRING), applicantEmail (STRING)

  **Node: "Approve High Value Grant"** (SAP Task Center)
  - type: `CUSTOM.sapTaskCenter`, typeVersion: 1
  - subject: `="[HIGH VALUE] Grant Application Review: " + $json.applicationId`
  - priority: `HIGH`
  - description: `="A HIGH VALUE grant application has been submitted requiring urgent review. Application ID: " + $json.applicationId + " | Grant ID: " + $json.grantId + " | Requested Amount: " + $json.requestedAmount + " | Submitted: " + $json.submittedAt`
  - dueDate: `={{ $json.slaDeadline }}`
  - taskDefinition.definitionName: `"Approve High Value Grant"`
  - recipients.recipientValues: `[{ userId: "gopalchandra.vankar@sap.com" }]`
  - autoDetectCustomAttributes: false
  - customAttributeDefinitions.attributes: applicationId (STRING), requestedAmount (FLOAT), grantId (STRING), applicantEmail (STRING)

  **Node: "Route Approval Decision"** (Switch — on `$json.result.response`)
  - type: `n8n-nodes-base.switch`, typeVersion: 3.4
  - mode: rules
  - Rule 1: `$json.result.response` equals `"approved"` → output key: "approved"
  - Rule 2: `$json.result.response` equals `"rejected"` → output key: "rejected"
  - options.fallbackOutput: `"extra"` (renameFallbackOutput: "unknown")

  **Node: "Set Approved Response"** (Edit Fields)
  - type: `n8n-nodes-base.set`, typeVersion: 3.4
  - Sets: `decision` = "approved", `applicationId` ← `$('Set Application Context').item.json.applicationId`, `message` = "Grant application approved and ready for award processing"

  **Node: "Set Rejected Response"** (Edit Fields)
  - type: `n8n-nodes-base.set`, typeVersion: 3.4
  - Sets: `decision` = "rejected", `applicationId` ← `$('Set Application Context').item.json.applicationId`, `message` = "Grant application has been rejected by the reviewer"

  **Node: "Set Unknown Decision Response"** (Edit Fields)
  - type: `n8n-nodes-base.set`, typeVersion: 3.4
  - Sets: `decision` = "unknown", `applicationId` ← `$('Set Application Context').item.json.applicationId`, `message` = "Approval decision could not be determined"

  **Node: "Respond to CAP"** (Respond to Webhook)
  - type: `n8n-nodes-base.respondToWebhook`, typeVersion: 1.5
  - respondWith: `json`
  - responseBody: `={{ JSON.stringify({ decision: $json.decision, applicationId: $json.applicationId, message: $json.message }) }}`
  - options.responseCode: 200

  **Connections**:
  - Grant Application Submitted → Set Application Context
  - Set Application Context → Route By Grant Value
  - Route By Grant Value → Check Grant Tier
  - Check Grant Tier [false/standard] → Approve Standard Grant
  - Check Grant Tier [true/high_value] → Approve High Value Grant
  - Approve Standard Grant → Route Approval Decision
  - Approve High Value Grant → Route Approval Decision
  - Route Approval Decision [approved] → Set Approved Response
  - Route Approval Decision [rejected] → Set Rejected Response
  - Route Approval Decision [unknown/fallback] → Set Unknown Decision Response
  - Set Approved Response → Respond to CAP
  - Set Rejected Response → Respond to CAP
  - Set Unknown Decision Response → Respond to CAP

  > Note: The three Switch output branches are exclusive (only one fires), so they connect directly to "Respond to CAP" — no Merge node needed (Rule 8, case 1).

- [ ] Fetch pinData schemas via `pin-data-schemas` tool for all node types and embed sample pinData
- [ ] Validate with `validate-n8n-workflow` MCP tool — fix any errors before writing
- [ ] Write workflow JSON to `assets/workflows/grant-approval-workflow/grant-approval-workflow.n8n.json` (single write)

### Generate asset.yaml
- [ ] Run `generate-workflow-asset.js` script:
  ```bash
  node skills/n8n-workflow/scripts/generate-workflow-asset.js \
    assets/workflows/grant-approval-workflow/grant-approval-workflow.n8n.json \
    grant-approval-workflow \
    grants-lifecycle-cecaf
  ```
- [ ] Create `assets/workflows/grant-approval-workflow/asset.yaml` using script output, filling in description for `kind: rest` entry

### Validation Checklist
- [ ] Workflow JSON is well-formed (valid JSON, no syntax errors)
- [ ] All nodes reachable from the Webhook trigger
- [ ] Webhook responseMode is `responseNode` and a Respond to Webhook node is on every branch
- [ ] SAP Task Center nodes have contextual names (not generic "SAP Task Center")
- [ ] SAP Task Center nodes have explicit recipient (`gopalchandra.vankar@sap.com`)
- [ ] SLA_CONFIG constant block is at top of Code node with sticky note above it
- [ ] Route Approval Decision Switch has fallback output configured
- [ ] No HTTP Request nodes used
- [ ] No credentials blocks embedded
- [ ] `validate-n8n-workflow` passes
