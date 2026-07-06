import React from 'react';
import { Room } from '../types';

interface MultiplayerMatchProps {
  userId: string;
  room: Room;
}

const MultiplayerMatch: React.FC<MultiplayerMatchProps> = ({ userId, room }) => {
  const isHost = room.host?.id === userId;
  const me = isHost ? room.host : room.guest;
  const opponent = isHost ? room.guest : room.host;

  if (!me || !opponent) return null;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex items-center justify-between shadow-xl mb-4">
      
      {/* Me Status */}
      <div className="flex flex-col flex-1 border-r border-border-subtle pr-4">
         <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm truncate">{me.name} (You)</span>
            <span className="text-xs font-mono bg-panel px-2 py-0.5 rounded text-primary">{me.progress} / 30</span>
         </div>
         <div className="h-2 w-full bg-base rounded-full overflow-hidden border border-border-subtle">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(me.progress / 30) * 100}%` }}
            />
         </div>
         {me.status === 'completed' && <span className="text-[10px] text-green-400 font-mono mt-1">Finished! Time: {me.time?.toFixed(3)}s</span>}
      </div>

      {/* VS Badge */}
      <div className="px-4 text-center">
        <div className="w-8 h-8 rounded-full bg-panel border border-border-subtle flex items-center justify-center font-black text-xs text-muted shadow-inner">
           VS
        </div>
      </div>

      {/* Opponent Status */}
      <div className="flex flex-col flex-1 pl-4">
         <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm truncate">{opponent.name}</span>
            <span className="text-xs font-mono bg-panel px-2 py-0.5 rounded text-red-400">{opponent.progress} / 30</span>
         </div>
         <div className="h-2 w-full bg-base rounded-full overflow-hidden border border-border-subtle">
            <div 
              className="h-full bg-red-500/80 transition-all duration-300"
              style={{ width: `${(opponent.progress / 30) * 100}%` }}
            />
         </div>
         {opponent.status === 'completed' && <span className="text-[10px] text-red-400 font-mono mt-1">Finished! Time: {opponent.time?.toFixed(3)}s</span>}
      </div>

    </div>
  );
};

export default MultiplayerMatch;
