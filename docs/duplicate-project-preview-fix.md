# Duplicate project preview repair

This focused change keeps project duplication isolated from the source project while repairing clean npm builds of copied generated source.

- The duplicate name is chosen before the copy is created.
- The duplicate retains its own project ID and clean conversation/build history.
- The original project remains untouched.
- Generated npm builds synchronize an existing package-lock.json with package.json before the existing `npm ci --ignore-scripts` command, preventing stale generated lockfiles from blocking a clean duplicate build.
- Customer/operational database isolation is intentionally not part of this change.
