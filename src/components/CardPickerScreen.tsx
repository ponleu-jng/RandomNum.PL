import React, { useState } from 'react';
import { Layers, RotateCcw, Sparkles, Check, Shield } from 'lucide-react';
import { sampleCryptographicInt, calculateAuditHash } from '../utils/quantumRng';
import { playQuantumTick, playQuantumSnap } from '../utils/audio';

interface CardPickerScreenProps {
  audioEnabled: boolean;
}

interface Card {
  id: string;
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  color: 'red' | 'black';
  name: string;
}

const SUITS: Array<{ symbol: '♠' | '♥' | '♦' | '♣'; color: 'red' | 'black'; name: string }> = [
  { symbol: '♠', color: 'black', name: 'Spades' },
  { symbol: '♥', color: 'red', name: 'Hearts' },
  { symbol: '♦', color: 'red', name: 'Diamonds' },
  { symbol: '♣', color: 'black', name: 'Clubs' },
];

const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function generateFullDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach(s => {
    VALUES.forEach(v => {
      deck.push({
        id: `${v}${s.symbol}`,
        suit: s.symbol,
        value: v,
        color: s.color,
        name: `${v} of ${s.name}`,
      });
    });
  });
  return deck;
}

export const CardPickerScreen: React.FC<CardPickerScreenProps> = ({ audioEnabled }) => {
  const [deck, setDeck] = useState<Card[]>(() => generateFullDeck());
  const [hand, setHand] = useState<Card[]>([
    { id: 'A♠', suit: '♠', value: 'A', color: 'black', name: 'Ace of Spades' },
    { id: 'K♥', suit: '♥', value: 'K', color: 'red', name: 'King of Hearts' },
    { id: '10♦', suit: '♦', value: '10', color: 'red', name: '10 of Diamonds' },
  ]);
  const [drawCount, setDrawCount] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [auditHash, setAuditHash] = useState<string>('0x72a1...bc89');

  const handleDrawCards = async (count: number = drawCount) => {
    if (deck.length === 0 || isDrawing) return;
    setIsDrawing(true);

    if (audioEnabled) {
      playQuantumTick(880);
    }

    // Animation delay
    setTimeout(async () => {
      const currentDeck = [...deck];
      const drawnCards: Card[] = [];

      for (let i = 0; i < Math.min(count, currentDeck.length); i++) {
        const randIdx = sampleCryptographicInt(0, currentDeck.length - 1);
        const card = currentDeck.splice(randIdx, 1)[0];
        drawnCards.push(card);
      }

      setDeck(currentDeck);
      setHand(drawnCards);
      setIsDrawing(false);

      if (audioEnabled) {
        playQuantumSnap(620);
      }

      const hashInfo = await calculateAuditHash(
        drawnCards.length,
        drawnCards.map(c => c.value.charCodeAt(0)),
        1,
        52,
        new Date().toTimeString().split(' ')[0],
        99.85
      );
      setAuditHash(hashInfo.shortHash);
    }, 280);
  };

  const handleResetDeck = () => {
    setDeck(generateFullDeck());
    setHand([]);
    if (audioEnabled) playQuantumTick(500);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Visual Hand & Deal */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-6 sm:p-8 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#908fa0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                QUANTUM SHUFFLE & CUT
              </span>
              <span className="text-[#c0c1ff]">
                Audit Hash: {auditHash}
              </span>
            </div>

            {/* Hand Cards Area */}
            <div className="py-6 min-h-[220px] flex items-center justify-center">
              {hand.length === 0 ? (
                <div className="text-center text-xs font-mono text-[#908fa0] py-12">
                  No cards dealt yet. Choose quantity below to sample.
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  {hand.map((card, idx) => (
                    <div
                      key={`card-hand-${card.id}-${idx}`}
                      className={`w-24 sm:w-28 h-36 sm:h-40 rounded-xl bg-white border-2 p-2.5 flex flex-col justify-between shadow-2xl transition-all hover:-translate-y-2 cursor-pointer ${
                        card.color === 'red' ? 'text-red-600 border-red-200' : 'text-slate-900 border-slate-200'
                      }`}
                    >
                      {/* Top Corner */}
                      <div className="flex items-center justify-between">
                        <span className="font-space font-bold text-xl sm:text-2xl leading-none">
                          {card.value}
                        </span>
                        <span className="text-lg leading-none">{card.suit}</span>
                      </div>

                      {/* Center Giant Suit */}
                      <div className="text-center text-4xl sm:text-5xl select-none leading-none">
                        {card.suit}
                      </div>

                      {/* Bottom Inverted Corner */}
                      <div className="flex items-center justify-between rotate-180">
                        <span className="font-space font-bold text-xl sm:text-2xl leading-none">
                          {card.value}
                        </span>
                        <span className="text-lg leading-none">{card.suit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="pt-4 border-t border-[#222a3d] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#908fa0]">DRAW COUNT:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 5].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => setDrawCount(cnt)}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          drawCount === cnt
                            ? 'bg-[#171f33] text-white border border-[#31394d] font-bold'
                            : 'bg-[#060e20] text-[#908fa0] border border-[#222a3d]'
                        }`}
                      >
                        {cnt}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#908fa0]">REMAINING DECK:</span>
                  <span className="text-white font-bold px-2 py-0.5 rounded bg-[#060e20] border border-[#222a3d]">
                    {deck.length} / 52
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleDrawCards(drawCount)}
                  disabled={deck.length === 0 || isDrawing}
                  className="py-3.5 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6366f1] hover:from-[#9093ff] hover:to-[#6f72f7] active:scale-[0.99] text-white font-space font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Layers className={`w-4 h-4 ${isDrawing ? 'animate-spin' : ''}`} />
                  <span>DEAL QUANTUM CARDS ({drawCount})</span>
                </button>

                <button
                  onClick={handleResetDeck}
                  className="py-3.5 rounded-xl bg-[#171f33] hover:bg-[#222a3d] border border-[#31394d] text-white font-space font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#c0c1ff]" />
                  <span>RESET & CUT DECK (52 CARDS)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hand Details & Poker Analysis */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-3.5">
            <span className="text-xs font-space font-semibold text-white">DEALT HAND DETAILS</span>

            <div className="space-y-2">
              {hand.map((c, i) => (
                <div
                  key={`hand-detail-${c.id}-${i}`}
                  className="p-2.5 rounded-xl bg-[#060e20] border border-[#222a3d] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold ${c.color === 'red' ? 'text-red-400' : 'text-[#dae2fd]'}`}>
                      {c.suit}
                    </span>
                    <span className="text-white font-medium">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-[#4edea3]">AUTHENTIC</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#222a3d] space-y-2 text-xs font-mono text-[#908fa0]">
              <div className="flex items-center justify-between">
                <span>Card Uniformity:</span>
                <span className="text-[#4edea3]">1 / 52 (P = 1.92%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Replacement:</span>
                <span className="text-white">Strict Without Replacement</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Entropy Source:</span>
                <span className="text-[#c0c1ff]">Optical Vacuum Flux</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
