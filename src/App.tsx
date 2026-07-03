import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, LeaderboardEntry, NumberBlock, GameMode } from './types';
import GameGrid from './components/GameGrid';
import Leaderboard from './components/Leaderboard';
import StatsPanel from './components/StatsPanel';
import { sfx } from './utils/audio';
import { getRankByTime } from './utils/rank';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  TrendingUp,
  X,
  HelpCircle,
  Shuffle,
  ArrowDown,
  Layers,
  Zap,
  Palette,
} from 'lucide-react';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [];

const getSequenceForMode = (mode: GameMode): number[] => {
  switch (mode) {
    case 'reverse':
      return Array.from({ length: 30 }, (_, i) => 30 - i);
    case 'even_odd': {
      const odds = Array.from({ length: 15 }, (_, i) => i * 2 + 1); // 1, 3, ..., 29
      const evens = Array.from({ length: 15 }, (_, i) => (i + 1) * 2); // 2, 4, ..., 30
      return [...odds, ...evens];
    }
    case 'shuffle':
    case 'classic':
    default:
      return Array.from({ length: 30 }, (_, i) => i + 1);
  }
};

const shuffleBlocks = (currentBlocks: NumberBlock[]): NumberBlock[] => {
  const arr = [...currentBlocks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getDeviceId = () => {
  let id = localStorage.getItem('speedtap_device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('speedtap_device_id', id);
  }
  return id;
};

export default function App() {
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [blocks, setBlocks] = useState<NumberBlock[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [currentSeqIndex, setCurrentSeqIndex] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [wrongTaps, setWrongTaps] = useState<number>(0);
  const [totalTaps, setTotalTaps] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('speedtap_theme') || 'midnight');

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // Modal / Score saving states
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');
  const [finalTime, setFinalTime] = useState<number>(0);
  const [finalAccuracy, setFinalAccuracy] = useState<number>(100);

  // Confetti particles state
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number; delay: number }[]>([]);

  // High precision timer refs
  const timerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('speedtap_theme', theme);
  }, [theme]);

  const fetchFirestoreLeaderboard = async () => {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('time', 'asc'), limit(100));
      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          name: data.name,
          time: data.time,
          accuracy: data.accuracy,
          date: data.date,
          isPlayer: data.deviceId === getDeviceId(),
          deviceId: data.deviceId,
          mode: (data.mode as GameMode) || 'classic',
        });
      });

      setLeaderboard(entries);
      localStorage.setItem('speedtap_leaderboard', JSON.stringify(entries));
    } catch (error) {
      console.error('Error loading cloud leaderboard:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      } catch (e) {
        // Log details but fallback gracefully to local leaderboard
      }
      const storedLeaderboard = localStorage.getItem('speedtap_leaderboard');
      if (storedLeaderboard) {
        setLeaderboard(JSON.parse(storedLeaderboard));
      } else {
        setLeaderboard(DEFAULT_LEADERBOARD);
      }
    }
  };

  // Initialize sound settings and fetch leaderboard once
  useEffect(() => {
    const storedMute = localStorage.getItem('speedtap_muted');
    if (storedMute !== null) {
      const parsedMute = storedMute === 'true';
      setIsMuted(parsedMute);
      sfx.setMuted(parsedMute);
    }

    fetchFirestoreLeaderboard();
  }, []);

  // Update personal best & reset game when game mode changes
  useEffect(() => {
    const storedBest = localStorage.getItem(`speedtap_best_time_${gameMode}`);
    if (storedBest) {
      setBestTime(parseFloat(storedBest));
    } else {
      setBestTime(null);
    }
    resetGame();
  }, [gameMode]);

  // Sync mute state to helper class
  const toggleMuted = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sfx.setMuted(nextMute);
    localStorage.setItem('speedtap_muted', String(nextMute));
  };

  // Helper: Fisher-Yates Shuffled grid blocks from 1 to 30
  const generateShuffledBlocks = (): NumberBlock[] => {
    const list = Array.from({ length: 30 }, (_, i) => i + 1);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.map((val) => ({
      value: val,
      isCompleted: false,
      offsetX: Math.floor(Math.random() * 6) - 3, // dynamic offset range: -3px to +3px
      offsetY: Math.floor(Math.random() * 6) - 3,
      scale: 1,
    }));
  };

  const resetGame = () => {
    stopHighPrecisionTimer();
    setGameStatus('idle');
    setCurrentSeqIndex(0);
    setElapsedTime(0);
    setWrongTaps(0);
    setTotalTaps(0);
    setCountdown(null);
    setConfetti([]);
    setBlocks(generateShuffledBlocks());
  };

  // High precision ticker to update elapsed seconds at 60fps
  const startHighPrecisionTimer = () => {
    lastTimeRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      setElapsedTime((prev) => prev + delta);
      lastTimeRef.current = now;
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
  };

  const stopHighPrecisionTimer = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  };

  // Start with a countdown (3, 2, 1, Go!)
  const startWithCountdown = () => {
    resetGame();
    setCountdown(3);
    sfx.playCountdown();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null);
          setGameStatus('playing');
          startHighPrecisionTimer();
          sfx.playGo();
          return null;
        }
        sfx.playCountdown();
        return prev - 1;
      });
    }, 800);
  };

  const activeSequence = getSequenceForMode(gameMode);
  const nextNumber = activeSequence[currentSeqIndex] || activeSequence[activeSequence.length - 1];

  // Core callback when user clicks a grid tile
  const handleTapNumber = (value: number, index: number) => {
    // Start the timer automatically on the first tap of any kind if the game is in 'idle' status
    if (gameStatus === 'idle') {
      setGameStatus('playing');
      startHighPrecisionTimer();
    }

    const currentTarget = activeSequence[currentSeqIndex];

    // If we click the correct sequentially targeted number
    if (value === currentTarget) {
      sfx.playCorrect();
      setTotalTaps((prev) => prev + 1);

      // Mark this block completed
      const updatedBlocks = [...blocks];
      updatedBlocks[index].isCompleted = true;

      // Handle Shuffle Mode chaos
      if (gameMode === 'shuffle') {
        setBlocks(shuffleBlocks(updatedBlocks));
      } else {
        setBlocks(updatedBlocks);
      }

      if (currentSeqIndex === 29) {
        // Game Completed successfully!
        stopHighPrecisionTimer();
        setGameStatus('completed');
        sfx.playVictory();
        triggerConfetti();

        // Calculate final stats
        const finalT = elapsedTime;
        const totalAttempts = totalTaps + 1; // including this correct tap
        const accuracyPct = (30 / totalAttempts) * 100;

        setFinalTime(finalT);
        setFinalAccuracy(accuracyPct);

        // Update Personal Best if beat
        const storedBestKey = `speedtap_best_time_${gameMode}`;
        const storedBest = localStorage.getItem(storedBestKey);
        const currentBest = storedBest ? parseFloat(storedBest) : null;
        if (currentBest === null || finalT < currentBest) {
          setBestTime(finalT);
          localStorage.setItem(storedBestKey, String(finalT));
        }

        // Open save score prompt modal
        setTimeout(() => {
          setShowSaveModal(true);
        }, 1000);
      } else {
        setCurrentSeqIndex((prev) => prev + 1);
      }
    } else {
      // Wrong number clicked (Only tally if not already completed)
      if (!blocks[index].isCompleted) {
        sfx.playWrong();
        setWrongTaps((prev) => prev + 1);
        setTotalTaps((prev) => prev + 1);
      }
    }
  };

  // Confetti Particle Generator
  const triggerConfetti = () => {
    const colors = ['#ffffff', '#e2e8f0', '#94a3b8', '#fbbf24', '#f59e0b', '#ef4444', '#3b82f6'];
    const particles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // random screen width percentage
      y: Math.random() * -20 - 5, // start above viewport
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 3,
    }));
    setConfetti(particles);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = playerName.trim() || 'Anonymous Player';

    const newRecord = {
      name: trimmedName,
      time: finalTime,
      accuracy: finalAccuracy,
      date: new Date().toISOString().split('T')[0],
      deviceId: getDeviceId(),
      mode: gameMode,
    };

    // Optimistically show locally
    const clientRecord: LeaderboardEntry = {
      id: `record-${Date.now()}`,
      ...newRecord,
      isPlayer: true,
    };
    const updatedLeaderboard = [...leaderboard, clientRecord];
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('speedtap_leaderboard', JSON.stringify(updatedLeaderboard));

    setShowSaveModal(false);
    setPlayerName('');
    resetGame();

    try {
      await addDoc(collection(db, 'leaderboard'), newRecord);
      fetchFirestoreLeaderboard();
    } catch (error) {
      console.error('Error saving to Cloud:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'leaderboard');
      } catch (e) {
        // Log details of failure
      }
    }
  };

  const handleResetLeaderboard = () => {
    if (window.confirm('Are you sure you want to clear your local high scores and refresh rankings from the cloud?')) {
      setBestTime(null);
      localStorage.removeItem(`speedtap_best_time_${gameMode}`);
      sfx.playWrong();
      fetchFirestoreLeaderboard();
    }
  };

  // Compute stats metrics
  const accuracyPercentage = totalTaps > 0 ? (30 / Math.max(30, totalTaps)) * 100 : 100;
  const progressPercentage = (currentSeqIndex / 30) * 100;
  const clicksPerSecond = elapsedTime > 0 ? currentSeqIndex / elapsedTime : 0;

  const getModeLabel = (mode?: GameMode) => {
    switch (mode) {
      case 'reverse':
        return 'Reverse';
      case 'even_odd':
        return 'Even & Odd';
      case 'shuffle':
        return 'Shuffle';
      case 'classic':
      default:
        return 'Classic';
    }
  };

  return (
    <div className="min-h-screen bg-base text-primary selection:bg-accent/30 selection:text-primary flex flex-col justify-between py-6 px-4 md:px-8 relative" id="speed-tap-app">
      {/* Confetti elements when run completed */}
      {gameStatus === 'completed' && confetti.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `fall 3s linear infinite`,
            animationDelay: `${p.delay}s`,
            opacity: 0.8,
            zIndex: 99,
          }}
        />
      ))}

      {/* Embedded CSS for lightweight confetti drop */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* Top Header Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-border-subtle pb-5 mb-6" id="app-header">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-border-active text-base shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <h1 className="text-xl font-black tracking-wider uppercase font-sans">
              Speed Tap
            </h1>
          </div>
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest mt-0.5">
            Reflex Precision Protocol 1-30
          </span>
        </div>

        {/* Audio / System controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const themes = ['midnight', 'cyberpunk', 'light'];
              setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
            }}
            className="p-2 rounded-xl border border-border-subtle text-muted hover:text-primary hover:border-border-active transition-colors cursor-pointer flex items-center gap-1.5"
            id="btn-toggle-theme"
            title="Toggle Theme"
          >
            <Palette className="w-4 h-4" />
            <span className="text-[10px] font-mono hidden sm:inline-block capitalize">{theme}</span>
          </button>
          <button
            onClick={toggleMuted}
            className="p-2 rounded-xl border border-border-subtle text-muted hover:text-primary hover:border-border-active transition-colors cursor-pointer"
            id="btn-toggle-audio"
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle text-muted hover:text-primary hover:border-border-active transition-colors font-mono text-xs cursor-pointer"
            id="btn-restart-game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* Mode Selection Dashboard - Visible when idle */}
      <div className="max-w-5xl w-full mx-auto mb-6" id="game-dashboard-header">
        <div className="p-4 bg-base/80 border border-border-subtle rounded-2xl" id="game-mode-selector-panel">
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="font-bold text-primary uppercase tracking-wider">Select Challenge Mode</span>
              <span className="bg-accent text-base px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-bounce">Play Me</span>
            </div>
            {bestTime !== null && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-yellow-400 font-semibold bg-yellow-400/5 px-2.5 py-1 rounded border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>PB: {bestTime.toFixed(3)}s</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              {
                id: 'classic',
                label: 'Classic',
                desc: 'Tap 1 to 30 in ascending order. Pure speed and visual scanning.',
                icon: <ArrowDown className="w-4 h-4 text-green-400" />,
              },
              {
                id: 'reverse',
                label: 'Reverse',
                desc: 'Tap 30 to 1 in descending order. Reverse scanning patterns.',
                icon: <RotateCcw className="w-4 h-4 text-cyan-400 animate-spin-slow" />,
              },
              {
                id: 'even_odd',
                label: 'Even & Odd',
                desc: 'Odds first (1, 3, 5...), then Evens (2, 4, 6...). Extreme sorting.',
                icon: <Layers className="w-4 h-4 text-purple-400" />,
              },
              {
                id: 'shuffle',
                label: 'Shuffle',
                desc: 'Grid reshuffles after every correct tap! True muscle memory breaker.',
                icon: <Shuffle className="w-4 h-4 text-amber-400 animate-pulse" />,
              },
            ].map((m) => {
              const active = gameMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (gameStatus === 'idle' || gameStatus === 'completed') {
                      setGameMode(m.id as GameMode);
                      sfx.playCountdown();
                    } else if (window.confirm('Abandon active game to switch modes?')) {
                      setGameMode(m.id as GameMode);
                      sfx.playCountdown();
                    }
                  }}
                  className={`group flex flex-col text-left p-3 rounded-xl border transition-all duration-300 relative overflow-hidden transform hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)] ${
                    active
                      ? 'bg-surface border-accent text-primary shadow-[0_0_15px_var(--theme-accent)] scale-[1.02] z-10 ring-1 ring-accent'
                      : 'bg-base border-border-subtle text-muted hover:border-accent hover:text-primary hover:bg-surface/80'
                  } cursor-pointer`}
                  id={`mode-card-${m.id}`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`p-1.5 rounded-lg border transition-colors ${active ? 'bg-panel border-accent/30 shadow-inner' : 'bg-surface border-border-subtle group-hover:border-accent/50'}`}>
                      {m.icon}
                    </div>
                    <span className="font-black text-sm tracking-wide">{m.label}</span>
                  </div>
                  <p className="text-[10px] text-muted font-mono leading-tight flex-1">
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game Stage Area */}
      <main className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start" id="app-main-stage">
        
        {/* Playfield Area - Takes 7 Cols on desktop */}
        <section className="lg:col-span-7 flex flex-col" id="playfield-area">
          
          {/* Real-time stats display */}
          <StatsPanel
            elapsedTime={elapsedTime}
            accuracy={accuracyPercentage}
            progress={progressPercentage}
            bestTime={bestTime}
            wrongTaps={wrongTaps}
            cps={clicksPerSecond}
          />

          {/* Target Sequence Queue Indicator */}
          <div className="mb-4 bg-base border border-border-subtle p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="target-queue-indicator">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-border-active text-base shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <span className="text-[11px] uppercase tracking-wider font-mono text-muted">Target Order:</span>
              <span className="text-xs font-bold text-primary font-mono uppercase bg-surface px-2 py-0.5 rounded border border-border-subtle">
                {getModeLabel(gameMode)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 font-mono max-w-full custom-scrollbar">
              <span className="text-[10px] text-muted uppercase shrink-0 mr-1">Queue:</span>
              {activeSequence.slice(currentSeqIndex, currentSeqIndex + 6).map((num, idx) => {
                const isCurrent = idx === 0;
                return (
                  <div key={`${num}-${idx}`} className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded font-bold transition-all ${
                        isCurrent
                          ? 'bg-border-active text-base text-base text-xs scale-110 shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-pulse'
                          : 'bg-surface text-muted text-[11px] border border-border-subtle/80'
                      }`}
                    >
                      {num}
                    </div>
                    {idx < 5 && idx < activeSequence.length - currentSeqIndex - 1 && (
                      <span className="text-neutral-700 text-[10px] font-sans">→</span>
                    )}
                  </div>
                );
              })}
              {activeSequence.length - currentSeqIndex > 6 && (
                <span className="text-neutral-600 text-[10px] shrink-0 font-sans ml-1">
                  +{activeSequence.length - currentSeqIndex - 6} more
                </span>
              )}
            </div>
          </div>

          {/* Core Interactive Play Zone */}
          <div className="relative" id="interactive-grid-box">
            {/* Interactive Grid component */}
            <GameGrid
              blocks={blocks}
              nextNumber={nextNumber}
              onTapNumber={handleTapNumber}
              gameStatus={gameStatus}
            />
          </div>
        </section>

        {/* Leaderboard Rankings Area - Takes 5 Cols on desktop */}
        <section className="lg:col-span-5" id="leaderboard-area">
          <Leaderboard
            entries={leaderboard}
            onReset={handleResetLeaderboard}
            currentScore={gameStatus === 'completed' ? elapsedTime : null}
            selectedMode={gameMode}
          />
        </section>
      </main>

      {/* Modal: Save Record Popup */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-base/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="save-score-modal">
          <div className="bg-base border border-border-subtle rounded-3xl p-6 md:p-8 max-w-md w-full relative shadow-2xl overflow-hidden animate-scale-pop">
            
            {/* Top Close */}
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-accent/15 border border-accent/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-primary font-sans">
                Record Achieved!
              </h3>
              <p className="text-xs text-muted font-mono mt-1">
                You completed the <span className="text-primary underline">{getModeLabel(gameMode)}</span> reflex protocol.
              </p>
              
              {/* Dynamically assigned rank */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold font-mono bg-surface border border-border-subtle">
                <span className="text-muted text-xs uppercase">Rank Tier:</span>
                <span className={`${getRankByTime(finalTime).color}`}>
                  {getRankByTime(finalTime).name}
                </span>
              </div>
            </div>

            {/* Score Summary Metrics */}
            <div className="grid grid-cols-2 gap-4 bg-surface border border-border-subtle p-4 rounded-2xl mb-6 text-center">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-mono">Time Elapsed</p>
                <p className="text-2xl font-black text-primary font-mono mt-0.5">{finalTime.toFixed(3)}s</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-mono">Accuracy</p>
                <p className="text-2xl font-black text-primary font-mono mt-0.5">{finalAccuracy.toFixed(1)}%</p>
              </div>
            </div>

            {/* Name Input Form */}
            <form onSubmit={handleSaveScore} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-muted mb-1.5">
                  Enter Pilot Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={18}
                  placeholder="e.g., TapperOne"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-primary placeholder-neutral-500 focus:outline-none focus:border-neutral-500 font-mono text-center"
                  id="player-name-input"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-3 bg-surface hover:bg-panel text-muted hover:text-primary font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border border-border-subtle"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-accent text-base hover:opacity-90 font-black rounded-xl text-xs uppercase tracking-widest transition-opacity cursor-pointer"
                  id="btn-submit-score"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Instructions / Pro-Tips */}
      <footer className="max-w-5xl w-full mx-auto border-t border-border-subtle pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-mono">
        <p>© 2026 Speed Tap Protocol. Crafted for ultimate reflex speed.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Tip: Focus on scanning 2-3 steps ahead!
          </span>
        </div>
      </footer>
    </div>
  );
}
