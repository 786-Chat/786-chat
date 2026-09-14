// @ts-nocheck
// Object Storage ACL (Access Control List) system
// Referenced from blueprint:javascript_object_storage
import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

// ACL policy for branch-isolated file access
export interface ObjectAclPolicy {
  owner: string; // branchId for branch-owned files
  visibility: "public" | "private";
}

// Sets the ACL policy to the object metadata
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Gets the ACL policy from the object metadata
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

// Checks if the user can access the object
export async function canAccessObject({
  branchId,
  isAdmin,
  objectFile,
  requestedPermission,
}: {
  branchId?: string;
  isAdmin?: boolean;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Admins have full access to all objects
  if (isAdmin) {
    return true;
  }

  // Public objects are always accessible for read
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Access control requires the branch id
  if (!branchId) {
    return false;
  }

  // The owner (branch) of the object can always access it
  if (aclPolicy.owner === branchId) {
    return true;
  }

  return false;
}
