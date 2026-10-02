import React from 'react';

interface FooterProps {
  onOpenDiagnostics: () => void;
  onOpenAudit: () => void;
  onOpenConfig: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDiagnostics,
  onOpenAudit,
  onOpenConfig,
}) => {
  return (
    <footer className="border-t border-[#222a3d] bg-[#0b1326] px-3 sm:px-6 py-4 mt-8">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#908fa0]">
        <div className="flex items-center gap-2">
          <span>© 2025 Random Num.PL</span>
          <span className="text-[#31394d]">•</span>
          <span className="text-[#c0c1ff]">PRNG-ALGO: NIST SP 800-90A</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <button
            onClick={onOpenDiagnostics}
            className="hover:text-[#dae2fd] transition-colors cursor-pointer"
          >
            Entropy Diagnostics
          </button>
          <button
            onClick={onOpenAudit}
            className="hover:text-[#dae2fd] transition-colors cursor-pointer"
          >
            Cryptographic Audit Log
          </button>
          <button
            onClick={onOpenConfig}
            className="hover:text-[#dae2fd] transition-colors cursor-pointer"
          >
            Precision Config
          </button>
        </div>
      </div>
    </footer>
  );
};
