// Grandstream UCM6300 series HTTPS API client
// Reference: UCM6300 HTTP API Guide. Uses challenge/response with MD5.
import crypto from "crypto";
import { Agent } from "undici";

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");

export interface UcmServer {
  host: string;
  apiPort: number;
  username: string;
  apiSecret: string;
}

export class UcmClient {
  private cookie: string | null = null;
  private dispatcher: any;
  private url: string;

  constructor(private cfg: UcmServer) {
    this.dispatcher = new Agent({
      connect: { rejectUnauthorized: false },
      headersTimeout: 10000,
      bodyTimeout: 10000,
    });
    this.url = `https://${cfg.host}:${cfg.apiPort}/api`;
  }

  private async post(payload: any): Promise<any> {
    const r: any = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // @ts-ignore undici dispatcher
      dispatcher: this.dispatcher,
    });
    const text = await r.text();
    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error(`UCM non-JSON response (${r.status}): ${text.slice(0, 200)}`); }
    if (json.status !== 0 && json.status !== undefined) {
      const msg = json.response?.error || json.message || `UCM error status ${json.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return json.response || json;
  }

  async login(): Promise<void> {
    // 1) challenge
    const challengeRes = await this.post({
      request: { action: "challenge", user: this.cfg.username, version: "1.0.0.10" },
    });
    const challenge = challengeRes.challenge;
    if (!challenge) throw new Error("UCM challenge missing in response");
    // 2) compute token: md5(challenge + password)
    const token = md5(challenge + this.cfg.apiSecret);
    // 3) login
    const loginRes = await this.post({
      request: { action: "login", token, user: this.cfg.username },
    });
    this.cookie = loginRes.cookie;
    if (!this.cookie) throw new Error("UCM login did not return cookie");
  }

  private async call(action: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.cookie) await this.login();
    return this.post({ request: { action, cookie: this.cookie, ...params } });
  }

  async logout(): Promise<void> {
    if (!this.cookie) return;
    try { await this.call("logout"); } catch {}
    this.cookie = null;
  }

  // ── SIP Trunks ────────────────────────────────────────────────────────────
  async createTrunk(t: {
    trunkName: string;
    hostname: string;
    username: string;
    password: string;
    authId?: string;
    fromUser?: string;
    transport?: "udp" | "tcp" | "tls";
  }) {
    return this.call("addSIPTrunk", {
      trunk_name: t.trunkName,
      provider: t.hostname,
      username: t.username,
      secret: t.password,
      auth_id: t.authId || t.username,
      from_user: t.fromUser || t.username,
      transport: t.transport || "udp",
      need_register: "yes",
      keepalive: "yes",
    });
  }

  async listTrunks() { return this.call("listSIPTrunk"); }
  async deleteTrunk(trunkId: string) { return this.call("deleteSIPTrunk", { trunk: trunkId }); }

  // ── Extensions (SIP accounts) ─────────────────────────────────────────────
  async createExtension(e: {
    extension: string;
    fullName: string;
    secret: string;
    voicemailPin?: string;
    email?: string;
  }) {
    return this.call("addSIPAccount", {
      extension: e.extension,
      fullname: e.fullName,
      secret: e.secret,
      vm_secret: e.voicemailPin || "1234",
      email: e.email || "",
      enable_vm: "yes",
    });
  }

  async updateExtension(extensionNumber: string, patch: Record<string, any>) {
    return this.call("updateSIPAccount", { extension: extensionNumber, ...patch });
  }

  async deleteExtension(extensionNumber: string) {
    return this.call("deleteSIPAccount", { extension: extensionNumber });
  }

  async listExtensions() { return this.call("listAccount"); }

  // ── Ring Groups ───────────────────────────────────────────────────────────
  async createRingGroup(g: {
    name: string;
    extension: string;
    members: string[];           // extension numbers
    strategy?: "ringall" | "linear" | "random" | "memory";
    timeout?: number;
  }) {
    return this.call("addRingGroup", {
      ring_group_name: g.name,
      extension: g.extension,
      members: g.members.join(","),
      strategy: g.strategy || "ringall",
      ring_timeout: g.timeout || 20,
    });
  }

  async deleteRingGroup(extension: string) {
    return this.call("deleteRingGroup", { extension });
  }

  // ── Inbound Routes (DID routing) ──────────────────────────────────────────
  async createInboundRoute(r: {
    didPattern: string;             // e.g. "_." or "442039514641"
    trunkId: string;                // UCM internal trunk id
    destinationType: "extension" | "ringgroup" | "voicemail" | "ivr" | "external";
    destination: string;            // ext number / ringgroup ext / vm box / ivr id / E.164
    name?: string;
  }) {
    const destMap: Record<string, string> = {
      extension: "account",
      ringgroup: "ringgroup",
      voicemail: "voicemail",
      ivr: "ivr",
      external: "dial",
    };
    return this.call("addInboundRoute", {
      did_pattern: r.didPattern,
      trunk: r.trunkId,
      destination_type: destMap[r.destinationType],
      destination: r.destination,
      route_name: r.name || `route-${r.didPattern}`,
    });
  }

  async deleteInboundRoute(routeId: string) {
    return this.call("deleteInboundRoute", { route_id: routeId });
  }
}

export async function withUcmClient<T>(server: UcmServer, fn: (c: UcmClient) => Promise<T>): Promise<T> {
  const c = new UcmClient(server);
  try {
    await c.login();
    return await fn(c);
  } finally {
    await c.logout();
  }
}
