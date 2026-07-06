import React, { useState } from 'react';
import { GameMode, Room } from '../types';
import { Users, Plus, LogIn, ArrowRight, X, Check, Loader2, Copy } from 'lucide-react';

interface MultiplayerLobbyProps {
  userId: string;
  room: Room | null;
  error: string | null;
  createRoom: (mode: GameMode) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  setReady: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  onBack: () => void;
  userName: string;
  setUserName: (name: string) => void;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  userId,
  room,
  error,
  createRoom,
  joinRoom,
  setReady,
  leaveRoom,
  onBack,
  userName,
  setUserName
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreate = async () => {
    if (!userName.trim()) return alert("Please enter your name first!");
    setIsCreating(true);
    try {
      await createRoom(selectedMode);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!userName.trim()) return alert("Please enter your name first!");
    if (!joinCode.trim()) return alert("Please enter a room code!");
    setIsJoining(true);
    try {
      await joinRoom(joinCode);
    } catch (e) {
      console.error(e);
      alert(error || "Failed to join room.");
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = () => {
    if (room?.roomId) {
      navigator.clipboard.writeText(room.roomId);
      alert("Room code copied to clipboard!");
    }
  };

  if (room) {
    // In a room
    const isHost = room.host?.id === userId;
    const me = isHost ? room.host : room.guest;
    const opponent = isHost ? room.guest : room.host;

    return (
      <div className="max-w-2xl mx-auto p-6 bg-base/80 border border-border-subtle rounded-3xl mt-12 animate-fade-in shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-xl font-black uppercase text-primary tracking-widest flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Match Lobby
            </h2>
            <p className="text-sm font-mono text-muted mt-1">Mode: <span className="text-primary">{room.gameMode}</span></p>
          </div>
          <button 
            onClick={leaveRoom}
            className="p-2 bg-surface hover:bg-panel border border-border-subtle rounded-lg text-muted hover:text-red-400 transition-colors"
            title="Leave Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-surface border border-border-subtle p-4 rounded-xl mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-mono">Room Code</p>
            <p className="text-3xl font-black text-primary font-mono tracking-[0.2em]">{room.roomId}</p>
          </div>
          <button onClick={copyToClipboard} className="p-3 bg-panel hover:bg-border-subtle rounded-lg transition-colors border border-border-subtle">
            <Copy className="w-5 h-5 text-accent" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Me */}
          <div className="bg-surface border border-border-subtle p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
             {me?.status === 'ready' && <div className="absolute inset-0 border-2 border-green-500 rounded-2xl pointer-events-none" />}
             <div className="w-16 h-16 bg-panel rounded-full flex items-center justify-center text-2xl font-black mb-4">
               {me?.name.charAt(0).toUpperCase()}
             </div>
             <h3 className="font-bold text-lg">{me?.name} (You)</h3>
             <span className={`text-xs mt-2 font-mono uppercase px-3 py-1 rounded-full ${me?.status === 'ready' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
               {me?.status}
             </span>
          </div>

          {/* Opponent */}
          <div className="bg-surface border border-border-subtle p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
             {opponent?.status === 'ready' && <div className="absolute inset-0 border-2 border-green-500 rounded-2xl pointer-events-none" />}
             <div className="w-16 h-16 bg-panel rounded-full flex items-center justify-center text-2xl font-black mb-4 border border-dashed border-border-active">
               {opponent ? opponent.name.charAt(0).toUpperCase() : '?'}
             </div>
             <h3 className="font-bold text-lg">{opponent ? opponent.name : 'Waiting...'}</h3>
             <span className={`text-xs mt-2 font-mono uppercase px-3 py-1 rounded-full ${!opponent ? 'bg-panel text-muted' : opponent.status === 'ready' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
               {opponent ? opponent.status : 'Empty'}
             </span>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={setReady}
            disabled={!opponent}
            className={`px-12 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${!opponent ? 'bg-surface text-muted cursor-not-allowed opacity-50' : me?.status === 'ready' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-accent text-base hover:opacity-90 shadow-lg'}`}
          >
            {me?.status === 'ready' ? 'Ready!' : 'Click to Ready'}
          </button>
        </div>
      </div>
    );
  }

  // Not in a room
  return (
    <div className="max-w-md mx-auto p-6 bg-base/80 border border-border-subtle rounded-3xl mt-12 animate-fade-in shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Users className="w-6 h-6 text-accent" />
          Multiplayer
        </h2>
        <button onClick={onBack} className="text-muted hover:text-primary transition-colors text-xs font-mono uppercase underline">
          Back to Solo
        </button>
      </div>

      <div className="mb-8">
        <label className="block text-xs uppercase tracking-wider font-mono text-muted mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter Pilot Name"
          className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-primary font-mono text-center focus:border-accent focus:outline-none"
        />
      </div>

      <div className="space-y-6">
        {/* Create Room */}
        <div className="bg-surface border border-border-subtle p-5 rounded-2xl">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" /> Create New Room
          </h3>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as GameMode)}
            className="w-full bg-base border border-border-subtle rounded-xl px-4 py-3 mb-4 text-sm text-primary font-mono focus:border-accent focus:outline-none"
          >
            <option value="classic">Classic Mode</option>
            <option value="reverse">Reverse Mode</option>
            <option value="even_odd">Even & Odd Mode</option>
            <option value="shuffle">Shuffle Mode</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full py-3 bg-accent text-base font-black rounded-xl text-xs uppercase tracking-widest transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Game'}
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-surface border border-border-subtle p-5 rounded-2xl">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-accent" /> Join Existing Room
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm text-primary font-mono text-center tracking-[0.2em] focus:border-accent focus:outline-none uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="px-6 py-3 bg-panel border border-border-subtle text-primary font-black rounded-xl text-xs uppercase tracking-widest transition-colors hover:bg-border-subtle flex items-center justify-center"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs font-mono text-center mt-4">{error}</p>}
    </div>
  );
};

export default MultiplayerLobby;
