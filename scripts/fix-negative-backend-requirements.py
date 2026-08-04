from pathlib import Path

path = Path('lib/786-chat/specification.ts')
source = path.read_text()
source = source.replace(
'''    backendRequirements: unique(matches(prompt, [
      [/\\bdatabase|postgres|neon\\b/i, "database"],
      [functionalAuthRequested ? /[\\s\\S]/ : /(?!)\/, "authentication"],
      [/\\bapi\\b/i, "api"],
      [/\\bpayment|stripe\\b/i, "payments"],
      [/\\bemail\\b/i, "email"],
      [/\\bupload|attachment|file storage|blob\\b/i, "file-storage"],
    ])),''',
'''    backendRequirements: unique(matches(positivePrompt, [
      [/\\bdatabase|postgres|neon\\b/i, "database"],
      [functionalAuthRequested ? /[\\s\\S]/ : /(?!)\/, "authentication"],
      [/\\bapi\\b/i, "api"],
      [/\\bpayment|stripe\\b/i, "payments"],
      [/\\b(?:send|deliver|transactional|notification|contact)\\s+emails?\\b|\\bemail service\\b|\\bresend\\b/i, "email"],
      [/\\bupload|attachment|file storage|blob\\b/i, "file-storage"],
    ])),'''
)
if 'backendRequirements: unique(matches(positivePrompt' not in source:
    raise SystemExit('repair target not found')
path.write_text(source)
