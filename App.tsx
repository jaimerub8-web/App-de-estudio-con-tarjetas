import React, { useState, useRef, useEffect } from 'react';
import { generateSummary, generateFlashcards } from './services/geminiService';
import { Flashcard as FlashcardType, LeitnerBoxes, LeitnerBox, Collection } from './types';
import FlashcardComponent from './components/Flashcard';
import Timer from './components/Timer';

// Icons
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V6z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LoadingSpinner = () => <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


type AppStage = 'dashboard' | 'upload' | 'generatingSummary' | 'summary' | 'generatingCards' | 'studying' | 'finished';

const App: React.FC = () => {
  const [appStage, setAppStage] = useState<AppStage>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [originalText, setOriginalText] = useState('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState('');
  const [leitnerBoxes, setLeitnerBoxes] = useState<LeitnerBoxes>({ unseen: [], know: [], regular: [], dont_know: [] });
  const [isCurrentCardFlipped, setIsCurrentCardFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    try {
      const savedCollections = localStorage.getItem('flashcard-collections');
      if (savedCollections) setCollections(JSON.parse(savedCollections));
    } catch (e) { console.error("Failed to load collections from localStorage", e); }
  }, []);

  const saveCollectionsToStorage = (updatedCollections: Collection[]) => {
    try {
      localStorage.setItem('flashcard-collections', JSON.stringify(updatedCollections));
    } catch (e) { console.error("Failed to save collections to localStorage", e); }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) setOriginalFile(event.target.files[0]);
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra el selector de archivos
    setOriginalFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleGenerateSummary = async () => {
    if (!originalText.trim() && !originalFile) {
      setError('Por favor, introduce material de estudio o sube un archivo.');
      return;
    }
    setError(null);
    setAppStage('generatingSummary');
    try {
      const generatedSummary = await generateSummary(originalText, originalFile || undefined);
      setSummary(generatedSummary);
      setAppStage('summary');
    } catch (e) {
      setError((e as Error).message || 'Ocurrió un error inesperado.');
      setAppStage('upload');
    }
  };

  const handleCreateFlashcards = async () => {
    setError(null);
    setAppStage('generatingCards');
    try {
      const cards = await generateFlashcards(summary, originalText, originalFile || undefined);
      if (cards.length > 0) {
        setLeitnerBoxes({ unseen: cards, know: [], regular: [], dont_know: [] });
        setIsCurrentCardFlipped(false);
        setAppStage('studying');
      } else {
        setError("No se pudieron generar tarjetas. Inténtalo de nuevo.");
        setAppStage('summary');
      }
    } catch (e) {
      setError((e as Error).message || 'Ocurrió un error inesperado.');
      setAppStage('summary');
    }
  };

  const handleFeedback = (box: LeitnerBox) => {
    const currentCard = leitnerBoxes.unseen[0];
    if (!currentCard) return;

    const newBoxes: LeitnerBoxes = { ...leitnerBoxes, unseen: leitnerBoxes.unseen.slice(1), [box]: [...leitnerBoxes[box], currentCard] };
    
    setLeitnerBoxes(newBoxes);
    setIsCurrentCardFlipped(false);
    if (newBoxes.unseen.length === 0) setAppStage('finished');
  };

  const resetSessionState = () => {
    setError(null);
    setOriginalText('');
    setOriginalFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSummary('');
    setLeitnerBoxes({ unseen: [], know: [], regular: [], dont_know: [] });
    setIsCurrentCardFlipped(false);
    setIsSaving(false);
    setNewCollectionName('');
  };

  const handleStartNew = () => {
    resetSessionState();
    setAppStage('upload');
  }

  const handleRepeatSession = () => {
    const cardsToRepeat = [...leitnerBoxes.dont_know, ...leitnerBoxes.regular, ...leitnerBoxes.know];
    setLeitnerBoxes({ unseen: cardsToRepeat, know: [], regular: [], dont_know: [] });
    setIsCurrentCardFlipped(false);
    setIsSaving(false);
    setAppStage('studying');
  };

  const handleConfirmSave = () => {
    if (!newCollectionName.trim()) return;
    const allCards = [...leitnerBoxes.know, ...leitnerBoxes.regular, ...leitnerBoxes.dont_know];
    if (allCards.length === 0) {
      setError("No hay tarjetas para guardar.");
      setIsSaving(false);
      return;
    }

    const newCollection: Collection = { id: `col-${Date.now()}`, name: newCollectionName.trim(), cards: allCards };
    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    saveCollectionsToStorage(updatedCollections);
    
    resetSessionState();
    setAppStage('dashboard');
  };

  const handleStudyCollection = (collection: Collection) => {
    resetSessionState();
    setLeitnerBoxes(prev => ({ ...prev, unseen: collection.cards }));
    setAppStage('studying');
  };

  const handleDeleteCollection = (collectionId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta colección? Esta acción no se puede deshacer.")) {
        const updatedCollections = collections.filter(c => c.id !== collectionId);
        setCollections(updatedCollections);
        saveCollectionsToStorage(updatedCollections);
    }
  };

  const renderDashboard = () => (
    <section className="w-full p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-cyan-400">Mis Colecciones</h2>
        <button onClick={handleStartNew} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">
          <PlusIcon /> <span>Crear Nueva</span>
        </button>
      </div>
      {collections.length > 0 ? (
        <ul className="space-y-3">
          {collections.map(col => (
            <li key={col.id} className="p-4 bg-slate-700 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{col.name}</h3>
                <p className="text-sm text-slate-400">{col.cards.length} tarjetas</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleStudyCollection(col)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold">Estudiar</button>
                <button onClick={() => handleDeleteCollection(col.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded-md"><TrashIcon /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-slate-400 py-8">No tienes ninguna colección guardada. ¡Crea una para empezar!</p>
      )}
    </section>
  );

  const renderUploadForm = () => {
    const isLoading = appStage === 'generatingSummary';
    return (
      <section className="w-full p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Paso 1: Sube tu material</h2>
        <textarea
          className="w-full h-40 p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
          placeholder="Pega tu texto aquí, o describe el contenido de tu archivo..."
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          disabled={isLoading}
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50" disabled={isLoading}>
            <UploadIcon />
            {originalFile ? (
              <span className="flex items-center">
                <span className="truncate max-w-xs ml-2">{originalFile.name}</span>
                <span onClick={handleClearFile} className="p-1 rounded-full hover:bg-slate-500"><XIcon /></span>
              </span>
            ) : 'Subir Archivo'}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" disabled={isLoading} />
          <button onClick={handleGenerateSummary} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50" disabled={isLoading || (!originalText.trim() && !originalFile)}>
            {isLoading ? (<><LoadingSpinner /><span>Generando...</span></>) : (<><SparklesIcon /><span>Generar Resumen</span></>)}
          </button>
        </div>
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </section>
    );
  };

  const renderSummaryReview = () => {
    const isLoading = appStage === 'generatingCards';
    return (
      <section className="w-full p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Paso 2: Revisa el Resumen</h2>
        <p className="text-slate-400 mb-4">La IA ha creado este resumen. Puedes editarlo antes de crear las tarjetas.</p>
        <textarea
          className="w-full h-64 p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={isLoading}
        />
        <div className="mt-4 flex justify-end">
          <button onClick={handleCreateFlashcards} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50" disabled={isLoading}>
            {isLoading ? (<><LoadingSpinner /><span>Creando Tarjetas...</span></>) : (<span>Crear Tarjetas de Memoria</span>)}
          </button>
        </div>
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </section>
    );
  };

  const renderStudySession = () => {
    const currentCard = leitnerBoxes.unseen[0];
    if (!currentCard) return null;
    return (
      <section id="study-session" className="w-full flex flex-col items-center gap-6">
        <h2 className="text-3xl font-bold text-center">¡A Estudiar!</h2>
        <Timer />
        <FlashcardComponent question={currentCard.question} answer={currentCard.answer} isFlipped={isCurrentCardFlipped} onFlip={() => setIsCurrentCardFlipped(!isCurrentCardFlipped)} />
        <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
          <button onClick={() => handleFeedback('dont_know')} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-transform hover:scale-105">No lo sé</button>
          <button onClick={() => handleFeedback('regular')} className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-semibold transition-transform hover:scale-105">Regular</button>
          <button onClick={() => handleFeedback('know')} className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-transform hover:scale-105">Me lo sé</button>
        </div>
        <div className="mt-6 w-full max-w-2xl flex justify-around p-4 bg-slate-800 rounded-lg">
          <div className="text-center"><span className="font-bold text-2xl text-red-400">{leitnerBoxes.dont_know.length}</span><p className="text-sm text-slate-400">No sé</p></div>
          <div className="text-center"><span className="font-bold text-2xl text-yellow-400">{leitnerBoxes.regular.length}</span><p className="text-sm text-slate-400">Regular</p></div>
          <div className="text-center"><span className="font-bold text-2xl text-green-400">{leitnerBoxes.know.length}</span><p className="text-sm text-slate-400">Sé</p></div>
          <div className="text-center"><span className="font-bold text-2xl text-cyan-400">{leitnerBoxes.unseen.length}</span><p className="text-sm text-slate-400">Faltan</p></div>
        </div>
      </section>
    );
  };

  const renderFinishedScreen = () => (
    <section className="w-full text-center p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg">
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-4">¡Sesión Completada!</h2>
      <p className="text-xl text-slate-300 mb-6">Este es tu resultado:</p>
      <div className="flex justify-around max-w-lg mx-auto mb-8">
        <div className="text-center"><p className="font-bold text-4xl text-green-400">{leitnerBoxes.know.length}</p><p>Me lo sé</p></div>
        <div className="text-center"><p className="font-bold text-4xl text-yellow-400">{leitnerBoxes.regular.length}</p><p>Regular</p></div>
        <div className="text-center"><p className="font-bold text-4xl text-red-400">{leitnerBoxes.dont_know.length}</p><p>No lo sé</p></div>
      </div>
      {isSaving ? (
        <div className="mt-8">
          <h3 className="text-xl text-slate-300 mb-4">Dale un nombre a tu nueva colección</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
            <input type="text" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="Ej: Historia Tema 1" className="w-full sm:w-auto px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-fuchsia-500 focus:outline-none" autoFocus />
            <button onClick={handleConfirmSave} disabled={!newCollectionName.trim()} className="w-full sm:w-auto px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100">Guardar Colección</button>
            <button onClick={() => setIsSaving(false)} className="w-full sm:w-auto px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={handleRepeatSession} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">Repetir Sesión</button>
          <button onClick={() => setIsSaving(true)} className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">Guardar y Salir</button>
        </div>
      )}
    </section>
  );

  const renderContent = () => {
    switch(appStage) {
        case 'dashboard': return renderDashboard();
        case 'upload':
        case 'generatingSummary': return renderUploadForm();
        case 'summary':
        case 'generatingCards': return renderSummaryReview();
        case 'studying': return renderStudySession();
        case 'finished': return renderFinishedScreen();
        default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          Estudio como un PRO
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Crea tarjetas de estudio y aprende de forma eficaz.
        </p>
      </header>
      <main className="w-full max-w-4xl flex flex-col items-center gap-8">
        {renderContent()}
      </main>
      <footer className="w-full max-w-4xl text-center mt-12 text-slate-500 text-sm">
        <p>Potenciado por la API de Gemini de Google.</p>
      </footer>
    </div>
  );
};

export default App;