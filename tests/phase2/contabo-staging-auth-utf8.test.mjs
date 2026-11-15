import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import vm from "node:vm"
import { webcrypto } from "node:crypto"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../proxy.ts"), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status ?? 200
  }
  static next() { return new MockResponse("next") }
  static json(body, init) { return new MockResponse(body, init) }
  static redirect() { return new MockResponse("redirect", { status: 302 }) }
}

function fixture(password) {
  const exports = {}
  const environment = {
    CONTABO_STAGING_ONLY: "1",
    DATABASE_PROVIDER: "postgres",
    CONTABO_STAGING_HOSTNAME: "staging.786.chat",
    CONTABO_STAGING_ACCESS_USER: "786stagingadmin",
    CONTABO_STAGING_ACCESS_PASSWORD: password,
    JWT_SECRET: "",
  }
  vm.runInNewContext(compiled, {
    exports,
    require(id) {
      if (id === "next/server") return { NextResponse: MockResponse }
      if (id === "jose") return { jwtVerify: async () => { throw new Error("not used") } }
      if (id === "@/lib/admin-config") return { ADMIN_EMAIL: "admin@example.test" }
      throw new Error("Unexpected module " + id)
    },
    process: { env: environment },
    console: { error() {} },
    URL, TextDecoder, TextEncoder, Uint8Array, Buffer,
    crypto: webcrypto,
    atob,
  })
  const request = header => ({
    url: "https://staging.786.chat/",
    nextUrl: { pathname: "/", search: "" },
    headers: { get: key => key.toLowerCase() === "host" ? "staging.786.chat" : key.toLowerCase() === "authorization" ? header : null },
    cookies: { get: () => undefined },
  })
  return { proxy: exports.proxy, request }
}

test("UTF-8 Basic credentials authenticate staging with non-ASCII password", async () => {
  const password = "passphrase-€-🌍-ok!"
  assert.ok(password.length >= 16)
  const { proxy, request } = fixture(password)
  const authorization = "Basic " + Buffer.from("786stagingadmin:" + password, "utf8").toString("base64")
  const response = await proxy(request(authorization))
  assert.equal(response.status, 200)
  assert.equal(response.body, "next")
})

test("staging still rejects an incorrect password and malformed base64", async () => {
  const { proxy, request } = fixture("passphrase-€-🌍-ok!")
  for (const header of [
    "Basic " + Buffer.from("786stagingadmin:wrong-password", "utf8").toString("base64"),
    "Basic not-valid-@-base64",
    "",
  ]) {
    const response = await proxy(request(header))
    assert.equal(response.status, 401)
    assert.equal(response.body, "Staging login required")
  }
})
