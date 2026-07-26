import type { ReactNode } from "react"

import { CustomerPreviewChromeCleanup } from "@/components/workspace/customer-preview-chrome-cleanup"

export default function CustomerWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="customer-workspace-route contents">
      {children}
      <CustomerPreviewChromeCleanup />
    </div>
  )
}
