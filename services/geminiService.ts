import { Flashcard } from '../types';

// Helper function to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // remove the header: 'data:image/png;base64,'
    reader.onload = () => resolve((reader.result as string).split(',')[1]); 
    reader.onerror = error => reject(error);
  });
}

// The API calls will now go through our Netlify serverless functions
const callApi = async (endpoint: string, body: object) => {
  const response = await fetch(`/.netlify/functions/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Ocurrió un error en el servidor.' }));
    throw new Error(errorData.error || `Error: ${response.statusText}`);
  }
  return response.json();
};


export const generateSummary = async (text: string, image?: File): Promise<string> => {
  try {
    let imageBase64: string | null = null;
    let mimeType: string | null = null;

    if (image) {
      imageBase64 = await fileToBase64(image);
      mimeType = image.type;
    }

    const data = await callApi('generate-summary', { text, imageBase64, mimeType });
    return data.summary;

  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error(error instanceof Error ? error.message : "No se pudo generar el resumen. Revisa el material o inténtalo de nuevo.");
  }
};

export const generateFlashcards = async (summary: string, originalText: string, image?: File): Promise<Flashcard[]> => {
   try {
    let imageBase64: string | null = null;
    let mimeType: string | null = null;

    if (image) {
        imageBase64 = await fileToBase64(image);
        mimeType = image.type;
    }
    
    const data = await callApi('generate-flashcards', { summary, originalText, imageBase64, mimeType });
    return data.flashcards;
    
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error(error instanceof Error ? error.message : "No se pudieron generar las tarjetas. Revisa el material o inténtalo de nuevo.");
  }
};