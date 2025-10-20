
import { GoogleGenAI, Modality } from "@google/genai";

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const enhanceImage = async (base64Data: string, mimeType: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key not found in environment variables.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const prompt = "Enhance this image to be sharp, clear, and high-definition. Increase resolution and remove blurriness and compression artifacts. Make the colors more vibrant but keep them natural.";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No enhanced image found in the API response.");

  } catch (error) {
    console.error("Error enhancing image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to enhance image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image enhancement.");
  }
};
