import React from 'react';
import { X, SlidersHorizontal, Volume2, ShieldCheck, Cpu } from 'lucide-react';

interface PrecisionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  numberFormat: 'int' | 'float' | 'hex' | 'binary';
  setNumberFormat: (format: 'int' | 'float' | 'hex' | 'binary') => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  spaceTriggerEnabled: boolean;
  setSpaceTriggerEnabled: (val: boolean) => void;
}

export const PrecisionConfigModal: React.FC<PrecisionConfigModalProps> = ({
  isOpen,
  onClose,
  numberFormat,
  setNumberFormat,
  audioEnabled,
  setAudioEnabled,
  spaceTriggerEnabled,
  setSpaceTriggerEnabled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060e20]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#131b2e] border border-[#31394d] shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222a3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#060e20] border border-[#222a3d] flex items-center justify-center text-[#c0c1ff]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-space font-bold text-base sm:text-lg text-white">
                Precision & Telemetry Configuration
              </h3>
              <p className="text-xs font-mono text-[#908fa0]">
                Hardware parameters & algorithmic options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#171f33] hover:bg-[#222a3d] flex items-center justify-center text-[#908fa0] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Number Format Mode */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-[#908fa0] block">
            NUMERIC QUANTUM REPRESENTATION
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'int', label: 'Uniform Integer', desc: 'Standard discrete bounds [min, max]' },
              { id: 'float', label: 'Floating Precision', desc: 'Continuous 53-bit IEEE float' },
              { id: 'hex', label: 'Hexadecimal (0x)', desc: 'Direct byte hexadecimal representation' },
              { id: 'binary', label: 'Raw Binary (0b)', desc: 'Bitwise photonic stream' },
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setNumberFormat(fmt.id as 'int' | 'float' | 'hex' | 'binary')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  numberFormat === fmt.id
                    ? 'bg-[#171f33] border-[#8083ff] text-white shadow-sm'
                    : 'bg-[#060e20] border-[#222a3d] text-[#908fa0] hover:text-white'
                }`}
              >
                <div className="font-space font-bold text-xs">{fmt.label}</div>
                <div className="text-[10px] text-[#908fa0] mt-0.5">{fmt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-[#222a3d] text-xs font-mono">
          {/* Audio Tone */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#060e20] border border-[#222a3d]">
            <div>
              <div className="font-medium text-white">Synthesized Audio Feedback</div>
              <div className="text-[10px] text-[#908fa0]">Web Audio API optical click and resonant chime</div>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                audioEnabled ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  audioEnabled ? 'left-4.5' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Spacebar Trigger */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#060e20] border border-[#222a3d]">
            <div>
              <div className="font-medium text-white">Global Spacebar Trigger</div>
              <div className="text-[10px] text-[#908fa0]">Press SPACEBAR anywhere to sample quantum state</div>
            </div>
            <button
              onClick={() => setSpaceTriggerEnabled(!spaceTriggerEnabled)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                spaceTriggerEnabled ? 'bg-[#4edea3]' : 'bg-[#222a3d]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  spaceTriggerEnabled ? 'left-4.5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Apply & Save */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#6366f1] text-xs font-space font-bold text-white shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
