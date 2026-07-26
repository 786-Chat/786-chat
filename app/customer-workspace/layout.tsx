import type { ReactNode } from "react"

export default function CustomerWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="customer-workspace-route contents">
      {children}
      <style>{`
        /* The approved workspace already provides Preview, Code and Refresh
           controls in the main header. Remove the older duplicate preview
           title, status and device rows from the embedded customer panel. */
        .customer-workspace-route
          .customer-approved-preview
          > div[style*="linear-gradient(180deg"]
          > :nth-child(-n + 3) {
          display: none !important;
        }

        .customer-workspace-route
          .customer-approved-preview
          > div[style*="linear-gradient(180deg"]
          > :last-child {
          min-height: 0 !important;
          flex: 1 1 0% !important;
        }
      `}</style>
    </div>
  )
}
