import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { malinMusic } from '../audio/malinMusic';

interface MusicPlayerBarProps {
  isAutoPlay?: boolean;
}

export const MusicPlayerBar: React.FC<MusicPlayerBarProps> = ({ isAutoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isAutoPlay && !isPlaying) {
      malinMusic.start();
      setIsPlaying(true);
    }
  }, [isAutoPlay]);

  const togglePlay = () => {
    if (isPlaying) {
      malinMusic.stop();
      setIsPlaying(false);
    } else {
      malinMusic.start();
      malinMusic.setVolume(isMuted ? 0 : volume);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (!isMuted) {
      malinMusic.setVolume(newVol);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      malinMusic.setVolume(volume);
    } else {
      setIsMuted(true);
      malinMusic.setVolume(0);
    }
  };

  return (
    <div className="fixed top-15 sm:top-14 inset-x-0 z-20 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-rose-500/30 shadow-lg shadow-rose-950/30 text-xs animate-in slide-in-from-top-2 duration-300">
        {/* Animated equalizer bars / Icon */}
        <div className="flex items-center gap-1.5 text-rose-400">
          <Music className="w-3.5 h-3.5 shrink-0" />
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-3 w-4">
              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s] h-full" />
              <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2/3" />
              <span className="w-1 bg-rose-400 rounded-full animate-bounce h-4/5" />
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-rose-500/60" />
          )}
        </div>

        {/* Track Title */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-rose-200">Mata – 5 malin</span>
          <span className="text-[10px] text-rose-400/80 font-mono hidden sm:inline">(158 BPM · B minor)</span>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              : 'bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900'
          }`}
          title={isPlaying ? 'Zatrzymaj muzykę w tle' : 'Włącz utwór 5 malin w tle'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-white" />
              <span>GRA</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-rose-300" />
              <span>ODTWÓRZ</span>
            </>
          )}
        </button>

        {/* Volume slider & mute */}
        <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-2">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-rose-300 transition-colors"
            title={isMuted ? 'Wyłącz wyciszenie' : 'Wycisz muzykę'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-16 h-1 accent-rose-400 bg-slate-800 rounded-lg cursor-pointer"
            title="Głośność utworu 5 malin"
          />
        </div>
      </div>
    </div>
  );
};
