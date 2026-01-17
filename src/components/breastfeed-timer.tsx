'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBabies, createFeed } from '@/lib/hooks';

type Side = 'Left' | 'Right';

type BreastfeedTimerProps = {
  onComplete?: () => void;
  autoSwitchMinutes?: number;
  autoStopMinutes?: number;
};

const SUCCESS_DISPLAY_DURATION_MS = 2000;

export default function BreastfeedTimer({
  onComplete,
  autoSwitchMinutes = 20,
  autoStopMinutes = 20
}: BreastfeedTimerProps) {
  const { babies, loading: babiesLoading } = useBabies();
  const [selectedBabyId, setSelectedBabyId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentSide, setCurrentSide] = useState<Side>('Left');
  const [firstSide, setFirstSide] = useState<Side>('Left');
  const [firstSideTime, setFirstSideTime] = useState(0);
  const [secondSideTime, setSecondSideTime] = useState(0);
  const [autoSwitchUsed, setAutoSwitchUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set default baby when babies load
  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0].id);
    }
  }, [babies, selectedBabyId]);

  const currentTime =
    currentSide === firstSide ? firstSideTime : secondSideTime;
  const totalTime = firstSideTime + secondSideTime;
  const isSecondSide = currentSide !== firstSide;

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (currentSide === firstSide) {
          setFirstSideTime((t) => t + 1);
        } else {
          setSecondSideTime((t) => t + 1);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentSide, firstSide]);

  const handleStart = () => {
    if (!selectedBabyId) return;
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleSwitch = useCallback((auto = false) => {
    setCurrentSide((curr) => (curr === 'Left' ? 'Right' : 'Left'));
    if (auto) setAutoSwitchUsed(true);
  }, []);

  const handleStop = useCallback(
    async (autoTriggered = false) => {
      setIsRunning(false);

      if (totalTime < 5) return; // Don't save if less than 5 seconds

      setSaving(true);
      try {
        // Use optimistic update - saves immediately to cache and syncs in background
        await createFeed({
          type: 'breast',
          babyId: selectedBabyId,
          occurredAt: startTime?.toISOString(),
          firstSide,
          firstDurationSec: firstSideTime,
          secondDurationSec: secondSideTime > 0 ? secondSideTime : undefined,
          totalDurationSec: firstSideTime + secondSideTime,
          autoSwitchUsed,
          autoStopUsed: autoTriggered,
          feedType: 'Breast' // For UI display
        });

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          handleReset();
          onComplete?.();
        }, SUCCESS_DISPLAY_DURATION_MS);
      } catch (e) {
        console.error('Failed to save feed', e);
      } finally {
        setSaving(false);
      }
    },
    [
      totalTime,
      selectedBabyId,
      startTime,
      firstSide,
      firstSideTime,
      secondSideTime,
      autoSwitchUsed,
      onComplete
    ]
  );

  // Auto-switch logic
  useEffect(() => {
    if (isRunning && !isSecondSide && firstSideTime >= autoSwitchMinutes * 60) {
      handleSwitch(true);
    }
  }, [firstSideTime, isRunning, isSecondSide, autoSwitchMinutes, handleSwitch]);

  // Auto-stop logic
  useEffect(() => {
    if (isRunning && isSecondSide && secondSideTime >= autoStopMinutes * 60) {
      handleStop(true);
    }
  }, [secondSideTime, isRunning, isSecondSide, autoStopMinutes, handleStop]);

  const handleReset = () => {
    setIsRunning(false);
    setFirstSideTime(0);
    setSecondSideTime(0);
    setCurrentSide('Left');
    setFirstSide('Left');
    setAutoSwitchUsed(false);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (showSuccess) {
    return (
      <div className="card p-6 baby-gradient shadow-xl text-center">
        <div className="text-5xl mb-3">✨</div>
        <p className="text-xl font-bold text-white">Feed saved!</p>
        <p className="text-white/80">Total: {formatTime(totalTime)}</p>
      </div>
    );
  }

  const hasStarted = firstSideTime > 0 || secondSideTime > 0;

  return (
    <div className="card p-6 baby-gradient shadow-xl">
      {/* Baby selector */}
      {babies.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedBabyId}
            onChange={(e) => setSelectedBabyId(e.target.value)}
            disabled={hasStarted}
            className="w-full px-3 py-2 rounded-xl bg-white/20 text-white border-0 font-semibold"
          >
            {babies.map((baby) => (
              <option key={baby.id} value={baby.id} className="text-slate-900">
                {baby.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-base font-bold text-white">Breastfeed</p>
          <p className="text-sm text-white/80">{currentSide} Side</p>
        </div>

        {/* Side toggle */}
        <button
          onClick={() => {
            if (!hasStarted) {
              setFirstSide(firstSide === 'Left' ? 'Right' : 'Left');
              setCurrentSide(firstSide === 'Left' ? 'Right' : 'Left');
            } else if (!isRunning || isSecondSide) {
              // Allow manual switch
              handleSwitch();
            }
          }}
          disabled={isRunning && !isSecondSide}
          className="w-16 h-8 bg-white/30 rounded-full relative backdrop-blur-sm transition-all"
        >
          <div
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              currentSide === 'Right' ? 'right-1' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Timer display */}
      <div className="text-5xl font-bold tracking-tight text-white mb-2 font-mono">
        {formatTime(currentTime)}
      </div>

      {/* Side times */}
      {hasStarted && (
        <div className="flex gap-4 mb-3 text-sm">
          <div
            className={`px-3 py-1 rounded-full ${currentSide === 'Left' ? 'bg-white/30' : 'bg-white/10'}`}
          >
            <span className="text-white/80">L: </span>
            <span className="text-white font-semibold">
              {formatTime(
                firstSide === 'Left' ? firstSideTime : secondSideTime
              )}
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full ${currentSide === 'Right' ? 'bg-white/30' : 'bg-white/10'}`}
          >
            <span className="text-white/80">R: </span>
            <span className="text-white font-semibold">
              {formatTime(
                firstSide === 'Right' ? firstSideTime : secondSideTime
              )}
            </span>
          </div>
        </div>
      )}

      {/* Auto settings info */}
      <div className="text-sm text-white/90 mb-4">
        <p>Auto-switch at {autoSwitchMinutes} min</p>
        <p>Auto-stop second side at {autoStopMinutes} min</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!hasStarted ? (
          <button
            onClick={handleStart}
            disabled={babiesLoading || !selectedBabyId}
            className="flex-1 py-3 rounded-2xl bg-white text-pink-600 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {babiesLoading ? 'Loading...' : 'Start'}
          </button>
        ) : (
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 py-3 rounded-2xl bg-white/20 text-white font-bold"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex-1 py-3 rounded-2xl bg-white/20 text-white font-bold"
              >
                Resume
              </button>
            )}

            {!isSecondSide && (
              <button
                onClick={() => handleSwitch()}
                className="flex-1 py-3 rounded-2xl bg-white/30 text-white font-bold"
              >
                Switch
              </button>
            )}

            <button
              onClick={() => handleStop(false)}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-white text-pink-600 font-bold shadow-lg"
            >
              {saving ? 'Saving...' : 'Done'}
            </button>
          </>
        )}
      </div>

      {/* Reset */}
      {hasStarted && !isRunning && (
        <button
          onClick={handleReset}
          className="w-full mt-3 py-2 text-white/70 text-sm hover:text-white transition-colors"
        >
          Reset timer
        </button>
      )}
    </div>
  );
}
