import React from 'react';
import { Target, Timer, Zap, Sparkles, AlertTriangle } from 'lucide-react';

interface StatsPanelProps {
  elapsedTime: number;
  accuracy: number;
  progress: number; // 0 to 100
  bestTime: number | null;
  wrongTaps: number;
  cps: number; // Clicks per second
}

export default function StatsPanel({
  elapsedTime,
  accuracy,
  progress,
  bestTime,
  wrongTaps,
  cps,
}: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" id="stats-panel-container">
      {/* Timer Display */}
      <div className="bg-[#0b0c10] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase">Time</span>
          <Timer className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-2xl font-black text-white font-mono leading-none">
            {elapsedTime.toFixed(3)}
          </span>
          <span className="text-xs text-neutral-500 font-mono ml-1">s</span>
        </div>
        <div className="absolute bottom-0 left-0 h-[2px] bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* Accuracy Metric */}
      <div className="bg-[#0b0c10] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase">Accuracy</span>
          <Target className="w-4 h-4 text-neutral-400" />
        </div>
        <div>
          <span className="text-2xl font-black text-white font-mono leading-none">
            {accuracy.toFixed(0)}
          </span>
          <span className="text-xs text-neutral-500 font-mono ml-1">%</span>
        </div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">
          {wrongTaps > 0 ? `${wrongTaps} missed tap${wrongTaps > 1 ? 's' : ''}` : 'Perfect flow!'}
        </p>
      </div>

      {/* Click Speed Metric */}
      <div className="bg-[#0b0c10] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase">Taps / Sec</span>
          <Zap className="w-4 h-4 text-neutral-400 animate-pulse" />
        </div>
        <div>
          <span className="text-2xl font-black text-white font-mono leading-none">
            {cps.toFixed(2)}
          </span>
          <span className="text-xs text-neutral-500 font-mono ml-1">CPS</span>
        </div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">
          Ideal target: &gt; 3.0 CPS
        </p>
      </div>

      {/* Personal High Score Display */}
      <div className="bg-[#0b0c10] border border-neutral-900 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-xs font-mono font-medium tracking-wider uppercase">Personal Best</span>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <span className="text-2xl font-black text-white font-mono leading-none">
            {bestTime ? bestTime.toFixed(3) : '--.--'}
          </span>
          {bestTime && <span className="text-xs text-neutral-500 font-mono ml-1">s</span>}
        </div>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">
          {bestTime ? 'Ranked high score' : 'No personal run yet'}
        </p>
      </div>
    </div>
  );
}
