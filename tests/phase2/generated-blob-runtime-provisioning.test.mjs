import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const source = await readFile("lib/786-admin/vercel-project-deployer.ts", "utf8")

assert.match(source, /function generatedUsesBlob\(/)
assert.match(source, /@vercel\\\/blob\|BLOB_READ_WRITE_TOKEN/)
assert.match(source, /https:\/\/api\.vercel\.com\/storage\/stores\/blob/)
assert.match(source, /access:\s*"private"/)
assert.match(source, /projectId:\s*input\.vercelProjectId/)

const projectSetup = source.indexOf("const vercelProjectId = await ensureVercelProject")
const blobSetup = source.indexOf("await ensureGeneratedBlobStore")
const deployRequest = source.indexOf('new URL("https://api.vercel.com/v13/deployments")')

assert.ok(projectSetup >= 0, "generated Vercel project should be ensured first")
assert.ok(blobSetup > projectSetup, "Blob store should be attached after the Vercel project exists")
assert.ok(deployRequest > blobSetup, "Blob store should be attached before creating the deployment")

console.log("generated blob runtime provisioning checks passed")
