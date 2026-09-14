// @ts-nocheck
// Object Storage service for permanent file persistence
// Referenced from blueprint:javascript_object_storage
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl.js";
import { lookup } from "mime-types";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set");
    return dir;
  }

  async uploadFile({
    localPath,
    branchId,
    category,
    filename,
  }: {
    localPath: string;
    branchId: string;
    category: string;
    filename: string;
  }): Promise<string> {
    // Vercel deployment: persist documents/photos/reports in Vercel Blob.
    if (process.env.VERCEL && category !== "logos") {
      const { put } = await import("@vercel/blob");
      const fileBuffer = await readFile(localPath);
      const mimeType = lookup(filename) || "application/octet-stream";
      const objectId = randomUUID();
      const extension = filename.split(".").pop() || "bin";
      const safeBranchId = String(branchId || "admin").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeCategory = String(category || "documents").replace(/[^a-zA-Z0-9_-]/g, "_");
      const pathname = `pest-control/${safeBranchId}/${safeCategory}/${objectId}.${extension}`;
      await put(pathname, fileBuffer, {
        access: "private",
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return `/objects/vercel/${encodeURIComponent(pathname)}`;
    }

    // Branch logos stay persisted in the existing DB field on Vercel.
    if (!process.env.PRIVATE_OBJECT_DIR && category === "logos") {
      const mimeType = lookup(filename) || "application/octet-stream";
      const fileBuffer = await readFile(localPath);
      return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    }

    const privateDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const extension = filename.split(".").pop() || "";
    const objectName = `branch/${branchId}/${category}/${objectId}.${extension}`;
    const fullPath = `${privateDir}/${objectName}`;
    const { bucketName, objectName: objName } = this.parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objName);

    await bucket.upload(localPath, {
      destination: objName,
      metadata: { contentType: lookup(filename) || "application/octet-stream" },
    });

    await setObjectAclPolicy(file, {
      owner: branchId,
      visibility: "private",
    });

    return `/objects/${objectName}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (process.env.VERCEL && objectPath.startsWith("/objects/vercel/")) {
      const pathname = decodeURIComponent(objectPath.slice("/objects/vercel/".length));
      const parts = pathname.split("/");
      const ownerBranchId = parts.length >= 2 ? parts[1] : "";
      return { __vercelBlobPath: pathname, __ownerBranchId: ownerBranchId } as unknown as File;
    }

    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) entityDir = `${entityDir}/`;
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = this.parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) throw new ObjectNotFoundError();
    return objectFile;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 86400) {
    const vercelBlobPath = (file as unknown as { __vercelBlobPath?: string }).__vercelBlobPath;
    if (process.env.VERCEL && vercelBlobPath) {
      try {
        const { get } = await import("@vercel/blob");
        const result = await get(vercelBlobPath, { access: "private" });
        if (!result || result.statusCode !== 200) {
          res.sendStatus(404);
          return;
        }
        res.set({
          "Content-Type": result.blob.contentType || "application/octet-stream",
          "Cache-Control": `private, max-age=${cacheTtlSec}`,
        });
        const { Readable } = await import("node:stream");
        Readable.fromWeb(result.stream as any).pipe(res);
        return;
      } catch (error) {
        console.error("Error serving Vercel Blob:", error);
        if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });
        return;
      }
    }

    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  async canAccessObjectEntity({
    branchId,
    isAdmin,
    objectFile,
    requestedPermission,
  }: {
    branchId?: string;
    isAdmin?: boolean;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    const vercelMeta = objectFile as unknown as { __vercelBlobPath?: string; __ownerBranchId?: string };
    if (process.env.VERCEL && vercelMeta.__vercelBlobPath) {
      return Boolean(isAdmin || (branchId && vercelMeta.__ownerBranchId === branchId));
    }
    return canAccessObject({
      branchId,
      isAdmin,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  private parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) path = `/${path}`;
    const pathParts = path.split("/");
    if (pathParts.length < 3) throw new Error("Invalid path: must contain at least a bucket name");
    return {
      bucketName: pathParts[1],
      objectName: pathParts.slice(2).join("/"),
    };
  }
}
