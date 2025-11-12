import { GoogleGenAI, Type } from "@google/genai";

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
    const { summary, originalText, imageBase64, mimeType } = JSON.parse(event.body);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    Basado en el siguiente resumen de un material de estudio, crea un conjunto de tarjetas de memoria (flashcards) en formato JSON.
    Usa los conceptos clave del resumen para formular las preguntas en el anverso de las tarjetas.
    Puedes usar el material de estudio original (texto y/o imagen) que se proporciona a continuación como contexto para crear respuestas más detalladas y precisas para el reverso de las tarjetas si es necesario.
    El público objetivo son adolescentes, así que haz las preguntas y respuestas claras, concisas y fáciles de entender.
    Genera entre 5 y 20 tarjetas.

    RESUMEN (base para las preguntas):
    ${summary}

    MATERIAL ORIGINAL (contexto para las respuestas):
    ${originalText}
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

    const response = await ai.models.generateContent({
        model,
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING }
                    },
                    required: ["question", "answer"]
                }
            }
        }
    });

    const jsonString = response.text;
    const generatedCards: { question: string, answer: string }[] = JSON.parse(jsonString);

    const flashcardsWithIds = generatedCards.map(card => ({
        ...card,
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcards: flashcardsWithIds }),
    };

  } catch (error) {
    console.error("Error in generate-flashcards function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate flashcards." }),
    };
  }
};
