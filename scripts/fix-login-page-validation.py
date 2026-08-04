from pathlib import Path

path = Path("lib/786-chat/specification.ts")
text = path.read_text()

old = '''  const loginRequested = /\\blog[ -]?in|sign[ -]?in\\b/i.test(positivePrompt)
  const requestedRoutes = explicitRoutes(prompt)
'''
new = '''  const loginRequested = /\\blog[ -]?in|sign[ -]?in\\b/i.test(positivePrompt)
  // A request for a login/register page can be a visual UI request only. Do not
  // force a complete database-backed authentication system unless the customer
  // explicitly asks for functional authentication, accounts, sessions or a backend.
  const functionalAuthRequested = /\\bauth(?:entication|orization)?\\b|\\b(?:working|functional|secure|real|database[- ]backed)\\s+(?:log[ -]?in|sign[ -]?in|register|sign[ -]?up)\\b|\\buser accounts?\\b|\\baccount system\\b|\\bsessions?\\b/i.test(positivePrompt)
  const requestedRoutes = explicitRoutes(prompt)
'''
if old not in text:
    raise SystemExit("login marker not found")
text = text.replace(old, new)

old = '''    ...(/\\bapi|backend|server|saas|crm|erp|auth|log[ -]?in|register|upload|attachment|email\\b/i.test(positivePrompt) || systemBlueprint ? ["backend"] : []),
    ...(/\\bdatabase|postgres|neon|relational|auth|log[ -]?in|register|upload|attachment\\b/i.test(positivePrompt) || systemBlueprint ? ["database"] : []),
'''
new = '''    ...(/\\bapi|backend|server|saas|crm|erp|upload|attachment|email\\b/i.test(positivePrompt) || functionalAuthRequested || systemBlueprint ? ["backend"] : []),
    ...(/\\bdatabase|postgres|neon|relational|upload|attachment\\b/i.test(positivePrompt) || functionalAuthRequested || systemBlueprint ? ["database"] : []),
'''
if old not in text:
    raise SystemExit("platform marker not found")
text = text.replace(old, new)

old = '''      [/\\bauth|log[ -]?in|register\\b/i, "authentication"],
'''
new = '''      [functionalAuthRequested ? /[\\s\\S]/ : /(?!)/, "authentication"],
'''
if old not in text:
    raise SystemExit("backend requirement marker not found")
text = text.replace(old, new)

path.write_text(text)
