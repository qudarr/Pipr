'use client';

import React, { useState, useEffect } from 'react';
import { useBabies } from '@/lib/hooks';

type BottleType = 'Formula' | 'Breastmilk';

type BottleFormProps = {
  onComplete?: () => void;
  defaultBabyId?: string;
};

const QUICK_AMOUNTS = [30, 60, 90, 120, 150, 180];

// Get saved bottle amount from localStorage
const getSavedAmount = () => {
  if (typeof window === 'undefined') return 90;
  const saved = localStorage.getItem('lastBottleAmount');
  return saved ? parseInt(saved, 10) : 90;
};

export default function BottleForm({
  onComplete,
  defaultBabyId
}: BottleFormProps) {
  const { babies, loading: babiesLoading } = useBabies();
  const [selectedBabyId, setSelectedBabyId] = useState<string>(
    defaultBabyId || ''
  );
  const [amountMl, setAmountMl] = useState<number>(getSavedAmount());
  const [bottleType, setBottleType] = useState<BottleType>('Formula');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default baby when babies load
  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0].id);
    }
  }, [babies, selectedBabyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBabyId || amountMl <= 0) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bottle',
          babyId: selectedBabyId,
          occurredAt: new Date().toISOString(),
          amountMl,
          bottleType,
          notes: notes.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      // Save the amount to localStorage for next time
      localStorage.setItem('lastBottleAmount', amountMl.toString());

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setNotes('');
        onComplete?.();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save feed');
    } finally {
      setSaving(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="card p-6 bg-gradient-to-br from-sky-500 to-teal-500 shadow-xl text-center">
        <div className="text-5xl mb-3">🍼</div>
        <p className="text-xl font-bold text-white">Bottle logged!</p>
        <p className="text-white/80">
          {amountMl} ml of {bottleType}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-6 bg-white dark:bg-slate-800 shadow-xl"
    >
      {/* Baby selector */}
      {babies.length > 1 && (
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
            Baby
          </label>
          <select
            value={selectedBabyId}
            onChange={(e) => setSelectedBabyId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-0 font-semibold"
          >
            {babies.map((baby) => (
              <option key={baby.id} value={baby.id}>
                {baby.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          🍼 Bottle Feed
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Quick add a bottle
        </p>
      </div>

      {/* Bottle type */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
          Type
        </label>
        <div className="flex gap-2">
          {(['Formula', 'Breastmilk'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setBottleType(type)}
              className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                bottleType === type
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {type === 'Breastmilk' ? 'Breast Milk' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Quick amounts */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
          Amount (ml)
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmountMl(amt)}
              className={`py-2 rounded-xl font-semibold transition-all ${
                amountMl === amt
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAmountMl(Math.max(10, amountMl - 10))}
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-2xl hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            −
          </button>
          <input
            type="number"
            value={amountMl}
            onChange={(e) =>
              setAmountMl(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="flex-1 text-center text-3xl font-bold bg-slate-100 dark:bg-slate-700 rounded-xl py-2 text-slate-900 dark:text-white border-0"
            min={0}
            max={500}
          />
          <button
            type="button"
            onClick={() => setAmountMl(Math.min(500, amountMl + 10))}
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-2xl hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
          className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-0"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || babiesLoading || !selectedBabyId || amountMl <= 0}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {babiesLoading
          ? 'Loading...'
          : saving
            ? 'Saving...'
            : `Log ${amountMl} ml`}
      </button>
    </form>
  );
}
