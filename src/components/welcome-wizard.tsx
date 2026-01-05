"use client";

import React, { useState } from 'react';
import { BabyIcon } from './ui/icons';

interface WelcomeWizardProps {
  onComplete: (_babyName: string, _birthdate?: string) => void;
}

export default function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [babyName, setBabyName] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const handleNext = () => {
    if (step === 1 && babyName.trim()) {
      setStep(2);
    }
  };

  const handleComplete = () => {
    if (babyName.trim()) {
      onComplete(babyName.trim(), birthdate || undefined);
    }
  };

  const handleSkipBirthdate = () => {
    if (babyName.trim()) {
      onComplete(babyName.trim(), undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-5">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-slate-800 text-accent shadow-card mb-4">
            <BabyIcon className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Pipr</h1>
          <p className="text-slate-400 text-sm">Let&apos;s get started tracking your baby&apos;s feeds</p>
        </div>

        {step === 1 && (
          <div className="card p-6 bg-slate-800/80 text-slate-50">
            <label className="block mb-2 text-sm font-semibold">What&apos;s your baby&apos;s name?</label>
            <input
              type="text"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="Enter baby's name"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 focus:border-accent focus:outline-none text-slate-50 placeholder:text-slate-500"
              autoFocus
              maxLength={80}
            />
            <button
              onClick={handleNext}
              disabled={!babyName.trim()}
              className="w-full mt-4 px-4 py-3 rounded-xl bg-accent text-slate-900 font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card p-6 bg-slate-800/80 text-slate-50">
            <label className="block mb-2 text-sm font-semibold">When was {babyName} born?</label>
            <p className="text-xs text-slate-400 mb-3">(Optional - helps track milestones)</p>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 focus:border-accent focus:outline-none text-slate-50"
              max={new Date().toISOString().split('T')[0]}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSkipBirthdate}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-slate-50 font-semibold hover:bg-slate-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-3 rounded-xl bg-accent text-slate-900 font-semibold hover:bg-accent/90 transition-colors"
              >
                Start Tracking
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-accent' : 'bg-slate-700'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-accent' : 'bg-slate-700'}`} />
        </div>
      </div>
    </div>
  );
}
