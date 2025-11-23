import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MODELS } from '../constants';
import { MediaItem, MediaType } from '../types';

// Helper to get client
const getClient = (forceNewKey = false) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestEnhancement = async (currentPrompt: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `You are a surrealist art director. Rewrite the following prompt to be more vivid, futuristic, and surreal. Keep it concise but descriptive. 
      Original prompt: "${currentPrompt}"
      
      Return ONLY the improved prompt text.`,
    });
    return response.text?.trim() || currentPrompt;
  } catch (error) {
    console.error("Enhancement failed:", error);
    return currentPrompt;
  }
};

export const generateImage = async (prompt: string, referenceImageBase64?: string, mimeType?: string): Promise<string> => {
  const ai = getClient();
  
  const parts: any[] = [];
  
  // If we have a reference image, we are "Editing" or "Transforming"
  if (referenceImageBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: mimeType
      }
    });
    // Add instruction for editing if image exists
    parts.push({ text: `Transform this image based on the prompt: ${prompt}. Maintain a surreal, futuristic aesthetic.` });
  } else {
    parts.push({ text: `${prompt}. Style: Surreal, Futuristic, High Definition, Cinematic Lighting.` });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts },
      config: {
         // Nano Banana supports aspect ratio, but not all params.
         // responseMimeType is NOT supported for nano banana.
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Nano Banana model.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVideo = async (prompt: string): Promise<string> => {
  // Check for User selected API Key capability for Veo
  if (typeof window !== 'undefined' && (window as any).aistudio) {
     const hasKey = await (window as any).aistudio.hasSelectedApiKey();
     if (!hasKey) {
        throw new Error("API_KEY_REQUIRED");
     }
  }

  // Create client right before call to ensure latest key is used if selected via UI
  const ai = getClient(true); 

  let operation = await ai.models.generateVideos({
    model: MODELS.VIDEO,
    prompt: `${prompt}. Cinematic, surreal, futuristic style, high quality.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Video generation completed but no URI returned.");
  }

  // Fetch the actual video bytes using the key
  const finalUrl = `${videoUri}&key=${process.env.API_KEY}`;
  return finalUrl;
};
