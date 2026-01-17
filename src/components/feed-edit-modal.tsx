'use client';

import React, { useState } from 'react';
import { CloseIcon, TrashIcon } from '@/components/ui/icons';
import { FeedEvent, updateFeed, deleteFeed } from '@/lib/hooks';

type FeedEditModalProps = {
  feed: FeedEvent;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function FeedEditModal({
  feed,
  onClose,
  onSave,
  onDelete
}: FeedEditModalProps) {
  const isBottle = feed.feedType === 'Bottle';

  // Bottle state
  const [amountMl, setAmountMl] = useState(feed.amountMl || 90);
  const [bottleType, setBottleType] = useState<
    'Formula' | 'BreastMilk' | 'Mixed'
  >((feed.bottleType as 'Formula' | 'BreastMilk' | 'Mixed') || 'Formula');

  // Breast state
  const [firstSide, setFirstSide] = useState<'Left' | 'Right'>(
    (feed.firstSide as 'Left' | 'Right') || 'Left'
  );
  const [firstDurationMin, setFirstDurationMin] = useState(
    Math.floor((feed.firstDurationSec || 0) / 60)
  );
  const [secondDurationMin, setSecondDurationMin] = useState(
    Math.floor((feed.secondDurationSec || 0) / 60)
  );

  // Common
  const [notes, setNotes] = useState(feed.notes || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = {
        notes: notes.trim() || undefined
      };

      if (isBottle) {
        updates.amountMl = amountMl;
        updates.bottleType = bottleType;
      } else {
        updates.firstSide = firstSide;
        updates.firstDurationSec = firstDurationMin * 60;
        updates.secondDurationSec = secondDurationMin * 60;
        updates.totalDurationSec = (firstDurationMin + secondDurationMin) * 60;
      }

      // Use optimistic update
      await updateFeed(feed.id, updates);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      // Use optimistic delete
      await deleteFeed(feed.id);
      onDelete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div
          className={`card p-6 shadow-xl ${isBottle ? 'bg-gradient-to-br from-baby-blue to-baby-mint' : 'baby-gradient'}`}
        >
          <h2 className="text-xl font-bold text-white mb-4">
            Edit {isBottle ? 'Bottle' : 'Breastfeed'}
          </h2>

          {isBottle ? (
            <>
              {/* Amount */}
              <div className="mb-4">
                <label className="text-sm text-white/80 mb-2 block">
                  Amount (ml)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAmountMl(Math.max(10, amountMl - 10))}
                    className="w-10 h-10 rounded-full bg-white/20 text-white font-bold text-xl hover:bg-white/30"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={amountMl}
                    onChange={(e) =>
                      setAmountMl(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="flex-1 text-center text-2xl font-bold bg-white/20 rounded-xl py-2 text-white border-0"
                    min={0}
                    max={500}
                  />
                  <button
                    type="button"
                    onClick={() => setAmountMl(Math.min(500, amountMl + 10))}
                    className="w-10 h-10 rounded-full bg-white/20 text-white font-bold text-xl hover:bg-white/30"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottle type */}
              <div className="mb-4">
                <label className="text-sm text-white/80 mb-2 block">Type</label>
                <div className="flex gap-2">
                  {(['Formula', 'BreastMilk', 'Mixed'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBottleType(type)}
                      className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                        bottleType === type
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {type === 'BreastMilk' ? 'Breast Milk' : type}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* First side */}
              <div className="mb-4">
                <label className="text-sm text-white/80 mb-2 block">
                  First Side
                </label>
                <div className="flex gap-2">
                  {(['Left', 'Right'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setFirstSide(side)}
                      className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                        firstSide === side
                          ? 'bg-white text-pink-600 shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration inputs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-white/80 mb-1 block">
                    {firstSide} (min)
                  </label>
                  <input
                    type="number"
                    value={firstDurationMin}
                    onChange={(e) =>
                      setFirstDurationMin(
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="w-full text-center text-xl font-bold bg-white/20 rounded-xl py-2 text-white border-0"
                    min={0}
                    max={60}
                  />
                </div>
                <div>
                  <label className="text-sm text-white/80 mb-1 block">
                    {firstSide === 'Left' ? 'Right' : 'Left'} (min)
                  </label>
                  <input
                    type="number"
                    value={secondDurationMin}
                    onChange={(e) =>
                      setSecondDurationMin(
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="w-full text-center text-xl font-bold bg-white/20 rounded-xl py-2 text-white border-0"
                    min={0}
                    max={60}
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="text-sm text-white/80 mb-1 block">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="w-full px-3 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border-0"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/30 text-white text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="p-3 rounded-xl bg-red-500/30 text-white hover:bg-red-500/50 transition-all"
            >
              <TrashIcon className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/20 text-white font-bold"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 py-3 rounded-xl bg-white font-bold shadow-lg transition-all ${
                isBottle ? 'text-blue-600' : 'text-pink-600'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 card p-6 bg-slate-900 shadow-xl">
            <p className="text-white font-semibold mb-4">Delete this feed?</p>
            <p className="text-slate-400 text-sm mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedEditModal;
