'use client';

import React, { useState } from 'react';
import { useBabies } from '@/lib/hooks';
import { NappyIcon, CheckIcon } from './ui/icons';

type NappyType = 'wet' | 'dirty' | 'both';

interface NappyFormProps {
  onComplete: () => void;
}

export default function NappyForm({ onComplete }: NappyFormProps) {
  const { babies } = useBabies();
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [type, setType] = useState<NappyType>('wet');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const babyId = selectedBabyId || babies[0]?.id;

  const handleSave = async () => {
    if (!babyId) return;
    setSaving(true);

    try {
      const res = await fetch('/api/nappies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          type,
          notes: notes || undefined
        })
      });

      if (res.ok) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to save nappy:', err);
    } finally {
      setSaving(false);
    }
  };

  const typeOptions: { value: NappyType; label: string; emoji: string }[] = [
    { value: 'wet', label: 'Wet', emoji: '💧' },
    { value: 'dirty', label: 'Dirty', emoji: '💩' },
    { value: 'both', label: 'Both', emoji: '💧💩' }
  ];

  return (
    <div className="card p-6 shadow-2xl bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
          <NappyIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Log Nappy Change
        </h2>
      </div>

      {/* Baby selector (if multiple) */}
      {babies.length > 1 && (
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Baby
          </label>
          <select
            value={babyId}
            onChange={(e) => setSelectedBabyId(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            {babies.map((baby) => (
              <option key={baby.id} value={baby.id}>
                {baby.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Type selector */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                type === option.value
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-amber-300'
              }`}
            >
              <span className="text-2xl block mb-1">{option.emoji}</span>
              <span
                className={`text-sm font-semibold ${
                  type === option.value
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations..."
          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
          rows={2}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !babyId}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          <>
            <CheckIcon className="w-5 h-5" />
            Save Nappy Change
          </>
        )}
      </button>
    </div>
  );
}
