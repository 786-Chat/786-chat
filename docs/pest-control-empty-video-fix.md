# Pest Control empty branch video JSX repair

The Pest Control deployment hardening can remove the Branch Login video manager content while leaving an empty JSX conditional in `client/src/pages/AdminDashboard.tsx`.

The publish callback now runs `removePestControlEmptyBranchVideoJsx` after all Pest Control hardening steps. The helper is scoped to project `22c299f8-bf65-410f-9643-92a9776dbfca` and removes only an empty `activeTab === "branch-login-video" && (...)` wrapper.

This prevents Vite/esbuild from failing with `Unexpected ")"` on fresh generated publishes without modifying the approved Branch Login presentation or its embedded cat/device asset.
