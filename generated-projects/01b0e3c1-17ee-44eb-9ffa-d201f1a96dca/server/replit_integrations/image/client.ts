import { GoogleGenAI, Modality } from "@google/genai";

// Keep optional Replit/Gemini integration from crashing Vercel at module load.
export function getAI(): GoogleGenAI {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini image generation is not configured");
  return new GoogleGenAI({
    apiKey,
    httpOptions: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
      ? { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL }
      : undefined,
  });
}

/**
 * Generate an image and return as base64 data URL.
 * Uses gemini-2.5-flash-image model via Replit AI Integrations.
 */
export async function generateImage(prompt: string): Promise<string> {
  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

