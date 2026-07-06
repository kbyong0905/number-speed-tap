import React, { useState, useRef, useEffect } from 'react';
import { Room } from '../types';
import { Trophy, Zap, Target, Clock, Flame, Send } from 'lucide-react';

interface MultiplayerSidePanelProps {
  userId: string;
  room: Room;
  elapsedTime: number;
  sendMessage: (text: string) => Promise<void>;
}

const MultiplayerSidePanel: React.FC<MultiplayerSidePanelProps> = ({ userId, room, elapsedTime, sendMessage }) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages?.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };
  const isHost = room.host?.id === userId;
  const me = isHost ? room.host : room.guest;
  const opponent = isHost ? room.guest : room.host;

  const isFinished = room.status === 'finished';
  const iWon = room.winnerId === userId;
  const isTie = room.winnerId === 'tie';
  
  // Progress calculations
  const meLeading = (me?.progress ?? 0) > (opponent?.progress ?? 0);
  const tied = (me?.progress ?? 0) === (opponent?.progress ?? 0);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Match Result Banner (only shown after game finishes) */}
      {isFinished && (
        <div className={`rounded-2xl border p-5 text-center animate-scale-pop ${
          isTie 
            ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
            : iWon 
              ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
              : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="text-4xl mb-2">{isTie ? '🤝' : iWon ? '🏆' : '💀'}</div>
          <p className={`text-xl font-black uppercase tracking-widest ${isTie ? 'text-blue-400' : iWon ? 'text-yellow-400' : 'text-red-400'}`}>
            {isTie ? 'It\'s a Tie!' : iWon ? 'You Win!' : 'You Lost'}
          </p>
          {me?.time && opponent?.time && (
            <p className="text-xs font-mono text-muted mt-2">
              {iWon ? `${me.time.toFixed(3)}s vs ${opponent.time.toFixed(3)}s` : `${me.time.toFixed(3)}s vs ${opponent.time.toFixed(3)}s`}
            </p>
          )}
        </div>
      )}

      {/* Live Status Badge */}
      {!isFinished && (
        <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${
          tied 
            ? 'bg-surface border-border-subtle' 
            : meLeading 
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${tied ? 'text-muted' : meLeading ? 'text-green-400' : 'text-red-400'}`} />
            <span className={`text-xs font-black uppercase tracking-widest ${tied ? 'text-muted' : meLeading ? 'text-green-400' : 'text-red-400'}`}>
              {tied ? 'Tied!' : meLeading ? 'You Lead!' : 'Catch Up!'}
            </span>
          </div>
          <span className="text-xs font-mono text-muted">{elapsedTime > 0 ? `${elapsedTime.toFixed(1)}s` : '--'}</span>
        </div>
      )}

      {/* Race Track Visualization */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-widest font-mono text-muted mb-4 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-accent" /> Live Race Track
        </p>

        {/* Me track */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center text-[10px] font-black text-accent">
                {me?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold truncate max-w-[100px]">{me?.name} <span className="text-[10px] text-muted font-normal">(you)</span></span>
            </div>
            <span className="text-sm font-black text-accent font-mono">{me?.progress ?? 0}<span className="text-muted text-[10px] font-normal">/30</span></span>
          </div>
          <div className="relative h-4 bg-base rounded-full overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300 relative"
              style={{ width: `${((me?.progress ?? 0) / 30) * 100}%` }}
            >
              {(me?.progress ?? 0) > 0 && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-black text-base">
                  {me?.progress}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Opponent track */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[10px] font-black text-red-400">
                {opponent?.name.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-bold truncate max-w-[100px]">{opponent?.name ?? 'Opponent'}</span>
            </div>
            <span className="text-sm font-black text-red-400 font-mono">{opponent?.progress ?? 0}<span className="text-muted text-[10px] font-normal">/30</span></span>
          </div>
          <div className="relative h-4 bg-base rounded-full overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-red-500/70 rounded-full transition-all duration-300"
              style={{ width: `${((opponent?.progress ?? 0) / 30) * 100}%` }}
            >
              {(opponent?.progress ?? 0) > 0 && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-black text-white">
                  {opponent?.progress}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Finish line marker */}
        <div className="flex justify-end mt-1">
          <span className="text-[9px] font-mono text-muted tracking-widest uppercase">🏁 Finish</span>
        </div>
      </div>

      {/* Player Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* My stats */}
        <div className="bg-surface border border-border-subtle rounded-xl p-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted mb-3">You</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted">
                <Target className="w-3 h-3" />
                <span className="text-[10px] font-mono">Progress</span>
              </div>
              <span className="text-xs font-black text-accent">{me?.progress ?? 0}/30</span>
            </div>
            {me?.status === 'completed' && me.time && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Time</span>
                </div>
                <span className="text-xs font-black text-green-400">{me.time.toFixed(3)}s</span>
              </div>
            )}
            {me?.status === 'completed' && me.accuracy && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted">
                  <Zap className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Accuracy</span>
                </div>
                <span className="text-xs font-black text-primary">{me.accuracy.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Opponent stats */}
        <div className="bg-surface border border-border-subtle rounded-xl p-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted mb-3">Opponent</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted">
                <Target className="w-3 h-3" />
                <span className="text-[10px] font-mono">Progress</span>
              </div>
              <span className="text-xs font-black text-red-400">{opponent?.progress ?? 0}/30</span>
            </div>
            {opponent?.status === 'completed' && opponent.time && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Time</span>
                </div>
                <span className="text-xs font-black text-red-400">{opponent.time.toFixed(3)}s</span>
              </div>
            )}
            {opponent?.status === 'completed' && opponent.accuracy && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted">
                  <Zap className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Accuracy</span>
                </div>
                <span className="text-xs font-black text-primary">{opponent.accuracy.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode info */}
      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Game Mode</span>
        <span className="text-xs font-black text-primary uppercase tracking-wider">{room.gameMode.replace('_', ' & ')}</span>
      </div>

      {/* Live Chat */}
      <div className="bg-surface border border-border-subtle rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border-subtle flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[10px] uppercase tracking-widest font-mono text-muted">Live Chat</p>
        </div>

        {/* Messages area */}
        <div className="flex flex-col gap-2 px-3 py-3 h-44 overflow-y-auto custom-scrollbar">
          {(!room.messages || room.messages.length === 0) && (
            <p className="text-center text-[10px] text-muted font-mono mt-6">No messages yet. Say hi! 👋</p>
          )}
          {room.messages?.map((msg, i) => {
            const isMe = msg.playerId === userId;
            return (
              <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-muted font-mono mb-0.5">{isMe ? 'You' : msg.playerName}</span>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-medium max-w-[80%] break-words ${
                  isMe
                    ? 'bg-accent/20 border border-accent/30 text-primary'
                    : 'bg-panel border border-border-subtle text-muted'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 px-3 pb-3 pt-2 border-t border-border-subtle">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Say something..."
            maxLength={80}
            className="flex-1 bg-base border border-border-subtle rounded-lg px-3 py-2 text-xs text-primary placeholder-neutral-500 focus:outline-none focus:border-accent font-mono"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 bg-accent/20 hover:bg-accent/40 border border-accent/40 text-accent rounded-lg transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default MultiplayerSidePanel;
