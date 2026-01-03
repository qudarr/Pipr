"use client";

import React, { useState } from 'react';
import { SettingsIcon, SunIcon, MoonIcon, BabyIcon, CheckIcon } from '@/components/ui/icons';
import { useTheme } from '@/providers/theme-provider';

export default function SettingsPage() {
  const { theme, setTheme, resolved } = useTheme();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyStatus, setBabyStatus] = useState('');

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus('');
    const res = await fetch('/api/family/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail })
    });
    const data = await res.json();
    if (res.ok) {
      setInviteStatus(`Invite ready. Token: ${data.token ?? 'already-sent'}`);
      setInviteEmail('');
    } else {
      setInviteStatus(data.error || 'Failed');
    }
  };

  const addBaby = async (e: React.FormEvent) => {
    e.preventDefault();
    setBabyStatus('');
    const res = await fetch('/api/babies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: babyName })
    });
    const data = await res.json();
    if (res.ok) {
      setBabyStatus('Added');
      setBabyName('');
    } else {
      setBabyStatus(data.error || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-5 pb-24 max-w-md mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <span className="p-2 rounded-xl bg-slate-800 text-accent"><SettingsIcon className="w-5 h-5" /></span>
        <div>
          <p className="text-xs text-slate-400">Preferences</p>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <section className="card p-4 bg-slate-800/70 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Theme</p>
            <p className="text-xs text-slate-400">System / Light / Dark</p>
          </div>
          <span className="p-2 rounded-xl bg-slate-900/50 text-accent">
            {resolved === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </span>
        </div>
        <div className="flex gap-2">
          {['system', 'light', 'dark'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t as any)}
              className={`flex-1 rounded-full border px-3 py-2 capitalize ${
                theme === t ? 'border-accent text-accent bg-slate-900/50' : 'border-slate-700 bg-slate-900/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4 bg-slate-800/70 space-y-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-slate-900/50 text-accent"><BabyIcon className="w-5 h-5" /></span>
          <div>
            <p className="font-semibold">Baby</p>
            <p className="text-xs text-slate-400">Add a baby to start tracking</p>
          </div>
        </div>
        <form onSubmit={addBaby} className="space-y-2">
          <input
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            placeholder="Baby name"
            className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-50"
            required
          />
          <button type="submit" className="w-full rounded-full bg-accent text-slate-900 font-semibold py-2">
            Save baby
          </button>
          {babyStatus && <p className="text-xs text-slate-300">{babyStatus}</p>}
        </form>
      </section>

      <section className="card p-4 bg-slate-800/70 space-y-3">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-slate-900/50 text-accent"><CheckIcon className="w-5 h-5" /></span>
          <div>
            <p className="font-semibold">Partner invite</p>
            <p className="text-xs text-slate-400">Email-based matching only</p>
          </div>
        </div>
        <form onSubmit={sendInvite} className="space-y-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="partner@email.com"
            className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-50"
            required
          />
          <button type="submit" className="w-full rounded-full bg-accent text-slate-900 font-semibold py-2">
            Send invite
          </button>
          {inviteStatus && <p className="text-xs text-slate-300">{inviteStatus}</p>}
        </form>
      </section>

      <section className="card p-4 bg-slate-900/60 border border-dashed border-slate-700 text-slate-400">
        Growth (Coming soon)
      </section>
    </div>
  );
}
