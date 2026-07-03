import React, { useState } from 'react';
import { NumberBlock } from '../types';

interface GameGridProps {
  blocks: NumberBlock[];
  nextNumber: number;
  onTapNumber: (value: number, index: number) => void;
  gameStatus: 'idle' | 'playing' | 'completed';
}

export default function GameGrid({ blocks, nextNumber, onTapNumber, gameStatus }: GameGridProps) {
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  const handleCellClick = (value: number, index: number) => {
    if (gameStatus === 'completed') return;

    if (value === nextNumber) {
      onTapNumber(value, index);
    } else {
      // Trigger error feedback for this specific grid cell
      if (!blocks[index].isCompleted) {
        setErrorIndex(index);
        onTapNumber(value, index); // Let parent handle the incorrect tap tally
        setTimeout(() => setErrorIndex(null), 250);
      }
    }
  };

  return (
    <div className="w-full select-none" id="speed-tap-grid-container">
      {/* Grid of Numbers */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 bg-black border border-neutral-900 p-3 sm:p-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {blocks.map((block, index) => {
          const isError = errorIndex === index;

          return (
            <button
              key={`${block.value}-${index}`}
              onClick={() => handleCellClick(block.value, index)}
              disabled={block.isCompleted && gameStatus !== 'idle'}
              style={{
                transform: isError ? 'scale(0.95)' : 'none',
              }}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-150 cursor-pointer text-center relative overflow-hidden
                ${
                  block.isCompleted
                    ? 'bg-neutral-950 border border-neutral-950 text-neutral-950 pointer-events-none opacity-0'
                    : isError
                    ? 'bg-red-950 border border-red-500 text-red-200 animate-wiggle z-20 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-neutral-900 border border-neutral-800 text-white font-bold hover:bg-neutral-800 hover:border-neutral-700 active:scale-95'
                }
              `}
              id={`tap-block-${block.value}`}
            >
              {/* Subtle visual grid placement offset if playing is randomized */}
              <div
                className="flex items-center justify-center w-full h-full"
                style={{
                  transform: gameStatus === 'playing' && !block.isCompleted
                    ? `translate(${block.offsetX}px, ${block.offsetY}px)`
                    : 'none',
                }}
              >
                <span className="text-xl sm:text-2xl md:text-3xl font-mono tracking-tight select-none">
                  {block.isCompleted ? '' : block.value}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
