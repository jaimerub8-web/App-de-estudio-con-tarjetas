import React, { useState, useEffect, useRef } from 'react';

const TimerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 6a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;

const Timer: React.FC = () => {
  const [initialMinutes, setInitialMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true); // Auto-start
  const [timeUp, setTimeUp] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev > 1) return prev - 1;
          
          clearInterval(intervalRef.current!);
          setIsActive(false);
          setTimeUp(true);
          return 0;
        });
      }, 1000);
    } else {
      if(intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if(intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleStartPause = () => {
    if (timeUp) return;
    setIsActive(!isActive);
  };
  
  const handleReset = () => {
    setIsActive(false);
    setTimeUp(false);
    setSecondsLeft(initialMinutes * 60);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      if (!isActive) {
          setInitialMinutes(value);
          setSecondsLeft(value * 60);
          setTimeUp(false);
      }
    }
  };
  
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (secondsLeft / (initialMinutes * 60)) * 100;

  return (
    <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <TimerIcon />
          <span className={`text-3xl font-mono tracking-widest ${timeUp ? 'text-red-500' : ''}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={initialMinutes}
            onChange={handleTimeChange}
            disabled={isActive}
            className="w-20 bg-slate-700 text-white p-2 rounded-md text-center focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
            min="1"
          />
          <span className="text-slate-400">min</span>
          <button onClick={handleStartPause} className="p-2 bg-slate-700 hover:bg-cyan-500 rounded-full transition-colors disabled:opacity-50" disabled={timeUp}>
              {isActive ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={handleReset} className="p-2 bg-slate-700 hover:bg-fuchsia-500 rounded-full transition-colors">
              <ResetIcon />
          </button>
        </div>
      </div>
       <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${timeUp ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500'}`}
            style={{ width: `${progress}%` }}>
          </div>
        </div>
    </div>
  );
};

export default Timer;