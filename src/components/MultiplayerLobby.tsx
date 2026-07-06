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
