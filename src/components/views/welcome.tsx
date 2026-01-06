'use client';

import React, { useState } from 'react';
import { BabyIcon, HeartIcon, SparklesIcon } from '@/components/ui/icons';

export default function WelcomeWorkflow() {
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyBirthdate, setBabyBirthdate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/family/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: familyName || 'My Family',
          babyName: babyName || undefined,
          babyBirthdate: babyBirthdate || undefined
        })
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        console.error('Bootstrap failed:', data);

        let errorMessage = 'Failed to setup';
        if (data.error === 'unauthenticated') {
          errorMessage =
            '⚠️ Authentication not configured. Please set up DEV_AUTH_BYPASS=true in .env.local for development, or configure Azure App Service authentication for production.';
        } else if (data.error) {
          errorMessage = `Error: ${data.error}`;
        }

        alert(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error - please check the console for details');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen baby-gradient-light dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center p-5">
      <div className="max-w-md w-full">
        {step === 1 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-6 rounded-full baby-gradient shadow-2xl">
                <BabyIcon className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Welcome to Pipr!
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              Track feedings, sleep, and precious moments with your little one.
              Let's get started! ✨
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl baby-gradient text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card p-8 space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-baby-pink/20 dark:bg-baby-pink/10 mb-4">
                <HeartIcon className="w-10 h-10 text-baby-pink" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Create Your Family Space
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Optional: Give your family space a name
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(3);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Family Name (Optional)
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smiths"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-baby-pink dark:focus:border-baby-pink focus:ring-2 focus:ring-baby-pink/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-baby-pink hover:bg-baby-pink/90 text-white font-bold text-lg shadow-lg transition-all"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="card p-8 space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-baby-blue/20 dark:bg-baby-blue/10 mb-4">
                <BabyIcon className="w-10 h-10 text-baby-blue" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Add Your Baby
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                You can add more babies later in settings
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Baby's Name (Optional)
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Emma"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-baby-blue dark:focus:border-baby-blue focus:ring-2 focus:ring-baby-blue/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Birthday (Optional)
                </label>
                <input
                  type="date"
                  value={babyBirthdate}
                  onChange={(e) => setBabyBirthdate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-baby-blue dark:focus:border-baby-blue focus:ring-2 focus:ring-baby-blue/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl baby-gradient text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Complete Setup ✨'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-full py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
