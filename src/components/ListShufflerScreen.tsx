import React, { useState } from 'react';
import { Shuffle, Users, Check, Copy, ArrowDownUp, Sparkles, RefreshCw } from 'lucide-react';
import { sampleCryptographicInt, calculateAuditHash } from '../utils/quantumRng';
import { playQuantumTick, playQuantumSnap } from '../utils/audio';

interface ListShufflerScreenProps {
  audioEnabled: boolean;
}

export const ListShufflerScreen: React.FC<ListShufflerScreenProps> = ({ audioEnabled }) => {
  const [inputText, setInputText] = useState<string>(
    `Quantum Node 1\nPhoton Detector 2\nCryogenic Chamber 3\nInterferometer 4\nWaveguide Core 5\nLaser Cavity 6\nVacuum Sensor 7\nPolarizer Array 8`
  );
  const [shuffledList, setShuffledList] = useState<string[]>([
    'Vacuum Sensor 7',
    'Laser Cavity 6',
    'Quantum Node 1',
    'Interferometer 4',
    'Cryogenic Chamber 3',
    'Polarizer Array 8',
    'Photon Detector 2',
    'Waveguide Core 5',
  ]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [groupCount, setGroupCount] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);

  // Quantum Fisher-Yates Shuffle
  const handleShuffle = async () => {
    const rawItems = inputText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (rawItems.length === 0 || isShuffling) return;
    setIsShuffling(true);

    if (audioEnabled) {
      playQuantumTick(880);
    }

    let iterations = 0;
    const interval = setInterval(() => {
      iterations++;
      // Rapid pseudo-swap for animation
      const temp = [...rawItems];
      for (let i = temp.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [temp[i], temp[j]] = [temp[j], temp[i]];
      }
      setShuffledList(temp);

      if (iterations >= 8) {
        clearInterval(interval);
        // Cryptographic Fisher-Yates
        const finalArr = [...rawItems];
        for (let i = finalArr.length - 1; i > 0; i--) {
          const j = sampleCryptographicInt(0, i);
          [finalArr[i], finalArr[j]] = [finalArr[j], finalArr[i]];
        }
        setShuffledList(finalArr);
        setIsShuffling(false);
        if (audioEnabled) playQuantumSnap(560);
      }
    }, 45);
  };

  const handleCopyList = () => {
    navigator.clipboard.writeText(shuffledList.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group split helper
  const groups: string[][] = [];
  if (groupCount > 1 && shuffledList.length > 0) {
    for (let i = 0; i < groupCount; i++) {
      groups.push([]);
    }
    shuffledList.forEach((item, idx) => {
      groups[idx % groupCount].push(item);
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Input text & controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownUp className="w-5 h-5 text-[#c0c1ff]" />
                <h2 className="font-space font-bold text-lg text-white">
                  Quantum List Permutation
                </h2>
              </div>
              <span className="text-xs font-mono text-[#908fa0]">
                Fisher-Yates O(N)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#908fa0]">
                ENTER ITEMS (ONE PER LINE):
              </label>
              <textarea
                rows={9}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#060e20] border border-[#222a3d] text-xs font-mono text-white focus:outline-none focus:border-[#8083ff] resize-none"
              />
            </div>

            {/* Group split configuration */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#060e20] border border-[#222a3d] text-xs font-mono">
              <div className="flex items-center gap-2 text-[#908fa0]">
                <Users className="w-4 h-4 text-[#4edea3]" />
                <span>DIVIDE INTO TEAMS / GROUPS:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map(g => (
                  <button
                    key={g}
                    onClick={() => setGroupCount(g)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      groupCount === g
                        ? 'bg-[#171f33] text-white border border-[#31394d] font-bold'
                        : 'text-[#908fa0] hover:text-white'
                    }`}
                  >
                    {g === 1 ? 'None' : `${g} Teams`}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleShuffle}
              disabled={isShuffling}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6366f1] hover:from-[#9093ff] hover:to-[#6f72f7] active:scale-[0.99] text-white font-space font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Shuffle className={`w-5 h-5 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>PERMUTE LIST (TRUE RANDOM)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Shuffled Output & Team Split */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-space font-semibold">
                <Sparkles className="w-4 h-4 text-[#4edea3]" />
                <span>PERMUTED RESULT</span>
              </div>

              <button
                onClick={handleCopyList}
                className="flex items-center gap-1.5 text-xs text-[#908fa0] hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy List'}</span>
              </button>
            </div>

            {/* Render Groups or Single List */}
            {groupCount > 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((grp, gIdx) => (
                  <div key={gIdx} className="p-3 rounded-xl bg-[#060e20] border border-[#222a3d] space-y-2">
                    <div className="text-xs font-mono font-bold text-[#4edea3] flex items-center justify-between">
                      <span>TEAM #{gIdx + 1}</span>
                      <span className="text-[10px] text-[#908fa0]">{grp.length} items</span>
                    </div>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                      {grp.map((item, i) => (
                        <div key={i} className="text-xs font-mono text-[#dae2fd] truncate py-0.5">
                          {i + 1}. {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {shuffledList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#060e20] border border-[#222a3d] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#908fa0] w-6">#{idx + 1}</span>
                      <span className="text-white font-medium">{item}</span>
                    </div>
                    <span className="text-[10px] text-[#4edea3]">ZERO-BIAS</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
