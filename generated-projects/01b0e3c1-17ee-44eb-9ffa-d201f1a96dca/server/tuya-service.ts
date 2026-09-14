import crypto from "crypto";

const TUYA_BASE_URL = "https://openapi.tuyaeu.com";

let cachedToken: { access_token: string; expire_time: number } | null = null;

function getCredentials() {
  const accessId = process.env.TUYA_ACCESS_ID;
  const accessSecret = process.env.TUYA_ACCESS_SECRET;
  if (!accessId || !accessSecret) {
    throw new Error("Tuya credentials not configured");
  }
  return { accessId, accessSecret };
}

function sign(accessId: string, accessSecret: string, t: string, token: string, method: string, path: string, body: string = "") {
  const contentHash = crypto.createHash("sha256").update(body || "").digest("hex");
  const stringToSign = [method, contentHash, "", path].join("\n");
  const signStr = accessId + token + t + stringToSign;
  return crypto.createHmac("sha256", accessSecret).update(signStr).digest("hex").toUpperCase();
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expire_time) {
    return cachedToken.access_token;
  }

  const { accessId, accessSecret } = getCredentials();
  const t = Date.now().toString();
  const path = "/v1.0/token?grant_type=1";
  const signature = sign(accessId, accessSecret, t, "", "GET", path);

  const res = await fetch(`${TUYA_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "client_id": accessId,
      "sign": signature,
      "t": t,
      "sign_method": "HMAC-SHA256",
    },
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Tuya token error: ${data.msg || JSON.stringify(data)}`);
  }

  cachedToken = {
    access_token: data.result.access_token,
    expire_time: Date.now() + (data.result.expire_time * 1000) - 60000,
  };

  return cachedToken.access_token;
}

async function tuyaRequest(method: string, path: string, body?: any): Promise<any> {
  const { accessId, accessSecret } = getCredentials();
  const token = await getToken();
  const t = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const signature = sign(accessId, accessSecret, t, token, method, path, bodyStr);

  const headers: Record<string, string> = {
    "client_id": accessId,
    "access_token": token,
    "sign": signature,
    "t": t,
    "sign_method": "HMAC-SHA256",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${TUYA_BASE_URL}${path}`, {
    method,
    headers,
    body: bodyStr || undefined,
  });

  const data = await res.json();
  return data;
}

export async function testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const token = await getToken();
    if (token) {
      return { success: true, message: "Connected to Tuya Cloud API successfully" };
    }
    return { success: false, message: "Failed to obtain access token" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getTuyaDevices(pageNo: number = 1, pageSize: number = 20): Promise<any> {
  const result = await tuyaRequest("GET", `/v1.0/devices?page_no=${pageNo}&page_size=${pageSize}`);
  return result;
}

export async function getUserDevices(uid: string): Promise<any> {
  const result = await tuyaRequest("GET", `/v1.0/users/${uid}/devices`);
  return result;
}

export async function getDeviceInfo(deviceId: string): Promise<any> {
  const result = await tuyaRequest("GET", `/v1.0/devices/${deviceId}`);
  return result;
}

export async function getDeviceStatus(deviceId: string): Promise<any> {
  const result = await tuyaRequest("GET", `/v1.0/devices/${deviceId}/status`);
  return result;
}

export async function sendDeviceCommands(deviceId: string, commands: Array<{ code: string; value: any }>): Promise<any> {
  const result = await tuyaRequest("POST", `/v1.0/devices/${deviceId}/commands`, { commands });
  return result;
}

export async function getDeviceLogs(deviceId: string, startTime: number, endTime: number, type: string = "7"): Promise<any> {
  const result = await tuyaRequest("GET", `/v1.0/devices/${deviceId}/logs?start_time=${startTime}&end_time=${endTime}&type=${type}&size=20`);
  return result;
}

export async function getAllTuyaDevices(): Promise<any> {
  const usersResult = await tuyaRequest("GET", `/v1.0/apps/users?page_no=1&page_size=20`);
  if (usersResult.success && usersResult.result?.list?.length > 0) {
    const allDevices: any[] = [];
    for (const user of usersResult.result.list) {
      const devicesResult = await tuyaRequest("GET", `/v1.0/users/${user.uid}/devices`);
      if (devicesResult.success && devicesResult.result) {
        allDevices.push(...devicesResult.result);
      }
    }
    return { success: true, result: allDevices };
  }

  const directResult = await tuyaRequest("GET", `/v1.0/iot-03/devices?page_no=1&page_size=100`);
  if (directResult.success) return directResult;

  const result2 = await tuyaRequest("GET", `/v1.0/devices?page_no=1&page_size=100`);
  if (result2.success) return result2;

  const specificDeviceIds = [
    "bfd22febfe6441f5c7267r",
    "31670524a4cf12c0a109"
  ];
  const devices: any[] = [];
  for (const did of specificDeviceIds) {
    const info = await tuyaRequest("GET", `/v1.0/devices/${did}`);
    if (info.success && info.result) {
      devices.push(info.result);
    }
  }
  if (devices.length > 0) {
    return { success: true, result: devices };
  }

  return result2;
}

export async function getDeviceSpecifications(deviceId: string): Promise<any> {
  const result = await tuyaRequest("GET", `/v1.0/devices/${deviceId}/specifications`);
  return result;
}
