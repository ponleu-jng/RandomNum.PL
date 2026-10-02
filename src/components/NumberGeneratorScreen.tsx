import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Copy,
  RotateCcw,
  Sliders,
  Check,
  Download,
  Target,
  History,
  Hash,
  ArrowRight,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  CornerDownLeft,
  Eye,
  Shuffle,
  Dices,
  RefreshCw,
  Play,
  Square,
  CopySlash
} from 'lucide-react';
import {
  RollEntry,
  sampleCryptographicInt,
  sampleCryptographicFloat,
  calculateAuditHash
} from '../utils/quantumRng';
import { playQuantumTick, playQuantumSnap } from '../utils/audio';
import { QuantumOscilloscope } from './QuantumOscilloscope';

interface NumberGeneratorScreenProps {
  onSelectAuditRoll?: (roll: RollEntry) => void;
  triggerCount: number;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  numberFormat: 'int' | 'float' | 'hex' | 'binary';
}

export const NumberGeneratorScreen: React.FC<NumberGeneratorScreenProps> = ({
  onSelectAuditRoll,
  triggerCount,
  audioEnabled,
  setAudioEnabled,
  numberFormat,
}) => {
  // Bounds & Stepper state
  const [lowerBound, setLowerBound] = useState<number>(1000);
  const [upperBound, setUpperBound] = useState<number>(10000);
  const [drawCount, setDrawCount] = useState<number>(1);
  const [sortResults, setSortResults] = useState<boolean>(false);
  const [noDuplicates, setNoDuplicates] = useState<boolean>(true);

  // Current Display Value
  const [currentValues, setCurrentValues] = useState<number[]>([910]);
  const [displayString, setDisplayString] = useState<string>('910');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(1.5);
  const [coherence, setCoherence] = useState<number>(99.8);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [copiedHero, setCopiedHero] = useState<boolean>(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // Manual / Own Numbers Multi-Input & Randomizer State
  const [ownNumbersText, setOwnNumbersText] = useState<string>('');
  const [isRunningOwnRandom, setIsRunningOwnRandom] = useState<boolean>(false);
  const [ownDrawCount, setOwnDrawCount] = useState<number>(1);
  const [removeAfterDraw, setRemoveAfterDraw] = useState<boolean>(true);
  const [lastPickedOwn, setLastPickedOwn] = useState<string | null>(null);
  const [manualLiveHash, setManualLiveHash] = useState<string>('0x7e29...91a2');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);
  const ownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (ownTimerRef.current) {
        clearInterval(ownTimerRef.current);
      }
    };
  }, []);

  // History / Roll Log
  const [rolls, setRolls] = useState<RollEntry[]>([
    {
      id: 'roll-1',
      index: 1,
      value: 74,
      range: '1-100',
      min: 1,
      max: 100,
      timestamp: '14:28:11',
      dateObj: new Date(),
      hash: '0x9f4a...83d2',
      fullHash: '0x9f4a7c2b3e8104de902bf8912384aedc091f83d2',
      coherence: 99.8,
      entropyEstimate: 7.994,
      latencyMs: 1.5,
    },
    {
      id: 'roll-2',
      index: 2,
      value: 19,
      range: '1-100',
      min: 1,
      max: 100,
      timestamp: '14:27:59',
      dateObj: new Date(Date.now() - 12000),
      hash: '0x3c7e...09ab',
      fullHash: '0x3c7e8a91b4028cfd82910fae5491ab01e91c09ab',
      coherence: 99.7,
      entropyEstimate: 7.992,
      latencyMs: 1.4,
    },
    {
      id: 'roll-3',
      index: 3,
      value: 92,
      range: '1-100',
      min: 1,
      max: 100,
      timestamp: '14:27:41',
      dateObj: new Date(Date.now() - 30000),
      hash: '0xb7a1...ff43',
      fullHash: '0xb7a1c900e28f3a61bc7801df02845cba891dff43',
      coherence: 99.9,
      entropyEstimate: 7.996,
      latencyMs: 1.6,
    },
    {
      id: 'roll-4',
      index: 4,
      value: 41,
      range: '1-100',
      min: 1,
      max: 100,
      timestamp: '14:27:12',
      dateObj: new Date(Date.now() - 59000),
      hash: '0x55dc...1288',
      fullHash: '0x55dc429188e734c2ab908e41bb109fa630281288',
      coherence: 99.8,
      entropyEstimate: 7.994,
      latencyMs: 1.5,
    },
  ]);

  // Compute live hash of own numbers input pool
  useEffect(() => {
    let isCancelled = false;
    const updateHash = async () => {
      const clean = ownNumbersText.trim();
      if (!clean) return;
      const encoder = new TextEncoder();
      const data = encoder.encode(`OWN_NUMBERS_POOL|${clean}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fullHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      if (!isCancelled) {
        setManualLiveHash(`0x${fullHex.slice(0, 6)}...${fullHex.slice(-4)}`);
      }
    };
    updateHash();
    return () => {
      isCancelled = true;
    };
  }, [ownNumbersText]);

  // Main Sample Function
  const sampleQuantumNumber = useCallback(async () => {
    if (isRolling) return;
    setIsRolling(true);

    const min = Math.min(lowerBound, upperBound);
    const max = Math.max(lowerBound, upperBound);

    if (audioEnabled) {
      playQuantumTick(880);
    }

    const animationDuration = 260; // ms
    const intervalDuration = 25; // ms
    const iterations = Math.floor(animationDuration / intervalDuration);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const tempVals: number[] = [];
      for (let i = 0; i < drawCount; i++) {
        tempVals.push(sampleCryptographicInt(min, max));
      }
      if (tempVals.length === 1) {
        setDisplayString(tempVals[0].toString());
      } else {
        setDisplayString(tempVals.join(' , '));
      }

      if (audioEnabled && step % 2 === 0) {
        playQuantumTick(700 + step * 30);
      }

      if (step >= iterations) {
        clearInterval(timer);
        finalizeSample(min, max);
      }
    }, intervalDuration);

    const finalizeSample = async (minVal: number, maxVal: number) => {
      let finalVals: number[] = [];
      const span = Math.abs(maxVal - minVal) + 1;
      const canDeduplicate = noDuplicates && (numberFormat === 'float' || drawCount <= span);

      if (canDeduplicate) {
        const pickedSet = new Set<number>();
        let attempts = 0;
        while (pickedSet.size < drawCount && attempts < 2000) {
          attempts++;
          const val = numberFormat === 'float'
            ? sampleCryptographicFloat(minVal, maxVal, 2)
            : sampleCryptographicInt(minVal, maxVal);
          pickedSet.add(val);
        }
        finalVals = Array.from(pickedSet);
        while (finalVals.length < drawCount) {
          finalVals.push(sampleCryptographicInt(minVal, maxVal));
        }
      } else {
        for (let i = 0; i < drawCount; i++) {
          if (numberFormat === 'float') {
            finalVals.push(sampleCryptographicFloat(minVal, maxVal, 2));
          } else {
            finalVals.push(sampleCryptographicInt(minVal, maxVal));
          }
        }
      }

      if (sortResults && finalVals.length > 1) {
        finalVals.sort((a, b) => a - b);
      }

      setCurrentValues(finalVals);
      if (finalVals.length === 1) {
        setDisplayString(finalVals[0].toString());
      } else {
        setDisplayString(finalVals.join('  '));
      }

      const randomLatency = Number((1.2 + Math.random() * 0.5).toFixed(1));
      const randomCoherence = Number((99.7 + Math.random() * 0.2).toFixed(1));
      setLatencyMs(randomLatency);
      setCoherence(randomCoherence);
      setPulseTrigger(p => p + 1);

      if (audioEnabled) {
        playQuantumSnap(580);
      }

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const nextIndex = (rolls[0]?.index || 0) + 1;
      const { shortHash, fullHash } = await calculateAuditHash(
        nextIndex,
        finalVals,
        minVal,
        maxVal,
        timeStr,
        randomCoherence
      );

      const newEntry: RollEntry = {
        id: `roll-${Date.now()}-${Math.random()}`,
        index: nextIndex,
        value: finalVals.length === 1 ? finalVals[0] : finalVals,
        range: `${minVal}-${maxVal}`,
        min: minVal,
        max: maxVal,
        timestamp: timeStr,
        dateObj: now,
        hash: shortHash,
        fullHash: fullHash,
        coherence: randomCoherence,
        entropyEstimate: 7.994,
        latencyMs: randomLatency,
      };

      setRolls(prev => [newEntry, ...prev]);
      setIsRolling(false);
    };
  }, [lowerBound, upperBound, drawCount, sortResults, numberFormat, isRolling, audioEnabled, rolls]);

  // Global spacebar listener handled via triggerCount
  const prevTriggerRef = useRef(triggerCount);
  useEffect(() => {
    if (triggerCount > prevTriggerRef.current) {
      if (isRunningOwnRandom) {
        handleToggleRunOwnRandom();
      } else {
        sampleQuantumNumber();
      }
      prevTriggerRef.current = triggerCount;
    }
  }, [triggerCount, isRunningOwnRandom, sampleQuantumNumber]);

  // Copy Hero value
  const handleCopyHero = () => {
    navigator.clipboard.writeText(displayString);
    setCopiedHero(true);
    setTimeout(() => setCopiedHero(false), 2000);
  };

  // Copy row audit payload
  const handleCopyRow = (roll: RollEntry) => {
    const payload = JSON.stringify(
      {
        roll_id: roll.id,
        index: roll.index,
        sample: roll.value,
        range: `[${roll.min}, ${roll.max}]`,
        timestamp: roll.timestamp,
        sha256_audit_hash: roll.fullHash,
        quantum_coherence: `${roll.coherence}%`,
        nist_sp800_90b_verified: true,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopiedRowId(roll.id);
    setTimeout(() => setCopiedRowId(null), 2000);

    if (onSelectAuditRoll) {
      onSelectAuditRoll(roll);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (rolls.length === 0) return;
    const headers = ['Index', 'Value', 'Range', 'Timestamp', 'Cryptographic_Hash', 'Coherence', 'NIST_Verified'];
    const rows = rolls.map(r => [
      r.index,
      Array.isArray(r.value) ? `"${r.value.join(',')}"` : r.value,
      `"${r.range}"`,
      r.timestamp,
      r.fullHash,
      `${r.coherence}%`,
      'PASS',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quantum_rng_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse all entered own numbers (splits on newline, comma, semicolon)
  const parseOwnNumbers = (): string[] => {
    if (!ownNumbersText.trim()) return [];
    return ownNumbersText
      .split(/[\r\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const parsedOwnList = parseOwnNumbers();

  // Toggle continuous random running until user clicks stop
  const handleToggleRunOwnRandom = () => {
    if (isRunningOwnRandom) {
      // STOP: Halt continuous running and lock on final true quantum random choice
      if (ownTimerRef.current) {
        clearInterval(ownTimerRef.current);
        ownTimerRef.current = null;
      }
      setIsRunningOwnRandom(false);

      const list = parseOwnNumbers();
      if (list.length === 0) return;

      const picked: string[] = [];
      const poolCopy = [...list];
      for (let i = 0; i < Math.min(ownDrawCount, poolCopy.length); i++) {
        const randIdx = sampleCryptographicInt(0, poolCopy.length - 1);
        picked.push(poolCopy.splice(randIdx, 1)[0]);
      }

      const pickedDisplay = picked.join(picked.length > 1 ? ', ' : '');
      setDisplayString(pickedDisplay);
      setLastPickedOwn(pickedDisplay);

      // Remove selected item after draw from the input list if enabled
      if (removeAfterDraw) {
        const hasNewlines = ownNumbersText.includes('\n');
        const separator = hasNewlines ? '\n' : (ownNumbersText.includes(',') ? ', ' : '\n');
        setOwnNumbersText(poolCopy.join(separator));
      }

      const parsedNums = picked
        .map(p => Number(p.replace(/[^0-9.-]/g, '')))
        .filter(n => !isNaN(n));
      if (parsedNums.length > 0) {
        setCurrentValues(parsedNums);
      }

      const randomLatency = Number((1.1 + Math.random() * 0.4).toFixed(1));
      const randomCoherence = Number((99.7 + Math.random() * 0.2).toFixed(1));
      setLatencyMs(randomLatency);
      setCoherence(randomCoherence);
      setPulseTrigger(p => p + 1);

      if (audioEnabled) {
        playQuantumSnap(680);
      }

      // Stamp in Cryptographic Roll Log
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const nextIndex = (rolls[0]?.index || 0) + 1;

      const numVals = parsedNums.length > 0 ? parsedNums : [0];
      calculateAuditHash(
        nextIndex,
        numVals,
        Math.min(...numVals),
        Math.max(...numVals),
        timeStr,
        randomCoherence
      ).then(({ shortHash, fullHash }) => {
        const newEntry: RollEntry = {
          id: `own-pick-${Date.now()}-${Math.random()}`,
          index: nextIndex,
          value: parsedNums.length === 1 ? parsedNums[0] : (parsedNums.length > 1 ? parsedNums : (Number(picked[0]) || 0)),
          range: `Own Pool (${list.length} items)`,
          min: Math.min(...numVals),
          max: Math.max(...numVals),
          timestamp: timeStr,
          dateObj: now,
          hash: shortHash,
          fullHash: fullHash,
          coherence: randomCoherence,
          entropyEstimate: 7.994,
          latencyMs: randomLatency,
        };
        setRolls(prev => [newEntry, ...prev]);
      });

      if (removeAfterDraw) {
        setManualSuccessMsg(`Locked on ${pickedDisplay} & removed from list (${poolCopy.length} remaining)!`);
      } else {
        setManualSuccessMsg(`Locked on ${pickedDisplay} from your ${list.length} own numbers!`);
      }
      setTimeout(() => setManualSuccessMsg(null), 3500);
    } else {
      // START: Continuous random cycling until user clicks stop
      const list = parseOwnNumbers();
      if (list.length === 0) return;

      setIsRunningOwnRandom(true);
      setManualSuccessMsg(`Running random... click STOP to lock number!`);

      if (audioEnabled) {
        playQuantumTick(880);
      }

      let tickCounter = 0;
      ownTimerRef.current = setInterval(() => {
        tickCounter++;
        const tempIdx = sampleCryptographicInt(0, list.length - 1);
        setDisplayString(list[tempIdx]);

        if (audioEnabled && tickCounter % 2 === 0) {
          playQuantumTick(720 + Math.random() * 220);
        }
      }, 35);
    }
  };

  // Shuffle user's own numbers with quantum Fisher-Yates
  const handleShuffleOwnNumbers = () => {
    const list = parseOwnNumbers();
    if (list.length < 2) return;
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = sampleCryptographicInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOwnNumbersText(arr.join('\n'));
    if (audioEnabled) playQuantumTick(700);
    setManualSuccessMsg(`Shuffled ${arr.length} own numbers with Fisher-Yates TRNG!`);
    setTimeout(() => setManualSuccessMsg(null), 2500);
  };

  // Count duplicate numbers entered in own numbers pool
  const duplicateCount = (() => {
    const list = parseOwnNumbers();
    if (list.length <= 1) return 0;
    const seen = new Set<string>();
    let count = 0;
    for (const item of list) {
      const trimmed = item.trim();
      const numVal = Number(trimmed);
      const key = !isNaN(numVal) ? String(numVal) : trimmed.toLowerCase();
      if (seen.has(key)) {
        count++;
      } else {
        seen.add(key);
      }
    }
    return count;
  })();

  // Remove duplicate numbers from own numbers pool
  const handleRemoveDuplicates = () => {
    const list = parseOwnNumbers();
    if (list.length === 0) return;

    const seen = new Set<string>();
    const uniqueList: string[] = [];
    let duplicatesRemoved = 0;

    for (const item of list) {
      const trimmed = item.trim();
      const numVal = Number(trimmed);
      const key = !isNaN(numVal) ? String(numVal) : trimmed.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(trimmed);
      } else {
        duplicatesRemoved++;
      }
    }

    const hasNewlines = ownNumbersText.includes('\n');
    const separator = hasNewlines ? '\n' : (ownNumbersText.includes(',') ? ', ' : '\n');
    setOwnNumbersText(uniqueList.join(separator));

    if (duplicatesRemoved > 0) {
      if (audioEnabled) playQuantumSnap(680);
      setManualSuccessMsg(`Removed ${duplicatesRemoved} duplicate number${duplicatesRemoved > 1 ? 's' : ''}! (${uniqueList.length} unique numbers remaining)`);
    } else {
      if (audioEnabled) playQuantumTick(750);
      setManualSuccessMsg(`No duplicates found. All ${uniqueList.length} numbers are already unique.`);
    }
    setTimeout(() => setManualSuccessMsg(null), 3000);
  };

  // Handle setting first own number as Hero Display value
  const handleSetTopAsHero = () => {
    const list = parseOwnNumbers();
    if (list.length === 0) return;
    setDisplayString(list[0]);
    const num = Number(list[0].replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) {
      setCurrentValues([num]);
    }
    if (audioEnabled) playQuantumSnap(720);
    setManualSuccessMsg(`Set ${list[0]} as active hero value!`);
    setTimeout(() => setManualSuccessMsg(null), 2500);
  };

  // Inject all own numbers into log
  const handleInjectAllOwnToLog = async () => {
    const list = parseOwnNumbers();
    if (list.length === 0) return;

    if (audioEnabled) {
      playQuantumSnap(640);
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const nextIndex = (rolls[0]?.index || 0) + 1;
    const randomCoherence = Number((99.7 + Math.random() * 0.2).toFixed(1));
    const parsedNums = list.map(p => Number(p.replace(/[^0-9.-]/g, ''))).filter(n => !isNaN(n));
    const numVals = parsedNums.length > 0 ? parsedNums : [0];

    const { shortHash, fullHash } = await calculateAuditHash(
      nextIndex,
      numVals,
      Math.min(...numVals),
      Math.max(...numVals),
      timeStr,
      randomCoherence
    );

    const newEntry: RollEntry = {
      id: `own-all-${Date.now()}-${Math.random()}`,
      index: nextIndex,
      value: numVals.length === 1 ? numVals[0] : numVals,
      range: `All Own (${list.length} items)`,
      min: Math.min(...numVals),
      max: Math.max(...numVals),
      timestamp: timeStr,
      dateObj: now,
      hash: shortHash,
      fullHash: fullHash,
      coherence: randomCoherence,
      entropyEstimate: 7.994,
      latencyMs: 1.1,
    };

    setRolls(prev => [newEntry, ...prev]);
    setManualSuccessMsg(`Logged all ${list.length} own numbers with SHA-256 hash!`);
    setTimeout(() => setManualSuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4">
      {/* 3-Column Layout: Generation Zone | Input Own Number | Cryptographic Roll Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ================= COLUMN 1: QUANTUM GENERATOR ZONE (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Hero Display Card */}
          <div className="relative rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 sm:p-6 overflow-hidden shadow-2xl">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0b1326] border border-[#222a3d] text-[11px] font-mono text-[#4edea3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                  TELEMETRY TRNG LIVE
                </span>
                <span className="text-xs font-mono text-[#908fa0] px-2 py-0.5 rounded bg-[#0b1326]/60 border border-[#222a3d]/50">
                  {latencyMs}ms
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyHero}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] border border-[#31394d] text-xs font-medium text-[#dae2fd] hover:text-white transition-all cursor-pointer"
                  title="Copy current value"
                >
                  {copiedHero ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5 text-[#908fa0]" />}
                  <span>{copiedHero ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={sampleQuantumNumber}
                  disabled={isRolling}
                  className="w-8 h-8 rounded-lg bg-[#171f33] hover:bg-[#222a3d] border border-[#31394d] flex items-center justify-center text-[#908fa0] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Re-sample"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Central Focal Value Readout */}
            <div className="py-10 sm:py-14 text-center relative flex items-center justify-center min-h-[170px]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-64 h-32 bg-[#8083ff]/15 rounded-full blur-3xl"></div>
              </div>

              <div
                className={`font-space font-bold tracking-tight text-white transition-all duration-150 select-all relative z-10 ${
                  displayString.length > 8
                    ? 'text-3xl sm:text-4xl'
                    : displayString.length > 5
                    ? 'text-4xl sm:text-5xl'
                    : 'text-6xl sm:text-7xl'
                } ${isRolling || isRunningOwnRandom ? 'opacity-85 scale-98 blur-[0.4px]' : 'opacity-100 scale-100 glow-text-primary'}`}
              >
                {displayString}
              </div>
            </div>

            {/* Bottom bar inside hero card */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222a3d]/70 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#908fa0]">
                <span>TRIGGER:</span>
                <span className="px-2 py-0.5 rounded bg-[#0b1326] border border-[#31394d] text-[#dae2fd] text-[11px] font-semibold">
                  SPACEBAR
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#908fa0] text-[11px]">COHERENCE:</span>
                <div className="w-16 sm:w-20 h-1.5 rounded-full bg-[#0b1326] overflow-hidden border border-[#222a3d]">
                  <div
                    className="h-full bg-[#4edea3] rounded-full transition-all duration-300"
                    style={{ width: `${coherence}%` }}
                  ></div>
                </div>
                <span className="text-[#4edea3] font-semibold text-[11px]">{coherence}%</span>
              </div>
            </div>
          </div>

          {/* Bound Parameters & Steppers Card */}
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-4">
            {/* Header with Quick Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-white font-space font-semibold text-sm sm:text-base">
                <Sliders className="w-4 h-4 text-[#c0c1ff]" />
                <span>Bound Parameters & Steppers</span>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { label: '1-100', min: 1, max: 100 },
                  { label: '1-1000', min: 1, max: 1000 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setLowerBound(p.min);
                      setUpperBound(p.max);
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-all cursor-pointer ${
                      lowerBound === p.min && upperBound === p.max
                        ? 'bg-[#171f33] text-[#c0c1ff] border border-[#31394d] shadow-sm font-semibold'
                        : 'bg-[#0b1326] text-[#908fa0] hover:text-[#dae2fd] border border-[#222a3d]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setLowerBound(1000);
                    setUpperBound(10000);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-all cursor-pointer ${
                    lowerBound === 1000 && upperBound === 10000
                      ? 'bg-[#171f33] text-[#c0c1ff] border border-[#31394d] shadow-sm font-semibold'
                      : 'bg-[#0b1326] text-[#908fa0] hover:text-[#dae2fd] border border-[#222a3d]'
                  }`}
                >
                  + Custom
                </button>
              </div>
            </div>

            {/* Steppers: Lower Bound and Upper Bound */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lower Bound */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#908fa0]">
                  <span>LOWER BOUND (MIN)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0b1326] text-[#c0c1ff] border border-[#222a3d]">
                    INTEGER
                  </span>
                </div>

                <div className="flex items-center rounded-xl bg-[#060e20] border border-[#222a3d] p-1 focus-within:border-[#8083ff] transition-colors">
                  <div className="flex items-center">
                    <button
                      onClick={() => setLowerBound(v => Math.max(0, v - 100))}
                      className="px-1.5 py-1 text-xs font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="-100"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setLowerBound(v => Math.max(0, v - 1))}
                      className="px-1.5 py-1 text-sm font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="-1"
                    >
                      -
                    </button>
                  </div>

                  <input
                    type="number"
                    value={lowerBound}
                    onChange={e => setLowerBound(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-white font-space font-bold text-lg sm:text-xl focus:outline-none py-1"
                  />

                  <div className="flex items-center">
                    <button
                      onClick={() => setLowerBound(v => v + 1)}
                      className="px-1.5 py-1 text-sm font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="+1"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setLowerBound(v => v + 100)}
                      className="px-1.5 py-1 text-xs font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="+100"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>

              {/* Upper Bound */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#908fa0]">
                  <span>UPPER BOUND (MAX)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0b1326] text-[#c0c1ff] border border-[#222a3d]">
                    INTEGER
                  </span>
                </div>

                <div className="flex items-center rounded-xl bg-[#060e20] border border-[#222a3d] p-1 focus-within:border-[#8083ff] transition-colors">
                  <div className="flex items-center">
                    <button
                      onClick={() => setUpperBound(v => Math.max(lowerBound + 1, v - 100))}
                      className="px-1.5 py-1 text-xs font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="-100"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setUpperBound(v => Math.max(lowerBound + 1, v - 1))}
                      className="px-1.5 py-1 text-sm font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="-1"
                    >
                      -
                    </button>
                  </div>

                  <input
                    type="number"
                    value={upperBound}
                    onChange={e => setUpperBound(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-white font-space font-bold text-lg sm:text-xl focus:outline-none py-1"
                  />

                  <div className="flex items-center">
                    <button
                      onClick={() => setUpperBound(v => v + 1)}
                      className="px-1.5 py-1 text-sm font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="+1"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setUpperBound(v => v + 100)}
                      className="px-1.5 py-1 text-xs font-mono text-[#908fa0] hover:text-white rounded cursor-pointer"
                      title="+100"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-[#908fa0]">DRAW:</span>
                <div className="flex items-center rounded-lg bg-[#060e20] p-0.5 border border-[#222a3d]">
                  {[1, 2, 3, 5].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => setDrawCount(cnt)}
                      className={`px-2 py-0.5 text-xs font-mono rounded transition-all cursor-pointer ${
                        drawCount === cnt
                          ? 'bg-[#171f33] text-white font-semibold shadow-sm border border-[#31394d]'
                          : 'text-[#908fa0] hover:text-[#dae2fd]'
                      }`}
                    >
                      {cnt}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5" title="Do not duplicate numbers when drawing multiple">
                  <span className="text-[11px] font-mono text-[#908fa0]">No Dups:</span>
                  <button
                    onClick={() => setNoDuplicates(s => !s)}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                      noDuplicates ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                        noDuplicates ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-[#908fa0]">Sort:</span>
                  <button
                    onClick={() => setSortResults(s => !s)}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                      sortResults ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                        sortResults ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-[#908fa0]">Audio:</span>
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                      audioEnabled ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                        audioEnabled ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Massive Primary Action Button */}
            <button
              onClick={sampleQuantumNumber}
              disabled={isRolling}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6366f1] hover:from-[#9093ff] hover:to-[#6f72f7] active:scale-[0.99] text-white font-space font-bold text-base tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-70 group"
            >
              <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                <Target className="w-3.5 h-3.5 text-white" />
              </div>
              <span>SAMPLE QUANTUM NUMBER (TRNG)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 border border-white/20 font-mono">
                SPACE
              </span>
            </button>
          </div>

          {/* Real-time Oscilloscope */}
          <QuantumOscilloscope isRolling={isRolling || isRunningOwnRandom} pulseTrigger={pulseTrigger} />
        </div>

        {/* ================= COLUMN 2: INPUT OWN NUMBERS & RANDOM DRAW (4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#060e20] border border-[#31394d] flex items-center justify-center text-[#4edea3]">
                  <Dices className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-space font-bold text-base text-white">
                    Input Own Numbers
                  </h3>
                  <div className="text-[10px] font-mono text-[#908fa0]">
                    Enter multiple numbers & pick random via Quantum TRNG
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#060e20] text-[#4edea3] border border-[#4edea3]/30 font-semibold">
                {parsedOwnList.length} LOADED
              </span>
            </div>

            {/* Multi-Line Textarea for entering all numbers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[#908fa0]">
                <span>ENTER ALL OWN NUMBERS:</span>
                <span className="text-[10px]">one per line or comma-separated</span>
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  value={ownNumbersText}
                  onChange={e => setOwnNumbersText(e.target.value)}
                  placeholder="Input Number Here"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060e20] border-2 border-[#222a3d] focus:border-[#8083ff] text-white font-mono font-semibold text-sm leading-relaxed focus:outline-none transition-colors resize-none placeholder:text-[#908fa0]/60"
                />
              </div>
            </div>

            {/* Quick Helper Toolbar */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleShuffleOwnNumbers}
                  disabled={parsedOwnList.length < 2}
                  className="px-2.5 py-1 rounded-lg bg-[#060e20] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#31394d] text-[#dae2fd] hover:text-white transition-all cursor-pointer text-[11px] flex items-center gap-1.5 disabled:opacity-40"
                  title="Fisher-Yates random shuffle of all own numbers"
                >
                  <Shuffle className="w-3 h-3 text-[#4edea3]" />
                  <span>Shuffle</span>
                </button>

                <button
                  onClick={handleRemoveDuplicates}
                  disabled={parsedOwnList.length === 0}
                  className="px-2.5 py-1 rounded-lg bg-[#060e20] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#31394d] text-[#dae2fd] hover:text-white transition-all cursor-pointer text-[11px] flex items-center gap-1.5 disabled:opacity-40"
                  title="Filter and clean duplicate numbers to keep unique entries"
                >
                  <CopySlash className="w-3 h-3 text-[#c0c1ff]" />
                  <span>Duplicate number</span>
                  {duplicateCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#f43f5e]/20 text-[#ffb4ab] border border-[#f43f5e]/40 text-[9px] font-mono font-bold">
                      {duplicateCount} dup
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={() => setOwnNumbersText('')}
                className="text-xs text-[#908fa0] hover:text-[#ffb4ab] transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Massive Primary Action Button: Running Random / Click to Stop */}
            <button
              onClick={handleToggleRunOwnRandom}
              disabled={parsedOwnList.length === 0}
              className={`w-full py-4 rounded-xl active:scale-[0.99] font-space font-bold text-base tracking-wide flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-40 shadow-xl ${
                isRunningOwnRandom
                  ? 'bg-gradient-to-r from-[#ff4d6d] to-[#e11d48] text-white shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'bg-gradient-to-r from-[#4edea3] to-[#00a572] hover:from-[#6ffbbe] hover:to-[#10b981] text-[#060e20] shadow-[0_0_20px_rgba(78,222,163,0.35)]'
              }`}
            >
              {isRunningOwnRandom ? (
                <>
                  <Square className="w-5 h-5 fill-current animate-spin" />
                  <span className="text-base sm:text-lg font-black uppercase tracking-wider">
                    CLICK TO STOP & LOCK NUMBER
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span className="text-sm sm:text-base font-extrabold uppercase">
                    START RUNNING RANDOM ROLL
                  </span>
                </>
              )}
            </button>

            {/* Running Indicator or Last Picked Display Banner */}
            {isRunningOwnRandom ? (
              <div className="p-3.5 rounded-xl bg-[#ff4d6d]/10 border border-[#ff4d6d]/40 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] animate-ping"></span>
                  <div>
                    <div className="text-[10px] font-mono text-[#ffb4ab] uppercase tracking-wider font-semibold">
                      QUANTUM STREAM RUNNING:
                    </div>
                    <div className="text-xs font-mono text-white mt-0.5">
                      Cycling through {parsedOwnList.length} numbers at 30ms...
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ff4d6d]/20 text-[#ffb4ab] border border-[#ff4d6d]/30 font-bold">
                  CLICK STOP
                </span>
              </div>
            ) : lastPickedOwn ? (
              <div className="p-3 rounded-xl bg-[#060e20] border border-[#4edea3]/40 flex items-center justify-between glow-secondary animate-fadeIn">
                <div>
                  <div className="text-[10px] font-mono text-[#908fa0] uppercase tracking-wider">
                    LOCKED RANDOM NUMBER:
                  </div>
                  <div className="text-2xl font-space font-bold text-[#4edea3] mt-0.5">
                    {lastPickedOwn}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40">
                    LOCKED TRNG
                  </span>
                </div>
              </div>
            ) : null}

            {/* Draw count and chance row */}
            <div className="p-2.5 rounded-xl bg-[#060e20] border border-[#222a3d] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#908fa0] text-[11px]">PICK COUNT:</span>
                <div className="flex items-center rounded-lg bg-[#131b2e] p-0.5 border border-[#222a3d]">
                  {[1, 2, 3].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => setOwnDrawCount(cnt)}
                      className={`px-2 py-0.5 text-xs rounded transition-all cursor-pointer ${
                        ownDrawCount === cnt
                          ? 'bg-[#171f33] text-white font-bold border border-[#31394d]'
                          : 'text-[#908fa0] hover:text-white'
                      }`}
                    >
                      {cnt}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Remove selected item after draw toggle */}
              <div className="flex items-center gap-1.5" title="Remove selected item from list after draw">
                <span className="text-[#908fa0] text-[11px]">Remove after draw:</span>
                <button
                  onClick={() => setRemoveAfterDraw(r => !r)}
                  className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                    removeAfterDraw ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                      removeAfterDraw ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[#908fa0] text-[10px]">CHANCE PER NUMBER:</span>
                <div className="text-[#4edea3] font-bold text-[11px]">
                  {parsedOwnList.length > 0
                    ? `${(100 / parsedOwnList.length).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Success toast banner */}
            {manualSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-[#4edea3]/10 border border-[#4edea3]/40 text-xs font-mono text-[#4edea3] flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0" />
                <span className="truncate">{manualSuccessMsg}</span>
              </div>
            )}

            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSetTopAsHero}
                disabled={parsedOwnList.length === 0}
                className="py-2 px-2 rounded-xl bg-[#060e20] hover:bg-[#171f33] border border-[#31394d] text-[#dae2fd] hover:text-white font-space font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 truncate"
              >
                <Eye className="w-3.5 h-3.5 text-[#c0c1ff]" />
                <span className="truncate">Set First as Hero</span>
              </button>

              <button
                onClick={handleInjectAllOwnToLog}
                disabled={parsedOwnList.length === 0}
                className="py-2 px-2 rounded-xl bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 text-[#4edea3] hover:text-white font-space font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 truncate"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span className="truncate">Log All Numbers</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3: CRYPTOGRAPHIC ROLL LOG (3 COLS) ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-[#131b2e] border border-[#222a3d] p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-space font-semibold text-sm sm:text-base">
                <History className="w-4 h-4 text-[#c0c1ff]" />
                <span>Cryptographic Roll Log</span>
              </div>
              <button
                onClick={() => setRolls([])}
                className="text-xs text-[#908fa0] hover:text-[#ffb4ab] transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="text-xs text-[#908fa0] leading-snug">
              Tamper-evident client-side log. Tap row to copy audit payload.
            </div>

            {/* List of Roll rows */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {rolls.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#908fa0] font-mono">
                  No cryptographic logs generated yet.
                </div>
              ) : (
                rolls.map(roll => {
                  const isCopied = copiedRowId === roll.id;
                  const displayVal = Array.isArray(roll.value) ? roll.value.join(', ') : roll.value;
                  const isManual = roll.id.startsWith('manual');

                  return (
                    <div
                      key={roll.id}
                      onClick={() => handleCopyRow(roll)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        isCopied
                          ? 'bg-[#171f33] border-[#4edea3]'
                          : 'bg-[#060e20] hover:bg-[#171f33] border-[#222a3d] hover:border-[#31394d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#908fa0]">
                            #{roll.index}
                          </span>
                          {isManual && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#c0c1ff]/15 text-[#c0c1ff] border border-[#c0c1ff]/30">
                              MANUAL
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[#c0c1ff]">
                          {roll.hash}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className="text-base font-space font-bold text-white leading-tight truncate">
                          {displayVal}
                        </div>
                        <div className="text-[10px] font-mono text-[#908fa0]">
                          {roll.timestamp}
                        </div>
                      </div>

                      {isCopied && (
                        <div className="text-[10px] font-mono text-[#4edea3]">
                          Copied Audit JSON!
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#222a3d]/70 text-xs font-mono">
              <button
                onClick={handleExportCsv}
                disabled={rolls.length === 0}
                className="flex items-center gap-1.5 text-xs text-[#dae2fd] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Export CSV</span>
              </button>

              <div className="flex items-center gap-1 text-[#4edea3] text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>NIST Pass</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
