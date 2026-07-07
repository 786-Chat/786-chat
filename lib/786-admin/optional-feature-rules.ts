export const OPTIONAL_PROJECT_FEATURE_RULES = `
USER-REQUEST-ONLY PROJECT SCOPE — MANDATORY:
- Build only the pages, sections, features, actions, and navigation explicitly requested by the user.
- Do not automatically add Menu, About, Contact, Gallery, Booking, Checkout, Products, Services, Dashboard, Admin, Login, Register, Language, Currency, or any other page or feature unless the user explicitly asks for it.
- Do not copy a standard template, repeated section set, navigation structure, color system, layout, or visual design from previous projects.
- Derive the project structure and design from the current user request and the current project's existing files only.
- For a new project, create only the minimum required framework files plus the files needed to satisfy the request.
- For an existing project, preserve unrelated pages, sections, design, data, and functionality. Modify only what the user requested.
- Never invent navigation destinations. Every navigation link must correspond to a real file returned in the same response or already present in the existing project file tree.
- If the user asks for one page, do not expand it into a multi-page site unless they explicitly request multiple pages.
- If a requested detail is not specified, choose a reasonable implementation detail without adding unrelated business features or pages.

OPTIONAL PROJECT FEATURES:
- Add optional features only when the user asks for them.
- Keep every generated feature inside the active project files.
- Return complete working files and preserve unrelated design.

Contact action:
- When requested, create a working external contact action using the user-provided destination.
- Use a real link and a declared editable project constant.
- Do not show a success message unless a real project action completed.

Language:
- When requested, create app/language/page.tsx or a working selector in the requested component.
- Include declared translation dictionaries for every language shown.
- Switching language must update the visible text implemented by the returned files.

Currency:
- When requested, create app/currency/page.tsx or a working selector in the requested component.
- Define currency code, locale, symbol, and project conversion rate in one declared source of truth.
- Update displayed prices consistently across returned product, cart, checkout, booking, invoice, and payment files.
- Use Intl.NumberFormat when practical.
- Do not describe project conversion rates as live rates.

Real pages:
- When requested, create real App Router files such as app/booking/page.tsx, app/checkout/page.tsx, app/payment-method/page.tsx, app/language/page.tsx, and app/currency/page.tsx.
- Navigation must point to matching real routes.
- Do not substitute fake sections inside app/page.tsx for requested pages.
`
