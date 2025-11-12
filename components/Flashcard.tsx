
import React from 'react';

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, answer, isFlipped, onFlip }) => {
  return (
    <div
      className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer group"
      onClick={onFlip}
      aria-live="polite"
    >
      <div
        className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Anverso de la tarjeta */}
        <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-lg shadow-cyan-500/10">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-cyan-400">Pregunta</h2>
          <p className="mt-4 text-xl md:text-2xl text-center text-slate-200">{question}</p>
          <div className="absolute bottom-4 text-sm text-slate-500">Haz clic para ver la respuesta</div>
        </div>

        {/* Reverso de la tarjeta */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-lg shadow-fuchsia-500/10">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-fuchsia-400">Respuesta</h2>
          <p className="mt-4 text-lg md:text-xl text-center text-slate-300 leading-relaxed">{answer}</p>
           <div className="absolute bottom-4 text-sm text-slate-500">Haz clic para volver a la pregunta</div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;