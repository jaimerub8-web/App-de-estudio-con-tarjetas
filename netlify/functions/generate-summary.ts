import { GoogleGenAI } from "@google/genai";

// FIX: Switched from 'exports.handler' to 'export const handler' to use ES module syntax,
// which resolves the "Cannot find name 'exports'" error in the TypeScript environment.
export const handler = async function(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not found on server." }) };
  }
  
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Request body is missing." }) };
    }
    const { text, imageBase64, mimeType } = JSON.parse(event.body);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    Eres un asistente de estudio para adolescentes. Analiza el siguiente material de estudio (texto y/o imagen) y crea un resumen conciso en español que destaque los conceptos y puntos clave.
    El resumen debe ser fácil de entender y estar estructurado para que sirva de base para crear tarjetas de estudio.
    Aquí está el material de estudio: ${text}
    `;

    const model = 'gemini-2.5-flash';
    const contents: { parts: any[] } = { parts: [{ text: prompt }] };

    if (imageBase64 && mimeType) {
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      };
      contents.parts.unshift(imagePart);
    }

    const response = await ai.models.generateContent({ model, contents });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: response.text }),
    };

  } catch (error) {
    console.error("Error in generate-summary function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate summary." }),
    };
  }
};
