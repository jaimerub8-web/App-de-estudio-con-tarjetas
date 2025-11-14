import React, { useState, useRef, useEffect } from 'react';
import { generateSummary, generateFlashcards } from './services/geminiService';
import { Flashcard as FlashcardType, LeitnerBoxes, LeitnerBox, Collection, SavedSessionState, StudySessionRecord } from './types';
import FlashcardComponent from './components/Flashcard';
import Timer from './components/Timer';
import * as soundService from './services/soundService';

// Icons
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V6z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LoadingSpinner = () => <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>;


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
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [currentCollectionId, setCurrentCollectionId] = useState<string | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  
  // Timer State
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timeUp = secondsLeft === 0;

  // Session Resume State
  const [savedSession, setSavedSession] = useState<SavedSessionState | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Study History State
  const [studyHistory, setStudyHistory] = useState<StudySessionRecord[]>([]);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [pendingSessionData, setPendingSessionData] = useState<{ knowCount: number; regularCount: number; dontKnowCount: number; totalTimeSeconds: number; score: number; } | null>(null);
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');


  // Load collections, history, and check for saved session on mount
  useEffect(() => {
    try {
      const savedCollections = localStorage.getItem('flashcard-collections');
      if (savedCollections) setCollections(JSON.parse(savedCollections));
      
      const savedHistory = localStorage.getItem('estudio-pro-history');
      if (savedHistory) setStudyHistory(JSON.parse(savedHistory));
      
      const savedSessionData = localStorage.getItem('estudio-pro-session');
      if (savedSessionData) setSavedSession(JSON.parse(savedSessionData));

    } catch (e) { 
        console.error("Failed to load from localStorage", e); 
        localStorage.removeItem('flashcard-collections');
        localStorage.removeItem('estudio-pro-history');
        localStorage.removeItem('estudio-pro-session');
    }
    setIsInitialLoad(false);
  }, []);
  
  // Auto-save collections to storage on change with debounce
  useEffect(() => {
    if (isInitialLoad) return;
    const handler = setTimeout(() => {
      try {
        localStorage.setItem('flashcard-collections', JSON.stringify(collections));
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 2000); // Hide indicator after 2 seconds
      } catch (e) {
        console.error("Failed to auto-save collections to localStorage", e);
      }
    }, 1000); // 1-second delay for responsiveness
    return () => clearTimeout(handler);
  }, [collections, isInitialLoad]);

  // Auto-save history to storage on change
  useEffect(() => {
    if (isInitialLoad) return;
    try {
      localStorage.setItem('estudio-pro-history', JSON.stringify(studyHistory));
    } catch (e) {
      console.error("Failed to auto-save history to localStorage", e);
    }
  }, [studyHistory, isInitialLoad]);


  // Timer logic with sound effects
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          const newTime = prev - 1;
          // Play tick sound only for the last 5 seconds
          if (newTime > 0 && newTime <= 5) {
            soundService.playTick();
          } else if (newTime === 0) { // When time is up
            soundService.playTimeUp();
          }
          return newTime;
        });
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if(interval) clearInterval(interval);
    };
  }, [isTimerActive, secondsLeft]);

  // Save session to localStorage
  useEffect(() => {
    if (appStage === 'studying' && leitnerBoxes.unseen.length > 0) {
        const sessionState: SavedSessionState = {
            appStage: 'studying',
            leitnerBoxes,
            summary,
            originalText,
            secondsLeft,
            initialMinutes,
            currentCollectionId
        };
        localStorage.setItem('estudio-pro-session', JSON.stringify(sessionState));
    } else {
        localStorage.removeItem('estudio-pro-session');
    }
  }, [appStage, leitnerBoxes, secondsLeft, initialMinutes, summary, originalText, currentCollectionId]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) setOriginalFile(event.target.files[0]);
  };

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
        setSecondsLeft(initialMinutes * 60);
        setIsTimerActive(true);
        soundService.playStart();
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

  const handleFinishSession = () => {
    setIsTimerActive(false);

    const knowCount = leitnerBoxes.know.length;
    const regularCount = leitnerBoxes.regular.length;
    const dontKnowCount = leitnerBoxes.dont_know.length;
    const totalCards = knowCount + regularCount + dontKnowCount;
    const totalTimeSeconds = (initialMinutes * 60) - secondsLeft;

    if (totalCards > 0) {
        const rawScore = ((knowCount * 1) + (regularCount * 0.5)) / totalCards * 10;
        const finalScore = Math.max(1, Math.round(rawScore));
        setSessionScore(finalScore);
        
        // Store session data temporarily, to be saved with a collection name later
        setPendingSessionData({
            knowCount,
            regularCount,
            dontKnowCount,
            totalTimeSeconds,
            score: finalScore
        });
    }
    
    setAppStage('finished');
  };

  const handleFeedback = (box: LeitnerBox) => {
    const currentCard = leitnerBoxes.unseen[0];
    if (!currentCard) return;

    const newBoxes: LeitnerBoxes = { ...leitnerBoxes, unseen: leitnerBoxes.unseen.slice(1), [box]: [...leitnerBoxes[box], currentCard] };
    
    setLeitnerBoxes(newBoxes);
    setIsCurrentCardFlipped(false);
    if (newBoxes.unseen.length === 0) {
        handleFinishSession();
    }
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
    setSessionScore(null);
    setPendingSessionData(null);
    // Reset timer
    setSecondsLeft(initialMinutes * 60);
    setIsTimerActive(false);
  };

  const handleStartNew = () => {
    setCurrentCollectionId(null); // It's a new session, not from an existing collection
    resetSessionState();
    setAppStage('upload');
  }

  const handleRepeatSession = () => {
    const cardsToRepeat = [...leitnerBoxes.dont_know, ...leitnerBoxes.regular, ...leitnerBoxes.know];
    setLeitnerBoxes({ unseen: cardsToRepeat, know: [], regular: [], dont_know: [] });
    setIsCurrentCardFlipped(false);
    setIsSaving(false);
    setSecondsLeft(initialMinutes * 60);
    setIsTimerActive(true);
    soundService.playStart();
    setAppStage('studying');
  };

  const handleConfirmSave = () => { // For NEW collections
    if (!newCollectionName.trim()) return;
    const allCards = [...leitnerBoxes.know, ...leitnerBoxes.regular, ...leitnerBoxes.dont_know];
    if (allCards.length === 0) {
      setError("No hay tarjetas para guardar.");
      setIsSaving(false);
      return;
    }

    const newCollection: Collection = { 
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
        name: newCollectionName.trim(), 
        cards: allCards 
    };
    setCollections(prev => [...prev, newCollection]);
    
    // Now that we have a name, create the history record from pending data
    if (pendingSessionData) {
        const newRecord: StudySessionRecord = {
            id: `hist-${Date.now()}`,
            date: Date.now(),
            collectionName: newCollection.name,
            ...pendingSessionData
        };
        setStudyHistory(prev => [newRecord, ...prev]);
    }
    
    resetSessionState();
    setCurrentCollectionId(null);
    setAppStage('dashboard');
  };
  
  const handleUpdateCollectionAndExit = () => { // For EXISTING collections
    if (!currentCollectionId) return;

    const allCards = [...leitnerBoxes.know, ...leitnerBoxes.regular, ...leitnerBoxes.dont_know];
    let updatedCollectionName = '';

    setCollections(prevCollections =>
        prevCollections.map(col => {
            if (col.id === currentCollectionId) {
                updatedCollectionName = col.name; // Capture the name for the history record
                return { ...col, cards: allCards };
            }
            return col;
        })
    );
    
    // Create history record for the updated collection
    if (pendingSessionData && updatedCollectionName) {
        const newRecord: StudySessionRecord = {
            id: `hist-${Date.now()}`,
            date: Date.now(),
            collectionName: updatedCollectionName,
            ...pendingSessionData
        };
        setStudyHistory(prev => [newRecord, ...prev]);
    }

    resetSessionState();
    setCurrentCollectionId(null); // Reset after saving
    setAppStage('dashboard');
  };

  const handleStudyCollection = (collection: Collection) => {
    resetSessionState();
    setCurrentCollectionId(collection.id); // Track which collection is being studied
    setLeitnerBoxes(prev => ({ ...prev, unseen: [...collection.cards] })); // Use spread to avoid mutation
    setSecondsLeft(initialMinutes * 60);
    setIsTimerActive(true);
    soundService.playStart();
    setAppStage('studying');
  };

  const handleResumeSession = () => {
    if (!savedSession) return;
    setAppStage(savedSession.appStage);
    setLeitnerBoxes(savedSession.leitnerBoxes);
    setSummary(savedSession.summary);
    setOriginalText(savedSession.originalText);
    setSecondsLeft(savedSession.secondsLeft);
    setInitialMinutes(savedSession.initialMinutes);
    setCurrentCollectionId(savedSession.currentCollectionId);
    setIsTimerActive(true);
    soundService.playStart();
    setSavedSession(null);
  };
  
  const handleDiscardSession = () => {
    localStorage.removeItem('estudio-pro-session');
    setSavedSession(null);
  };
  
  const renderCollections = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-200">Mis Colecciones</h2>
            {showSaveIndicator && (
                <span className="text-sm text-slate-400 px-3 py-1 bg-slate-700 rounded-full">
                    Auto-guardado
                </span>
            )}
        </div>
        <button onClick={handleStartNew} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">
          <PlusIcon /> <span>Crear Nueva</span>
        </button>
      </div>
      {collections.length > 0 ? (
        <ul className="space-y-3">
          {collections.map(col => (
            <li key={col.id} className={`p-4 bg-slate-700 rounded-lg flex justify-between items-center transition-all duration-300 ${deletingCollectionId === col.id ? 'ring-2 ring-red-500' : ''}`}>
              <div>
                <h3 className="font-bold text-lg">{col.name}</h3>
                <p className="text-sm text-slate-400">{col.cards.length} tarjetas</p>
              </div>
              <div className="flex items-center gap-2">
                {deletingCollectionId === col.id ? (
                   <>
                      <span className="text-yellow-400 text-sm hidden sm:inline">¿Seguro?</span>
                      <button onClick={() => {
                          setCollections(prev => prev.filter(c => c.id !== col.id));
                          setDeletingCollectionId(null);
                      }} className="px-3 py-2 text-sm bg-red-700 hover:bg-red-800 rounded-md font-semibold">Sí, eliminar</button>
                      <button onClick={() => setDeletingCollectionId(null)} className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-700 rounded-md font-semibold">No</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleStudyCollection(col)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold">Estudiar</button>
                    <button onClick={() => setDeletingCollectionId(col.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded-md"><TrashIcon /></button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-slate-400 py-8">No tienes ninguna colección guardada. ¡Crea una para empezar!</p>
      )}
    </>
  );

  const renderHistory = () => {
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-slate-200 mb-6">Historial de Estudio</h2>
            {studyHistory.length > 0 ? (
                <ul className="space-y-4">
                    {studyHistory.map(record => (
                        <li key={record.id} className="p-4 bg-slate-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{record.collectionName}</h3>
                                    <p className="text-sm text-slate-400">{new Date(record.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-xl font-bold text-yellow-400">{record.score}/10</p>
                                    <p className="text-sm text-slate-400">{formatTime(record.totalTimeSeconds)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-around p-2 bg-slate-800 rounded-md">
                                <div className="text-center"><span className="font-bold text-lg text-green-400">{record.knowCount}</span><p className="text-xs text-slate-500">Sé</p></div>
                                <div className="text-center"><span className="font-bold text-lg text-yellow-400">{record.regularCount}</span><p className="text-xs text-slate-500">Regular</p></div>
                                <div className="text-center"><span className="font-bold text-lg text-red-400">{record.dontKnowCount}</span><p className="text-xs text-slate-500">No sé</p></div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-slate-400 py-8">No has completado ninguna sesión de estudio todavía.</p>
            )}
        </div>
    );
  };

  const renderDashboard = () => (
    <>
      {savedSession && (
        <section className="w-full p-6 mb-8 bg-slate-800 border border-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/10">
            <h2 className="text-2xl font-semibold text-center text-cyan-400">¡Tienes una sesión en progreso!</h2>
            <p className="text-center text-slate-300 mt-2 mb-6">Quedan {savedSession.leitnerBoxes.unseen.length} tarjetas por ver.</p>
            <div className="flex justify-center gap-4">
                <button onClick={handleResumeSession} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">Reanudar Sesión</button>
                <button onClick={handleDiscardSession} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg">Descartar</button>
            </div>
        </section>
      )}
      <section className="w-full p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg">
        <div className="flex border-b border-slate-600 mb-6">
            <button 
              onClick={() => setActiveTab('collections')}
              className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'collections' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              Mis Colecciones
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              Historial
            </button>
        </div>
        {activeTab === 'collections' ? renderCollections() : renderHistory()}
      </section>
    </>
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
            <UploadIcon /> {originalFile ? `Archivo: ${originalFile.name}` : 'Subir Archivo'}
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
        <Timer 
          secondsLeft={secondsLeft}
          initialMinutes={initialMinutes}
          isActive={isTimerActive}
          timeUp={timeUp}
          onTimeChange={(mins) => {
            if (!isTimerActive) {
              setInitialMinutes(mins);
              setSecondsLeft(mins * 60);
            }
          }}
          onStartPause={() => {
            if (!timeUp) {
                const nextIsActive = !isTimerActive;
                if (nextIsActive) {
                    soundService.playStart();
                } else {
                    soundService.playPause();
                }
                setIsTimerActive(nextIsActive);
            }
          }}
          onReset={() => {
            setIsTimerActive(false);
            setSecondsLeft(initialMinutes * 60);
          }}
        />
        <FlashcardComponent 
          question={currentCard.question} 
          answer={currentCard.answer} 
          isFlipped={isCurrentCardFlipped} 
          onFlip={() => {
            soundService.playFlip();
            setIsCurrentCardFlipped(!isCurrentCardFlipped);
          }} 
        />
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
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2">¡Sesión Completada!</h2>
      {sessionScore !== null && (
        <p className="text-2xl font-semibold text-slate-200 mb-4">Tu puntuación: <span className="text-yellow-400">{sessionScore}/10</span></p>
      )}
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
          <button onClick={() => {
              if (currentCollectionId) {
                  handleUpdateCollectionAndExit();
              } else {
                  setIsSaving(true);
              }
            }} className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">
                Guardar y Salir
          </button>
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
      <main key={appStage} className="w-full max-w-4xl flex flex-col items-center gap-8 content-transition">
        {renderContent()}
      </main>
      <footer className="w-full max-w-4xl text-center mt-12 text-slate-500 text-sm">
        <p>Potenciado por la API de Gemini de Google.</p>
      </footer>
    </div>
  );
};

export default App;