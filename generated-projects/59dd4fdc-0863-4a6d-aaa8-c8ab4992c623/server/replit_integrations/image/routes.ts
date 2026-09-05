import type { Express, Request, Response } from "express";
import { Modality } from "@google/genai";
import { ai } from "./client";
import https from "https";
import http from "http";

function fetchUrl(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, headers).then(resolve).catch(reject);
      }
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Request timeout")); });
  });
}

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        return res.status(500).json({ error: "No image data in response" });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      res.json({
        b64_json: imagePart.inlineData.data,
        mimeType,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.post("/api/generate-image-with-upload", async (req: Request, res: Response) => {
    try {
      const { prompt, imageData, imageMime } = req.body;

      if (!prompt || !imageData) {
        return res.status(400).json({ error: "Prompt and image data are required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: imageData, mimeType: imageMime || "image/jpeg" } },
          ],
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          temperature: 0.3,
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        const textPart = candidate?.content?.parts?.find((part: any) => part.text);
        const errorMsg = textPart?.text || "AI could not enhance the image. Try a different photo.";
        return res.status(422).json({ error: errorMsg });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      res.json({
        b64_json: imagePart.inlineData.data,
        mimeType,
      });
    } catch (error: any) {
      console.error("Error enhancing image:", error);
      const msg = error?.message || "Failed to enhance image";
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/face-swap", async (req: Request, res: Response) => {
    try {
      const { targetImage, faceImage, style } = req.body;

      if (!targetImage || !faceImage) {
        return res.status(400).json({ error: "Both target image and face image are required" });
      }

      const targetBase64 = targetImage.replace(/^data:image\/\w+;base64,/, "");
      const faceBase64 = faceImage.replace(/^data:image\/\w+;base64,/, "");

      const targetMime = targetImage.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
      const faceMime = faceImage.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";

      const styleInstruction = style === "realistic"
        ? "The final result must be photorealistic with perfect lighting, skin tone matching, and natural blending."
        : style === "artistic"
        ? "Apply an artistic, stylized look while keeping the swapped face clearly recognizable."
        : style === "cartoon"
        ? "Apply a cartoon/animated style while keeping the swapped face features clearly recognizable."
        : "The final result must be photorealistic and look completely natural.";

      const prompt = `COMPLETE HEAD SWAP TASK - You must perform a full head replacement including face AND hair.

The FIRST image below is the TARGET photo. The SECOND image below is the SOURCE person.

You MUST replace the ENTIRE HEAD (face, hair, ears, forehead, jawline, neck/chin area) of the person in the FIRST image with the COMPLETE HEAD from the SECOND image. This includes:
- The SOURCE person's full face (eyes, nose, mouth, eyebrows, beard/facial hair, skin texture, wrinkles, complexion)
- The SOURCE person's COMPLETE HAIR (hairstyle, hair color, hair length, hairline)
- The SOURCE person's ear shape, jawline shape, and chin

CRITICAL REQUIREMENTS:
1. Keep the TARGET photo's body, clothing, pose, hands, background, and scene composition EXACTLY the same - change NOTHING except the head
2. Replace the COMPLETE HEAD from hairline to chin, ear to ear, including ALL hair from the SOURCE person
3. The SOURCE person's hairstyle and hair color MUST appear on the result - do NOT keep the original person's hair
4. Adjust the head size proportionally to fit the target body naturally
5. Match the head angle and tilt to the target person's neck position
6. Blend the neck/collar area seamlessly where the head meets the body
7. Match the lighting direction and intensity from the target scene onto the swapped head
8. The result should look like the SOURCE person is actually sitting/standing in the TARGET scene wearing those clothes
9. ${styleInstruction}

Generate the head-swapped image now.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: targetBase64, mimeType: targetMime } },
            { inlineData: { data: faceBase64, mimeType: faceMime } },
          ],
        }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          temperature: 0.2,
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        const textPart = candidate?.content?.parts?.find((part: any) => part.text);
        const errorMsg = textPart?.text || "AI could not generate the face swap image. Try different photos.";
        return res.status(422).json({ error: errorMsg });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      res.json({
        b64_json: imagePart.inlineData.data,
        mimeType,
      });
    } catch (error: any) {
      console.error("Error in face swap:", error);
      const msg = error?.message || "Failed to generate face swap";
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/recreate-clean-frame", async (req: Request, res: Response) => {
    try {
      const { frameData, frameMime, description } = req.body;

      if (!frameData) {
        return res.status(400).json({ error: "Frame image data is required" });
      }

      const base64Data = frameData.replace(/^data:[^;]+;base64,/, "");
      const mime = frameMime || frameData.match(/^data:([^;]+);/)?.[1] || "image/jpeg";

      if (!base64Data || base64Data.length < 100) {
        return res.status(400).json({ error: "Image data is too small or empty" });
      }

      let sceneDescription = description || "";

      if (!sceneDescription) {
        console.log("[Recreate] Step 1: Analyzing image to get description...");
        const descResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{
            role: "user",
            parts: [
              { text: `Describe this image in extreme detail for an AI image generator. Include: the exact subject/scene, camera angle, lighting direction and color, color palette, textures, composition, mood, and style. Ignore any watermarks, logos, or text overlays - describe only the actual scene content. Be very specific and detailed. Output ONLY the description text, nothing else.` },
              { inlineData: { data: base64Data, mimeType: mime } },
            ],
          }],
        });

        const descCandidate = descResponse.candidates?.[0];
        const descText = descCandidate?.content?.parts?.find((part: any) => part.text)?.text;
        if (descText) {
          sceneDescription = descText;
          console.log("[Recreate] Got description:", sceneDescription.substring(0, 100) + "...");
        }
      }

      if (!sceneDescription) {
        return res.status(422).json({ error: "Could not analyze the image content" });
      }

      console.log("[Recreate] Step 2: Generating clean image from description...");
      const generatePrompt = `Generate a high-quality, professional photograph/image matching this exact description. The image must have NO watermarks, NO text, NO logos, NO overlays of any kind. Create a completely clean image:\n\n${sceneDescription}`;

      let lastError = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{
              role: "user",
              parts: [{ text: generatePrompt }],
            }],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
              temperature: attempt === 0 ? 0.4 : 0.6,
            },
          });

          const candidate = response.candidates?.[0];
          const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

          if (imagePart?.inlineData?.data) {
            const mimeType = imagePart.inlineData.mimeType || "image/png";
            return res.json({
              b64_json: imagePart.inlineData.data,
              mimeType,
              description: sceneDescription,
            });
          }

          const textPart = candidate?.content?.parts?.find((part: any) => part.text);
          lastError = textPart?.text || "AI could not generate the image";
        } catch (retryErr: any) {
          lastError = retryErr?.message || "Failed to generate image";
          console.error(`Generate attempt ${attempt + 1} failed:`, retryErr?.message);
        }
      }

      return res.status(422).json({ error: lastError });
    } catch (error: any) {
      console.error("Error recreating clean frame:", error);
      res.status(500).json({ error: error?.message || "Failed to recreate frame" });
    }
  });

  app.post("/api/proxy-video", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Video URL is required" });
      }

      let videoUrl = url;

      const shutterstockMatch = url.match(/shutterstock\.com\/video\/clip-(\d+)/);
      if (shutterstockMatch) {
        const clipId = shutterstockMatch[1];
        videoUrl = `https://ak.picdn.net/shutterstock/videos/${clipId}/preview/${clipId}.mp4`;
      }

      const freepikMatch = url.match(/freepik\.com\/.*video.*_(\d+)/);
      if (freepikMatch) {
        try {
          const pageRes = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
          });
          const html = await pageRes.text();
          const uuidMatch = html.match(/videocdn\.cdnpk\.net\/videos\/([a-f0-9-]+)\//);
          if (uuidMatch) {
            videoUrl = `https://videocdn.cdnpk.net/videos/${uuidMatch[1]}/horizontal/previews/watermarked/large.mp4`;
          }
        } catch (e) {
          console.error("Failed to extract Freepik video UUID:", e);
        }
      }

      const pexelsMatch = url.match(/pexels\.com\/video\/[^\/]*-(\d+)/);
      if (pexelsMatch) {
        videoUrl = url;
      }

      let referer = new URL(url).origin + "/";
      if (videoUrl.includes("cdnpk.net")) {
        referer = "https://www.freepik.com/";
      }

      const response = await fetch(videoUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "video/*,*/*",
          "Referer": referer,
          "Origin": referer.replace(/\/$/, ""),
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch video: ${response.statusText}` });
      }

      const contentType = response.headers.get("content-type") || "video/mp4";
      const buffer = Buffer.from(await response.arrayBuffer());

      if (!contentType.includes("video") && buffer.length < 10000) {
        return res.status(422).json({ error: "URL did not return a video file. Try right-clicking the video and selecting 'Copy video address'." });
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error: any) {
      console.error("Error proxying video:", error);
      res.status(500).json({ error: error?.message || "Failed to download video" });
    }
  });
}

