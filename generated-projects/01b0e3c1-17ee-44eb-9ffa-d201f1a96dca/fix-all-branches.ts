import { Storage } from "@google-cloud/storage";
import * as fs from "fs";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account" as any,
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

async function upload(localPath: string, cloudName: string, contentType: string) {
  if (!fs.existsSync(localPath)) {
    console.log(`✗ Not found: ${localPath}`);
    return null;
  }
  const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0];
  const buffer = fs.readFileSync(localPath);
  const fullPath = `${publicPath}/${cloudName}`;
  const pathParts = fullPath.split("/").filter(p => p);
  const bucket = objectStorageClient.bucket(pathParts[0]);
  const file = bucket.file(pathParts.slice(1).join("/"));
  await file.save(buffer, { contentType });
  console.log(`✓ Uploaded: ${cloudName}`);
  return `/objects/public/${cloudName}`;
}

async function main() {
  // Upload images for branches that need them
  const uploads = [
    // Tawa logo
    { local: "uploads/1764520208825-oytkotqax.png", cloud: "tawa-logo.png", type: "image/png" },
    // DHABA hero
    { local: "attached_assets/Delicious_Specia_(3)_1765063846792.png", cloud: "dhaba-hero.png", type: "image/png" },
    // Emparo hero
    { local: "uploads/hero-exterior-1.jpg", cloud: "emparo-hero.jpg", type: "image/jpeg" },
    // Dixy hero
    { local: "uploads/1764538032539-88moo7cte.jpg", cloud: "dixy-hero.jpg", type: "image/jpeg" },
    // Top Dixie hero
    { local: "uploads/1764470061604-nbn3drbn5.jpg", cloud: "topdixie-hero.jpg", type: "image/jpeg" },
    // Peri Peri hero  
    { local: "uploads/1764463922467-ds4e98q8e.jpg", cloud: "periperi-hero.jpg", type: "image/jpeg" },
  ];

  for (const u of uploads) {
    await upload(u.local, u.cloud, u.type);
  }
}

main().catch(console.error);
