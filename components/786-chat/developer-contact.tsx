export function DeveloperContact() {
  return (
    <>
      <aside className="developer-contact-settings fixed bottom-6 right-6 z-50 hidden w-[280px] rounded-xl border border-violet-300/20 bg-[#0d1526]/95 p-3 shadow-[0_14px_34px_rgba(0,0,0,.35)] backdrop-blur-xl">
        <details>
          <summary className="cursor-pointer text-[13px] font-black text-violet-200">Developer support</summary>
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="text-[14px] font-black text-white">Mujeeb Developer</p>
            <a
              href="tel:+447427070000"
              className="mt-1 block text-[14px] font-bold text-cyan-200 transition hover:text-cyan-100"
              aria-label="Call Mujeeb Developer on +44 7427 070000"
            >
              +44 7427 070000
            </a>
          </div>
        </details>
      </aside>
      <style>{`
        body:has(button[aria-label="Close Settings"]) .developer-contact-settings {
          display: block !important;
        }
        @media (max-width: 640px) {
          .developer-contact-settings {
            left: 12px;
            right: 12px;
            bottom: 12px;
            width: auto;
          }
        }
      `}</style>
    </>
  )
}
