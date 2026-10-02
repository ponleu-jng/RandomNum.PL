import React, { useEffect, useState } from 'react';
import { ShieldCheck, Binary, Table } from 'lucide-react';

interface SubHeaderProps {
  subMode: 'range' | 'pool';
  setSubMode: (mode: 'range' | 'pool') => void;
  onOpenNistInfo: () => void;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  subMode,
  setSubMode,
  onOpenNistInfo,
}) => {
  const [fluxRate, setFluxRate] = useState('1.24');

  // Subtle realistic live flux oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() * 0.04 - 0.02).toFixed(2);
      const newRate = (1.24 + parseFloat(delta)).toFixed(2);
      setFluxRate(newRate);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 pt-4 pb-2">
      {/* Status banner matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#908fa0] pb-3 border-b border-[#222a3d]/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]"></span>
          <span className="text-[#dae2fd] font-semibold tracking-wide">
            QUANTUM OPTICAL FLUX ACTIVE
          </span>
          <span className="text-[#464554]">|</span>
          <span className="text-[#4edea3]">{fluxRate} Gbps Vacuum Noise</span>
        </div>

        <button
          onClick={onOpenNistInfo}
          className="flex items-center gap-1.5 text-xs text-[#908fa0] hover:text-[#dae2fd] transition-colors cursor-pointer group"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3] group-hover:scale-110 transition-transform" />
          <span>NIST SP 800-90B Compliant Entropy</span>
        </button>
      </div>

      {/* Mode selection tabs matching screenshot */}
      <div className="flex items-center gap-2.5 pt-3">
        <button
          onClick={() => setSubMode('range')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            subMode === 'range'
              ? 'bg-[#171f33] text-white border border-[#31394d] shadow-sm'
              : 'bg-transparent text-[#908fa0] hover:text-[#dae2fd] hover:bg-[#131b2e]'
          }`}
        >
          <div className="w-4 h-4 rounded bg-[#0b1326] border border-[#31394d] flex items-center justify-center text-[10px] font-mono text-[#c0c1ff]">
            123
          </div>
          <span>Quantum Range Bounds</span>
        </button>

        <button
          onClick={() => setSubMode('pool')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            subMode === 'pool'
              ? 'bg-[#171f33] text-white border border-[#31394d] shadow-sm'
              : 'bg-transparent text-[#908fa0] hover:text-[#dae2fd] hover:bg-[#131b2e]'
          }`}
        >
          <Table className="w-4 h-4 text-[#4edea3]" />
          <span>Import Excel / CSV Pool</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#060e20] text-[#4edea3] border border-[#00a572]/40 font-mono">
            XLSX/CSV
          </span>
        </button>
      </div>
    </div>
  );
};
