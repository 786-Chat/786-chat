const assert = require("node:assert/strict")
const pattern = /\{\s*activeTab\s*===\s*["']branch-login-video["']\s*&&\s*\(\s*\)\s*\}/g
const source = `before\n{activeTab === "branch-login-video" && (\n  \n)}\nafter`
assert.equal(source.replace(pattern, ""), "before\n\nafter")
console.log("Pest Control empty branch-login-video cleanup verified")
