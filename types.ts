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

export interface SavedSessionState {
  appStage: 'studying';
  leitnerBoxes: LeitnerBoxes;
  summary: string;
  originalText: string;
  secondsLeft: number;
  initialMinutes: number;
  currentCollectionId: string | null;
}

export interface StudySessionRecord {
  id: string;
  date: number; // Use timestamp for easier sorting
  collectionName: string;
  knowCount: number;
  regularCount: number;
  dontKnowCount: number;
  totalTimeSeconds: number;
  score: number;
}
