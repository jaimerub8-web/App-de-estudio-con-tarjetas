export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export type LeitnerBox = 'know' | 'regular' | 'dont_know';

export interface LeitnerBoxes {
  unseen: Flashcard[];
  know: Flashcard[];
  regular: Flashcard[];
  dont_know: Flashcard[];
}

export interface Collection {
  id: string;
  name: string;
  cards: Flashcard[];
}
