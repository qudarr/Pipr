'use client';

import React, { useEffect, useState } from 'react';
import { BottleIcon } from '@/components/ui/icons';

export default function AddBottlePage() {
  const [babies, setBabies] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    amountMl: 120,
    bottleType: 'Formula',
    babyId: '',
    notes: '',
    occurredAt: ''
  });
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    fetch('/api/babies')
      .then((res) => res.json())
      .then((data) => {
        setBabies(data.babies ?? []);
        if (data.babies?.[0]) {
          setForm((f) => ({ ...f, babyId: data.babies[0].id }));
        }
      })
      .catch(() => setBabies([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    const res = await fetch('/api/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'bottle',
        babyId: form.babyId,
        occurredAt: form.occurredAt || undefined,
        amountMl: Number(form.amountMl),
        bottleType: form.bottleType,
        notes: form.notes || undefined
      })
    });
    if (res.ok) {
      setStatus('Saved');
    } else {
      const data = await res.json();
      setStatus(data.error || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 p-5 pb-24 max-w-md mx-auto">
      <header className="flex items-center gap-3 mb-4">
        <span className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-accent">
          <BottleIcon className="w-5 h-5" />
        </span>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bottle</p>
          <h1 className="text-lg font-semibold">Add Bottle Feed</h1>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <div className="card p-4 space-y-3">
          <label className="flex flex-col text-sm gap-1">
            <span className="text-slate-600 dark:text-slate-300">
              Amount (mL)
            </span>
            <input
              type="number"
              value={form.amountMl}
              onChange={(e) =>
                setForm({ ...form, amountMl: Number(e.target.value) })
              }
              className="rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50"
              required
            />
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="text-slate-600 dark:text-slate-300">
              Bottle type
            </span>
            <select
              value={form.bottleType}
              onChange={(e) => setForm({ ...form, bottleType: e.target.value })}
              className="rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="Formula">Formula</option>
              <option value="Breastmilk">Breastmilk</option>
            </select>
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="text-slate-600 dark:text-slate-300">Baby</span>
            <select
              value={form.babyId}
              onChange={(e) => setForm({ ...form, babyId: e.target.value })}
              className="rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              {babies.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {babies.length === 0 && (
              <p className="text-xs text-amber-500 dark:text-amber-400">
                Add a baby first in Settings.
              </p>
            )}
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="text-slate-600 dark:text-slate-300">Time</span>
            <input
              type="datetime-local"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              className="rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="text-slate-600 dark:text-slate-300">
              Notes (optional)
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50"
              rows={3}
              placeholder="Add a note"
            />
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-accent text-slate-900 font-semibold py-3 shadow-card"
          disabled={!form.babyId || !form.amountMl}
        >
          Save Bottle Feed
        </button>
        {status && (
          <p className="text-sm text-center text-slate-600 dark:text-slate-300">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}
