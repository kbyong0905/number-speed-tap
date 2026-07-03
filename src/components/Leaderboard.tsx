import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, GameMode } from '../types';
import { Trophy, RefreshCw, Search, Award, Flame, ChevronDown, ChevronUp, ShieldAlert, RotateCcw } from 'lucide-react';
import { getRankByTime, RANK_TIERS } from '../utils/rank';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onReset: () => void;
  currentScore?: number | null;
  selectedMode: GameMode;
}

export default function Leaderboard({ entries, onReset, currentScore, selectedMode }: LeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRanksLegend, setShowRanksLegend] = useState(false);
  const [activeTab, setActiveTab] = useState<GameMode | 'all'>('all');

  // Sync active leaderboard tab with the selected game mode when it changes
  useEffect(() => {
    setActiveTab(selectedMode);
  }, [selectedMode]);

  // Filter entries based on the active tab
  const modeFilteredEntries = [...entries].filter((entry) => {
    const entryMode = entry.mode || 'classic';
    if (activeTab === 'all') return true;
    return entryMode === activeTab;
  });

  // Sort filtered entries: fastest time first, then higher accuracy, then oldest date
  const sortedEntries = modeFilteredEntries.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return b.accuracy - a.accuracy;
  });

  const filteredEntries = sortedEntries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm animate-pulse">
            <Trophy className="w-3 animate-bounce" /> Rank 1
          </div>
        );
      case 2:
        return (
        <div className="flex items-center gap-1 bg-border-subtle/40 text-muted border border-border-subtle px-2 py-0.5 rounded-full text-xs font-semibold">
            <Award className="w-3" /> Rank 2
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-1 bg-amber-700/15 text-amber-500 border border-amber-600/30 px-2 py-0.5 rounded-full text-xs font-semibold">
            <Award className="w-3" /> Rank 3
          </div>
        );
      default:
        return (
          <div className="text-gray-400 font-mono text-xs text-center w-full">
            #{rank}
          </div>
        );
    }
  };

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
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 flex flex-col h-full shadow-2xl relative overflow-hidden" id="leaderboard-panel">
      {/* Decorative subtle top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-50" />

      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
           <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
           <h2 className="text-lg font-bold tracking-tight text-primary uppercase font-sans">
             Reflex Rankings
           </h2>
         </div>
         <button
           onClick={onReset}
           className="p-1.5 rounded-lg border border-border-subtle text-muted hover:text-primary hover:border-neutral-600 transition-colors cursor-pointer"
           title="Reset Leaderboard for current mode"
           id="btn-reset-leaderboard"
         >
           <RefreshCw className="w-4 h-4" />
         </button>
      </div>

      <p className="text-xs text-muted mb-3 font-mono">
        Can you beat the sub-10s reflex threshold? Select a tab to inspect world-class runs.
      </p>

      {/* Mode Filter Tabs */}
      <div className="grid grid-cols-5 gap-1 bg-base p-1 rounded-xl mb-4 border border-border-subtle text-[10px] font-mono">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-panel text-primary font-bold'
              : 'text-muted hover:text-muted'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('classic')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'classic'
              ? 'bg-panel text-primary font-bold'
              : 'text-muted hover:text-muted'
          }`}
        >
          Classic
        </button>
        <button
          onClick={() => setActiveTab('reverse')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'reverse'
              ? 'bg-panel text-primary font-bold'
              : 'text-muted hover:text-muted'
          }`}
        >
          Reverse
        </button>
        <button
          onClick={() => setActiveTab('even_odd')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'even_odd'
              ? 'bg-panel text-primary font-bold'
              : 'text-muted hover:text-muted'
          }`}
        >
          Even/Odd
        </button>
        <button
          onClick={() => setActiveTab('shuffle')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeTab === 'shuffle'
              ? 'bg-panel text-primary font-bold'
              : 'text-muted hover:text-muted'
          }`}
        >
          Shuffle
        </button>
      </div>

      {/* Ranks Reference collapsible legend */}
      <div className="mb-4 border border-border-subtle rounded-xl overflow-hidden bg-base">
        <button
          onClick={() => setShowRanksLegend(!showRanksLegend)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted hover:bg-surface/50 transition-colors font-mono"
        >
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-muted" /> Rank Tier Milestones
          </span>
          {showRanksLegend ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showRanksLegend && (
          <div className="px-3 pb-3 pt-1 border-t border-border-subtle grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-muted bg-base">
            {RANK_TIERS.map((tier) => (
              <div key={tier.name} className="flex justify-between items-center py-0.5 border-b border-border-subtle/40">
                <span className={`${tier.color}`}>{tier.name.split(' ')[0]}</span>
                <span className="text-muted">
                  {tier.maxSeconds === Infinity ? 'Any' : `≤ ${tier.maxSeconds}s`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Ranking Indicator if player is currently completing */}
      {currentScore !== undefined && currentScore !== null && (
        <div className="bg-surface border border-border-subtle p-3 rounded-xl mb-4 text-center animate-fade-in">
          <p className="text-xs text-muted">Current Run Result</p>
          <p className="text-2xl font-black text-primary font-mono">{currentScore.toFixed(3)}s</p>
          <p className="text-xs text-yellow-400 font-semibold mt-1 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3" />
            Estimated Mode Ranking: #
            {sortedEntries.findIndex((e) => e.time > currentScore) + 1 || sortedEntries.length + 1}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-border-active text-base/10 text-primary border border-white/20">
            Rank Assigned: {getRankByTime(currentScore).name}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Filter players by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-base border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-primary placeholder-neutral-500 focus:outline-none focus:border-neutral-500 font-mono transition-all"
          id="search-players-input"
        />
      </div>

      {/* Rankings Table */}
      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2 custom-scrollbar">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm font-mono">
            No rankings found for this mode filter.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const actualRank = sortedEntries.findIndex((e) => e.id === entry.id) + 1;
            const rankTier = getRankByTime(entry.time);
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                  entry.isPlayer
                    ? 'bg-surface/80 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'bg-base border-border-subtle hover:border-border-subtle'
                }`}
                id={`leaderboard-row-${entry.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 flex justify-start pl-1">
                    {getRankBadge(actualRank)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-semibold text-sm truncate ${entry.isPlayer ? 'text-primary' : 'text-primary'}`}>
                        {entry.name}
                      </p>
                      {entry.isPlayer && (
                        <span className="bg-border-active text-base text-base text-[9px] px-1.5 rounded font-mono font-bold uppercase tracking-wider">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase font-mono px-1 py-0.5 rounded border ${rankTier.bg} ${rankTier.color} ${rankTier.border}`}>
                        {rankTier.name}
                      </span>
                      {activeTab === 'all' && (
                        <span className="text-[9px] text-muted bg-surface border border-border-subtle font-mono px-1 py-0.5 rounded">
                          {getModeLabel(entry.mode)}
                        </span>
                      )}
                      <span className="text-[9px] text-muted font-mono">{entry.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <p className="text-sm font-black text-primary font-mono">
                    {entry.time.toFixed(3)}s
                  </p>
                  <p className="text-[10px] text-muted font-mono">
                    {entry.accuracy.toFixed(1)}% Acc
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between text-[11px] text-muted font-mono">
        <span>Cloud Synced database</span>
        <span>{modeFilteredEntries.length} Records</span>
      </div>
    </div>
  );
}
