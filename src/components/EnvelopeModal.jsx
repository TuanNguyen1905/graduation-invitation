import React, { useState } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { playEnvelopeOpenSound } from '../utils/audio';

export default function EnvelopeModal({ guest, graduate, onOpen, theme }) {
  const [isOpening, setIsOpening] = useState(false);

  const accentColor = theme?.accentColor || theme?.sealColor || '#1e3a5f';
  const isDark = theme?.mode === 'dark';

  const handleOpenEnvelope = () => {
    if (isOpening) return;
    setIsOpening(true);

    try {
      playEnvelopeOpenSound();
    } catch {
      // ignore audio restriction errors
    }

    setTimeout(() => {
      onOpen();
    }, 450);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto transition-opacity duration-500 ${
        isDark ? 'bg-[#0e1014]/95' : 'bg-[#f1ede6]/95'
      } ${isOpening ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="w-full max-w-md mx-auto my-auto">
        <div
          className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
            isDark
              ? 'bg-[#161920] border-white/12 text-stone-100 shadow-[0_24px_64px_rgba(0,0,0,0.55)]'
              : 'bg-[#fdfbf7] border-stone-300/80 text-stone-900 shadow-[0_24px_60px_-15px_rgba(28,25,23,0.14)]'
          } ${isOpening ? '-translate-y-3 scale-[1.01]' : 'translate-y-0 scale-100'}`}
        >
          {/* Inner hairline stationery frame */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-3 rounded-lg border ${
              isDark ? 'border-white/8' : 'border-stone-200/80'
            }`}
          />

          {/* Top Envelope Flap Geometry */}
          <div className="relative pt-10 pb-8 px-8 text-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 400 76"
              preserveAspectRatio="none"
              className={`pointer-events-none absolute inset-x-0 bottom-0 w-full h-16 ${
                isDark ? 'text-white/10' : 'text-stone-300/75'
              }`}
            >
              <path d="M0,0 L200,68 L400,0" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            <p
              className="text-[10px] uppercase tracking-[0.26em] font-semibold mb-3"
              style={{ color: accentColor }}
            >
              Thư Mời Lễ Tốt Nghiệp
            </p>

            <h2
              className={`text-2xl sm:text-[28px] font-semibold font-editorial tracking-tight leading-snug ${
                isDark ? 'text-stone-50' : 'text-stone-900'
              }`}
            >
              {graduate?.fullName || 'Tân Cử Nhân'}
            </h2>

            {graduate?.school && (
              <p
                className={`text-xs mt-1.5 tracking-wide ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                {graduate.school}
              </p>
            )}

            {/* Understated Monogram Wax Seal */}
            <div className="relative z-10 mt-6 flex justify-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ring-4"
                style={{
                  backgroundColor: accentColor,
                  '--tw-ring-color': isDark ? '#161920' : '#fdfbf7'
                }}
              >
                <GraduationCap className="w-5 h-5 stroke-[1.75]" />
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="relative z-10 px-8 sm:px-10 pb-10 pt-3 text-center space-y-6">
            <div className="space-y-1.5">
              <p
                className={`text-[11px] uppercase tracking-[0.2em] font-medium ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                {guest?.salutation || 'Trân trọng kính mời'}
              </p>

              <p
                className={`text-xl sm:text-2xl font-editorial font-semibold leading-snug break-words ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {guest?.name || 'Quý Khách'}
              </p>

              {guest?.relationship && (
                <p
                  className={`text-xs ${
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  {guest.relationship}
                </p>
              )}
            </div>

            {guest?.customNote && (
              <p
                className={`text-xs sm:text-sm italic leading-relaxed max-w-xs mx-auto font-garamond text-base ${
                  isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                “{guest.customNote}”
              </p>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                disabled={isOpening}
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-lg text-xs uppercase tracking-[0.18em] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                <span>{isOpening ? 'Đang mở...' : 'Mở thiệp mời'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {(guest?.inviteCode || guest?.id) && (
              <p
                className={`text-[10px] font-mono tracking-[0.16em] uppercase pt-1 ${
                  isDark ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                {guest.inviteCode || guest.id}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
