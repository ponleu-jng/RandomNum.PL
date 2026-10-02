/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { SubHeader } from './components/SubHeader';
import { NumberGeneratorScreen } from './components/NumberGeneratorScreen';
import { ImportPoolScreen } from './components/ImportPoolScreen';
import { DiceRollerScreen } from './components/DiceRollerScreen';
import { CoinFlipScreen } from './components/CoinFlipScreen';
import { ListShufflerScreen } from './components/ListShufflerScreen';
import { CardPickerScreen } from './components/CardPickerScreen';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { PrecisionConfigModal } from './components/PrecisionConfigModal';
import { AuditModal } from './components/AuditModal';
import { Footer } from './components/Footer';
import { RollEntry } from './utils/quantumRng';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('number');
  const [subMode, setSubMode] = useState<'range' | 'pool'>('range');

  // Trigger counter for spacebar / button trigger
  const [triggerCount, setTriggerCount] = useState<number>(0);

  // Settings
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [spaceTriggerEnabled, setSpaceTriggerEnabled] = useState<boolean>(true);
  const [numberFormat, setNumberFormat] = useState<'int' | 'float' | 'hex' | 'binary'>('int');

  // Modals
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [selectedAuditRoll, setSelectedAuditRoll] = useState<RollEntry | null>(null);

  // Global keyboard listener for Space / Enter fast re-roll trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!spaceTriggerEnabled) return;

      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setTriggerCount(prev => prev + 1);
      } else if (e.code === 'Enter') {
        e.preventDefault();
        setTriggerCount(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spaceTriggerEnabled]);

  const handleTriggerRoll = () => {
    setTriggerCount(prev => prev + 1);
  };

  const handleOpenAuditForRoll = (roll: RollEntry) => {
    setSelectedAuditRoll(roll);
    setIsAuditOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans selection:bg-[#4edea3]/30 selection:text-white">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerRoll={handleTriggerRoll}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenAudit={() => setIsDiagnosticsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'number' && (
          <>
            <SubHeader
              subMode={subMode}
              setSubMode={setSubMode}
              onOpenNistInfo={() => setIsDiagnosticsOpen(true)}
            />
            {subMode === 'range' ? (
              <NumberGeneratorScreen
                triggerCount={triggerCount}
                audioEnabled={audioEnabled}
                setAudioEnabled={setAudioEnabled}
                numberFormat={numberFormat}
                onSelectAuditRoll={handleOpenAuditForRoll}
              />
            ) : (
              <ImportPoolScreen audioEnabled={audioEnabled} />
            )}
          </>
        )}

        {activeTab === 'dice' && <DiceRollerScreen audioEnabled={audioEnabled} />}
        {activeTab === 'coin' && <CoinFlipScreen audioEnabled={audioEnabled} />}
        {activeTab === 'list' && <ListShufflerScreen audioEnabled={audioEnabled} />}
        {activeTab === 'cards' && <CardPickerScreen audioEnabled={audioEnabled} />}
      </main>

      {/* Footer matching screenshot */}
      <Footer
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenAudit={() => {
          setSelectedAuditRoll(null);
          setIsAuditOpen(true);
        }}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Modals */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <PrecisionConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        numberFormat={numberFormat}
        setNumberFormat={setNumberFormat}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        spaceTriggerEnabled={spaceTriggerEnabled}
        setSpaceTriggerEnabled={setSpaceTriggerEnabled}
      />

      <AuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        selectedRoll={selectedAuditRoll}
      />
    </div>
  );
}
