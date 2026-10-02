import React, { useState } from 'react';
import { CircleDot, RotateCw, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { sampleCryptographicInt, calculateAuditHash } from '../utils/quantumRng';
import { playCoinFlipSound, playQuantumSnap } from '../utils/audio';

interface CoinFlipScreenProps {
  audioEnabled: boolean;
}

export const CoinFlipScreen: React.FC<CoinFlipScreenProps> = ({ audioEnabled }) => {
  const [result, setResult] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [headsCount, setHeadsCount] = useState<number>(14);
  const [tailsCount, setTailsCount] = useState<number>(13);
  const [streak, setStreak] = useState<{ side: 'HEADS' | 'TAILS'; count: number }>({ side: 'HEADS', count: 2 });
  const flipCounterRef = React.useRef<number>(4);
  const [history, setHistory] = useState<Array<{ id: string; displayNum: number; side: 'HEADS' | 'TAILS'; hash: string }>>([
    { id: 'init-1', displayNum: 1, side: 'HEADS', hash: '0xa41c...89bf' },
    { id: 'init-2', displayNum: 2, side: 'HEADS', hash: '0x33e1...58cd' },
    { id: 'init-3', displayNum: 3, side: 'TAILS', hash: '0x7129...aa01' },
    { id: 'init-4', displayNum: 4, side: 'HEADS', hash: '0x0d41...b723' },
  ]);

  const flipCoin = async (count: number = 1) => {
    if (isFlipping) return;
    setIsFlipping(true);

    if (audioEnabled) {
      playCoinFlipSound();
    }

    // Spin animation degrees
    const extraRotations = 1800 + (Math.random() > 0.5 ? 180 : 0);
    setRotation(prev => prev + extraRotations);

    setTimeout(async () => {
      let lastOutcome: 'HEADS' | 'TAILS' = 'HEADS';
      let addHeads = 0;
      let addTails = 0;
      const newItems: Array<{ id: string; displayNum: number; side: 'HEADS' | 'TAILS'; hash: string }> = [];

      for (let i = 0; i < count; i++) {
        // True quantum sample: 0 = HEADS, 1 = TAILS
        const bit = sampleCryptographicInt(0, 1);
        const outcome = bit === 0 ? 'HEADS' : 'TAILS';
        lastOutcome = outcome;
        if (outcome === 'HEADS') addHeads++;
        else addTails++;

        const currentFlipIndex = ++flipCounterRef.current;

        const hash = await calculateAuditHash(
          currentFlipIndex,
          [bit],
          0,
          1,
          new Date().toTimeString().split(' ')[0],
          99.85
        );

        newItems.unshift({
          id: `flip-${currentFlipIndex}-${Date.now()}-${Math.random()}`,
          displayNum: currentFlipIndex,
          side: outcome,
          hash: hash.shortHash,
        });
      }

      setResult(lastOutcome);
      setHeadsCount(h => h + addHeads);
      setTailsCount(t => t + addTails);

      // Streak update
      setStreak(prev => {
        if (prev.side === lastOutcome) {
          return { side: lastOutcome, count: prev.count + 1 };
        }
        return { side: lastOutcome, count: 1 };
      });

      setHistory(prev => [...newItems, ...prev].slice(0, 20));
      setIsFlipping(false);

      if (audioEnabled) {
        playQuantumSnap(680);
      }
    }, 700);
  };

  const totalFlips = headsCount + tailsCount;
  const headsPercent = totalFlips > 0 ? Math.round((headsCount / totalFlips) * 100) : 50;
  const tailsPercent = 100 - headsPercent;

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: 3D Coin & Collapse */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
            
            {/* Top row */}
            <div className="w-full flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 text-[#908fa0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                HADAMARD GATE SUPERPOSITION
              </span>
              <span className="text-[#c0c1ff]">
                |Ψ⟩ = 1/√2(|0⟩ + |1⟩)
              </span>
            </div>

            {/* 3D Coin Container */}
            <div className="py-12 sm:py-16 perspective-[1000px]">
              <div
                className="w-36 h-36 sm:w-44 sm:h-44 rounded-full relative transition-transform duration-700 select-none shadow-[0_0_35px_rgba(78,222,163,0.3)]"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${rotation}deg)`,
                }}
              >
                {/* Heads Face */}
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#171f33] via-[#222a3d] to-[#0b1326] border-4 border-[#4edea3] flex flex-col items-center justify-center absolute backface-hidden shadow-inner">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-dashed border-[#4edea3]/50 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-space font-bold text-white tracking-widest">
                      HEADS
                    </span>
                    <span className="text-[10px] font-mono text-[#4edea3] mt-1">
                      STATE |0⟩
                    </span>
                  </div>
                </div>

                {/* Tails Face */}
                <div
                  className="w-full h-full rounded-full bg-gradient-to-br from-[#171f33] via-[#222a3d] to-[#0b1326] border-4 border-[#c0c1ff] flex flex-col items-center justify-center absolute backface-hidden shadow-inner"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-dashed border-[#c0c1ff]/50 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-space font-bold text-white tracking-widest">
                      TAILS
                    </span>
                    <span className="text-[10px] font-mono text-[#c0c1ff] mt-1">
                      STATE |1⟩
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Superposition Status */}
            <div className="text-center space-y-1">
              <div className="font-space font-bold text-3xl sm:text-4xl text-white">
                {isFlipping ? 'SUPERPOSITION FLUX...' : result}
              </div>
              <div className="text-xs font-mono text-[#908fa0]">
                {isFlipping
                  ? 'Wavefunction indeterminate until measurement collapse'
                  : `Wavefunction collapsed into definite eigenstate (${result === 'HEADS' ? '|0⟩' : '|1⟩'})`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-8 mt-4 border-t border-[#222a3d]">
              <button
                onClick={() => flipCoin(1)}
                disabled={isFlipping}
                className="py-3 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6366f1] hover:from-[#9093ff] hover:to-[#6f72f7] active:scale-[0.99] text-white font-space font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isFlipping ? 'animate-spin' : ''}`} />
                <span>FLIP COIN (1x)</span>
              </button>

              <button
                onClick={() => flipCoin(5)}
                disabled={isFlipping}
                className="py-3 rounded-xl bg-[#171f33] hover:bg-[#222a3d] border border-[#31394d] text-white font-space font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>FLIP 5x BATCH</span>
              </button>

              <button
                onClick={() => flipCoin(25)}
                disabled={isFlipping}
                className="py-3 rounded-xl bg-[#171f33] hover:bg-[#222a3d] border border-[#31394d] text-white font-space font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>SIMULATE 25x</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics & Streaks */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-space font-semibold text-white">FLIP RATIOS & BIAS</span>
              <span className="text-xs font-mono text-[#908fa0]">{totalFlips} Total</span>
            </div>

            {/* Split Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 rounded-full bg-[#060e20] overflow-hidden flex border border-[#222a3d]">
                <div
                  className="bg-[#4edea3] h-full transition-all duration-300"
                  style={{ width: `${headsPercent}%` }}
                ></div>
                <div
                  className="bg-[#c0c1ff] h-full transition-all duration-300"
                  style={{ width: `${tailsPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#4edea3] font-semibold">Heads: {headsCount} ({headsPercent}%)</span>
                <span className="text-[#c0c1ff] font-semibold">Tails: {tailsCount} ({tailsPercent}%)</span>
              </div>
            </div>

            {/* Streak Tracker */}
            <div className="p-3 rounded-xl bg-[#060e20] border border-[#222a3d] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#908fa0]">ACTIVE STREAK</div>
                <div className="font-space font-bold text-lg text-white mt-0.5">
                  {streak.count}x {streak.side}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-[#908fa0]">PROBABILITY</div>
                <div className="font-mono text-xs text-[#4edea3]">
                  {(Math.pow(0.5, streak.count) * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Recent Flips Log */}
            <div className="pt-2 border-t border-[#222a3d] space-y-2">
              <span className="text-xs font-mono text-[#908fa0]">RECENT EIGENVALUES:</span>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-[#060e20] border border-[#222a3d] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#908fa0]">#{item.displayNum}</span>
                      <span className={item.side === 'HEADS' ? 'text-[#4edea3] font-bold' : 'text-[#c0c1ff] font-bold'}>
                        {item.side}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#908fa0]">{item.hash}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
