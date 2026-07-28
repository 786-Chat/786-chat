# Stale preview React reset

When a deleted or missing project remains in browser or React memory, the admin chat now clears browser project state and invokes the page's existing **New Chat** action. This removes the project from the React tree and prevents the missing-project iframe from being recreated.
