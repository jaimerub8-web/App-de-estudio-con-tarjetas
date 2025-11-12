
import { Flashcard } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

const fileToMimeType = (file: File): string => {
  return file.type;
}

export const generateSummary = async (text: string, image?: File): Promise<string> => {
  try {
    const imageBase64 = image ? await fileToBase64(image) : undefined;
    const mimeType = image ? fileToMimeType(image) : undefined;

    const response = await fetch('/.netlify/functions/generate-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, imageBase64, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch summary from serverless function.');
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error generating summary via Netlify Function:", error);
    throw new Error("No se pudo generar el resumen. Revisa el material o inténtalo de nuevo.");
  }
};

export const generateFlashcards = async (summary: string, originalText: string, image?: File): Promise<Flashcard[]> => {
   try {
    const imageBase64 = image ? await fileToBase64(image) : undefined;
    const mimeType = image ? fileToMimeType(image) : undefined;

    const response = await fetch('/.netlify/functions/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ summary, originalText, imageBase64, mimeType }),
    });

     if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch flashcards from serverless function.');
    }

    const data = await response.json();
    return data.flashcards;
  } catch (error) {
    console.error("Error generating flashcards via Netlify Function:", error);
    throw new Error("No se pudieron generar las tarjetas. Revisa el material o inténtalo de nuevo.");
  }
};
