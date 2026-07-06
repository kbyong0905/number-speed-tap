import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Room, GameMode, PlayerState, ChatMessage } from '../types';

export const useMultiplayer = (userId: string, userName: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room?.roomId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', room.roomId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Room;
          setRoom(data);
        } else {
          setError('Room closed or not found.');
          setRoom(null);
        }
      },
      (err) => {
        console.error('Room sync error:', err);
        setError('Lost connection to the room.');
      }
    );

    return () => unsubscribe();
  }, [room?.roomId]);

  const createRoom = async (mode: GameMode): Promise<string> => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newRoom: Room = {
        roomId,
        host: {
          id: userId,
          name: userName,
          status: 'waiting',
          progress: 0,
          time: null,
          accuracy: null,
        },
        guest: null,
        gameMode: mode,
        status: 'waiting',
        winnerId: null,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'rooms', roomId), newRoom);
      setRoom(newRoom);
      return roomId;
    } catch (err) {
      console.error(err);
      setError('Failed to create room.');
      throw err;
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const roomRef = doc(db, 'rooms', roomId.toUpperCase());
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const roomData = roomSnap.data() as Room;
      if (roomData.guest) {
        throw new Error('Room is full');
      }

      const guestData: PlayerState = {
        id: userId,
        name: userName,
        status: 'waiting',
        progress: 0,
        time: null,
        accuracy: null,
      };

      await updateDoc(roomRef, {
        guest: guestData,
      });

      setRoom({ ...roomData, guest: guestData });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to join room.');
      throw err;
    }
  };

  const setReady = async () => {
    if (!room) return;
    const isHost = room.host?.id === userId;
    const fieldPrefix = isHost ? 'host' : 'guest';
    const playerRef = isHost ? room.host : room.guest;
    
    if (playerRef) {
      const newStatus = playerRef.status === 'ready' ? 'waiting' : 'ready';
      await updateDoc(doc(db, 'rooms', room.roomId), {
        [`${fieldPrefix}.status`]: newStatus,
      });

      // Check if both are ready to start
      if (isHost && room.guest?.status === 'ready' && newStatus === 'ready') {
        await updateDoc(doc(db, 'rooms', room.roomId), {
          status: 'starting',
        });
      } else if (!isHost && room.host?.status === 'ready' && newStatus === 'ready') {
        await updateDoc(doc(db, 'rooms', room.roomId), {
          status: 'starting',
        });
      }
    }
  };
  
  const startGame = async () => {
      if(!room) return;
      await updateDoc(doc(db, 'rooms', room.roomId), {
        status: 'playing',
        'host.status': 'playing',
        'guest.status': 'playing',
        'host.progress': 0,
        'guest.progress': 0,
      });
  }

  const updateProgress = async (progress: number) => {
    if (!room) return;
    const isHost = room.host?.id === userId;
    const fieldPrefix = isHost ? 'host' : 'guest';
    
    await updateDoc(doc(db, 'rooms', room.roomId), {
      [`${fieldPrefix}.progress`]: progress,
    });
  };

  const finishGame = async (time: number, accuracy: number) => {
    if (!room) return;
    const isHost = room.host?.id === userId;
    const fieldPrefix = isHost ? 'host' : 'guest';
    const opponent = isHost ? room.guest : room.host;
    
    const updateData: any = {
      [`${fieldPrefix}.status`]: 'completed',
      [`${fieldPrefix}.time`]: time,
      [`${fieldPrefix}.accuracy`]: accuracy,
      [`${fieldPrefix}.progress`]: 30, // completed
    };

    // If opponent has already finished, we can now compare times to find the winner
    if (opponent?.status === 'completed' && opponent.time) {
      if (time < opponent.time) {
        updateData.winnerId = userId; // I win
      } else if (opponent.time < time) {
        updateData.winnerId = opponent.id; // They win
      } else {
        updateData.winnerId = 'tie'; // Tie
      }
      updateData.status = 'finished'; // End the room match
    }

    await updateDoc(doc(db, 'rooms', room.roomId), updateData);
  };
  
  const leaveRoom = async () => {
    if (!room) return;
    setRoom(null);
    const isHost = room.host?.id === userId;
    
    try {
        if (isHost) {
             await updateDoc(doc(db, 'rooms', room.roomId), {
                status: 'finished'
             });
        } else {
             await updateDoc(doc(db, 'rooms', room.roomId), {
                 guest: null
             });
        }
    } catch(e) {
        console.error(e)
    }
  };

  const playAgain = async () => {
    if (!room) return;
    const isHost = room.host?.id === userId;
    const fieldPrefix = isHost ? 'host' : 'guest';
    const opponent = isHost ? room.guest : room.host;
    
    const updateData: any = {
      [`${fieldPrefix}.status`]: 'waiting',
      [`${fieldPrefix}.progress`]: 0,
      [`${fieldPrefix}.time`]: null,
      [`${fieldPrefix}.accuracy`]: null
    };

    // If opponent is already waiting, reset the room to waiting
    if (opponent?.status === 'waiting') {
      updateData.status = 'waiting';
      updateData.winnerId = null;
    }

    await updateDoc(doc(db, 'rooms', room.roomId), updateData);
  };

  const sendMessage = async (text: string) => {
    if (!room || !text.trim()) return;
    const msg: ChatMessage = {
      playerId: userId,
      playerName: userName || 'Anonymous',
      text: text.trim(),
      timestamp: Date.now(),
    };
    await updateDoc(doc(db, 'rooms', room.roomId), {
      messages: arrayUnion(msg),
    });
  };

  return {
    room,
    error,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    updateProgress,
    finishGame,
    leaveRoom,
    sendMessage,
    playAgain,
  };
};
