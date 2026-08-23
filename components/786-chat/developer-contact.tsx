export function DeveloperContact() {
  return (
    <aside className="fixed bottom-[86px] left-2 z-30 hidden w-[200px] rounded-xl border border-violet-300/20 bg-[#0d1526]/95 p-3 shadow-[0_14px_34px_rgba(0,0,0,.35)] backdrop-blur-xl xl:block">
      <p className="text-[12px] font-black uppercase tracking-[.14em] text-violet-300">Developer support</p>
      <p className="mt-2 text-[14px] font-black text-white">Mujeeb Developer</p>
      <a
        href="tel:+447427070000"
        className="mt-1 block text-[14px] font-bold text-cyan-200 transition hover:text-cyan-100"
        aria-label="Call Mujeeb Developer on +44 7427 070000"
      >
        +44 7427 070000
      </a>
    </aside>
  )
}
