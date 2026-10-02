import React, { useState } from 'react';
import { Dices, RotateCcw, Plus, Minus, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { sampleCryptographicInt, calculateAuditHash } from '../utils/quantumRng';
import { playDiceRollSound, playQuantumSnap } from '../utils/audio';

interface DiceRollerScreenProps {
  audioEnabled: boolean;
}

interface DieConfig {
  type: string;
  sides: number;
  label: string;
  iconName: string;
}

const DICE_TYPES: DieConfig[] = [
  { type: 'd4', sides: 4, label: 'D4', iconName: '▲' },
  { type: 'd6', sides: 6, label: 'D6', iconName: '■' },
  { type: 'd8', sides: 8, label: 'D8', iconName: '◆' },
  { type: 'd10', sides: 10, label: 'D10', iconName: '⬟' },
  { type: 'd12', sides: 12, label: 'D12', iconName: '⬢' },
  { type: 'd20', sides: 20, label: 'D20', iconName: '⬣' },
  { type: 'd100', sides: 100, label: 'D100', iconName: '%' },
];

export const DiceRollerScreen: React.FC<DiceRollerScreenProps> = ({ audioEnabled }) => {
  const [selectedDie, setSelectedDie] = useState<DieConfig>(DICE_TYPES[5]); // Default D20
  const [diceCount, setDiceCount] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');

  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [results, setResults] = useState<number[]>([18]);
  const [discardedResults, setDiscardedResults] = useState<number[]>([]);
  const [totalSum, setTotalSum] = useState<number>(18);
  const [recentRolls, setRecentRolls] = useState<Array<{ id: string; text: string; total: number; hash: string }>>([
    { id: 'dice-init-1', text: '1d20 + 0', total: 18, hash: '0x8b32...5c1a' },
    { id: 'dice-init-2', text: '2d6 + 3', total: 11, hash: '0x4f12...7e90' },
  ]);

  const handleRoll = async () => {
    if (isRolling) return;
    setIsRolling(true);

    if (audioEnabled) {
      playDiceRollSound();
    }

    // Rolling animation
    let frames = 0;
    const interval = setInterval(() => {
      frames++;
      const temp: number[] = [];
      for (let i = 0; i < (rollMode !== 'normal' ? 2 : diceCount); i++) {
        temp.push(sampleCryptographicInt(1, selectedDie.sides));
      }
      setResults(temp);

      if (frames >= 8) {
        clearInterval(interval);
        finalizeDiceRoll();
      }
    }, 45);

    const finalizeDiceRoll = async () => {
      let finalVals: number[] = [];
      let discarded: number[] = [];

      if (rollMode === 'advantage') {
        const d1 = sampleCryptographicInt(1, selectedDie.sides);
        const d2 = sampleCryptographicInt(1, selectedDie.sides);
        if (d1 >= d2) {
          finalVals = [d1];
          discarded = [d2];
        } else {
          finalVals = [d2];
          discarded = [d1];
        }
      } else if (rollMode === 'disadvantage') {
        const d1 = sampleCryptographicInt(1, selectedDie.sides);
        const d2 = sampleCryptographicInt(1, selectedDie.sides);
        if (d1 <= d2) {
          finalVals = [d1];
          discarded = [d2];
        } else {
          finalVals = [d2];
          discarded = [d1];
        }
      } else {
        for (let i = 0; i < diceCount; i++) {
          finalVals.push(sampleCryptographicInt(1, selectedDie.sides));
        }
      }

      const sum = finalVals.reduce((a, b) => a + b, 0) + modifier;
      setResults(finalVals);
      setDiscardedResults(discarded);
      setTotalSum(sum);
      setIsRolling(false);

      if (audioEnabled) {
        playQuantumSnap(selectedDie.sides === 20 && finalVals[0] === 20 ? 880 : 540);
      }

      // Hash stamp
      const hashInfo = await calculateAuditHash(
        recentRolls.length + 1,
        finalVals,
        1,
        selectedDie.sides,
        new Date().toTimeString().split(' ')[0],
        99.8
      );

      const rollDesc = rollMode !== 'normal'
        ? `1${selectedDie.type} (${rollMode})`
        : `${diceCount}${selectedDie.type}${modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : ''}`;

      setRecentRolls(prev => [
        { id: `roll-${Date.now()}-${Math.random()}`, text: rollDesc, total: sum, hash: hashInfo.shortHash },
        ...prev.slice(0, 7),
      ]);
    };
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Polyhedral Selector & Hero Result */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Hero Dice Card */}
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#908fa0] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                QUANTUM POLYHEDRAL ENGINE
              </span>
              <span className="text-[#c0c1ff]">
                {rollMode !== 'normal' ? `1${selectedDie.type} [${rollMode.toUpperCase()}]` : `${diceCount}${selectedDie.type}`}
                {modifier !== 0 && (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`)}
              </span>
            </div>

            {/* Central Display */}
            <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
              <div
                className={`font-space font-bold tracking-tight text-white transition-all ${
                  isRolling ? 'scale-95 blur-[1px]' : 'scale-100 glow-text-primary'
                } text-6xl sm:text-8xl flex items-center gap-4`}
              >
                {results.length === 1 ? (
                  <div className="flex items-center gap-3">
                    <span>{totalSum}</span>
                    {selectedDie.sides === 20 && totalSum === 20 && (
                      <span className="text-xs px-2 py-1 rounded bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40 font-mono tracking-wider animate-pulse">
                        NATURAL 20!
                      </span>
                    )}
                    {selectedDie.sides === 20 && totalSum === 1 && (
                      <span className="text-xs px-2 py-1 rounded bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 font-mono tracking-wider">
                        CRITICAL FAIL
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-6xl sm:text-7xl">{totalSum}</span>
                    <span className="text-xs font-mono text-[#908fa0] mt-2">
                      Dice: [{results.join(', ')}]{modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Show discarded die in advantage/disadvantage */}
              {discardedResults.length > 0 && (
                <div className="text-xs font-mono text-[#908fa0] mt-3">
                  Discarded roll: <span className="line-through text-[#ffb4ab]">{discardedResults[0]}</span>
                </div>
              )}
            </div>

            {/* Dice Face Tray */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 border-t border-[#222a3d]">
              {results.map((val, idx) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-xl bg-[#060e20] border border-[#31394d] flex flex-col items-center justify-center shadow-md group hover:border-[#8083ff] transition-colors"
                >
                  <span className="text-[10px] text-[#908fa0] font-mono leading-none">
                    {selectedDie.label}
                  </span>
                  <span className="font-space font-bold text-white text-base leading-tight">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dice Selector Bar & Modifiers */}
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-4">
            <div className="text-xs font-mono text-[#908fa0]">SELECT DIE TYPE:</div>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DICE_TYPES.map(die => {
                const isSelected = selectedDie.type === die.type;
                return (
                  <button
                    key={die.type}
                    onClick={() => setSelectedDie(die)}
                    className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#171f33] text-white border-2 border-[#8083ff] shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'bg-[#060e20] text-[#908fa0] hover:text-[#dae2fd] border border-[#222a3d]'
                    }`}
                  >
                    <span className="text-lg">{die.iconName}</span>
                    <span className="font-space font-bold text-xs">{die.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quantity, Modifier, Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              {/* Dice Count */}
              <div className="p-3 rounded-xl bg-[#060e20] border border-[#222a3d] space-y-1">
                <span className="text-[#908fa0]">DICE COUNT</span>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDiceCount(c => Math.max(1, c - 1))}
                    disabled={rollMode !== 'normal'}
                    className="w-7 h-7 rounded bg-[#171f33] hover:bg-[#222a3d] text-white flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="font-space font-bold text-lg text-white">
                    {rollMode !== 'normal' ? 1 : diceCount}
                  </span>
                  <button
                    onClick={() => setDiceCount(c => Math.min(20, c + 1))}
                    disabled={rollMode !== 'normal'}
                    className="w-7 h-7 rounded bg-[#171f33] hover:bg-[#222a3d] text-white flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Modifier */}
              <div className="p-3 rounded-xl bg-[#060e20] border border-[#222a3d] space-y-1">
                <span className="text-[#908fa0]">MODIFIER (+/-)</span>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setModifier(m => m - 1)}
                    className="w-7 h-7 rounded bg-[#171f33] hover:bg-[#222a3d] text-white flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-space font-bold text-lg text-white">
                    {modifier > 0 ? `+${modifier}` : modifier}
                  </span>
                  <button
                    onClick={() => setModifier(m => m + 1)}
                    className="w-7 h-7 rounded bg-[#171f33] hover:bg-[#222a3d] text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Advantage Mode (D20) */}
              <div className="p-3 rounded-xl bg-[#060e20] border border-[#222a3d] space-y-1">
                <span className="text-[#908fa0]">ADVANTAGE</span>
                <div className="flex items-center gap-1">
                  {(['normal', 'advantage', 'disadvantage'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setRollMode(mode)}
                      className={`flex-1 py-1 rounded text-[10px] font-semibold uppercase transition-colors cursor-pointer ${
                        rollMode === mode
                          ? 'bg-[#171f33] text-[#4edea3] border border-[#31394d]'
                          : 'text-[#908fa0] hover:text-white'
                      }`}
                    >
                      {mode === 'normal' ? 'Norm' : mode === 'advantage' ? 'Adv' : 'Dis'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Roll Action Button */}
            <button
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6366f1] hover:from-[#9093ff] hover:to-[#6f72f7] active:scale-[0.99] text-white font-space font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>ROLL QUANTUM DICE</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dice History & Formulas */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-space font-semibold text-white">RECENT ROLLS</span>
              <button
                onClick={() => setRecentRolls([])}
                className="text-xs text-[#908fa0] hover:text-[#ffb4ab] cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2">
              {recentRolls.map(r => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-[#060e20] border border-[#222a3d] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-mono text-[#dae2fd]">{r.text}</div>
                    <div className="text-[10px] font-mono text-[#908fa0]">{r.hash}</div>
                  </div>
                  <div className="font-space font-bold text-xl text-[#4edea3]">
                    {r.total}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick RPG Presets */}
            <div className="pt-3 border-t border-[#222a3d] space-y-2">
              <span className="text-xs font-mono text-[#908fa0]">QUICK RPG MACROS:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Initiative (1d20)', action: () => { setSelectedDie(DICE_TYPES[5]); setDiceCount(1); setModifier(0); setRollMode('normal'); } },
                  { label: 'Ability (4d6 Drop)', action: () => { setSelectedDie(DICE_TYPES[1]); setDiceCount(4); setModifier(0); setRollMode('normal'); } },
                  { label: 'Sneak Attack (3d6)', action: () => { setSelectedDie(DICE_TYPES[1]); setDiceCount(3); setModifier(0); setRollMode('normal'); } },
                  { label: 'Percentile (1d100)', action: () => { setSelectedDie(DICE_TYPES[6]); setDiceCount(1); setModifier(0); setRollMode('normal'); } },
                ].map((m, idx) => (
                  <button
                    key={idx}
                    onClick={m.action}
                    className="p-2 rounded-lg bg-[#060e20] hover:bg-[#171f33] border border-[#222a3d] text-left text-xs font-mono text-[#dae2fd] transition-colors cursor-pointer"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
