# Specification

> **Guidelines**: Read [guidelines.md](./guidelines.md) before executing ANY tasks below.

Check off items as completed.

## Solution Setup

- [x] Create asset directories: `mkdir -p assets/grants-lifecycle-app/ assets/workflows/grant-approval-workflow/`
- [x] Invoke `setup-solution` skill to create `solution.yaml` and `asset.yaml` files for every asset
- [x] Validate all `asset.yaml` and `solution.yaml` files exist and are well-formed

## Asset Implementation

- [x] Execute specification/grants-lifecycle-app/specification.md (all items)
- [x] Execute specification/grant-approval-workflow/specification.md (all items)
- [x] Cross-implementation compatibility check — verify CAP webhook endpoint matches n8n workflow trigger path; verify S/4HANA API credentials and destination names are consistent across both assets; verify role-based auth aligns between CAP and the portal UI
