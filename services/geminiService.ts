
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { WasteAnalysis, GroundingLink } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeWaste(
  base64Image: string,
  latitude?: number,
  longitude?: number
): Promise<{ analysis: WasteAnalysis; groundingLinks: GroundingLink[] }> {
  const model = "gemini-3-flash-preview";
  
  const systemPrompt = `
    You are an expert waste management and recycling assistant. 
    Analyze the provided image and determine:
    1. What is the item and its material?
    2. Is it recyclable according to standard global rules?
    3. If location is provided (${latitude}, ${longitude}), what are the likely hyper-local recycling rules for this municipality?
    4. Provide creative DIY upcycling ideas if it's not recyclable, or resale potential.
    5. Formulate a Google Maps search query to find relevant specialized recycling centers (e.g., "e-waste recycling near me").

    IMPORTANT: Response must be in valid JSON.
  `;

  const prompt = "Analyze this item for disposal and upcycling.";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      }
    ],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          material: { type: Type.STRING },
          isRecyclable: { type: Type.BOOLEAN },
          municipalityRules: { type: Type.STRING },
          upcyclingIdeas: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          resaleValue: { type: Type.STRING },
          nearbyCentersQuery: { type: Type.STRING },
          pointsPotential: { type: Type.NUMBER }
        },
        required: ["itemName", "material", "isRecyclable", "municipalityRules", "upcyclingIdeas", "nearbyCentersQuery", "pointsPotential"]
      },
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: latitude && longitude ? { latitude, longitude } : undefined
        }
      }
    }
  });

  const analysis: WasteAnalysis = JSON.parse(response.text || '{}');
  const groundingLinks: GroundingLink[] = [];

  // Extract maps grounding if available
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.maps) {
        groundingLinks.push({
          title: chunk.maps.title || "Nearby Facility",
          uri: chunk.maps.uri
        });
      }
    });
  }

  return { analysis, groundingLinks };
}

export async function getCentersWithGrounding(query: string, lat?: number, lng?: number): Promise<GroundingLink[]> {
  const model = "gemini-2.5-flash-lite-latest"; // Using a lite model for simple grounding query
  
  const response = await ai.models.generateContent({
    model,
    contents: `Find specialized centers for: ${query}`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
        }
      }
    }
  });

  const links: GroundingLink[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.maps) {
        links.push({
          title: chunk.maps.title,
          uri: chunk.maps.uri
        });
      }
    });
  }
  return links;
}
