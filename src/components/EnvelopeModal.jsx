import React, { useState } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { playEnvelopeOpenSound } from '../utils/audio';

export default function EnvelopeModal({ guest, graduate, onOpen, theme }) {
  const [isOpening, setIsOpening] = useState(false);

  const accentColor = theme?.accentColor || theme?.sealColor || '#1e3a5f';
  const secondaryColor = theme?.secondaryColor || accentColor;
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto transition-opacity duration-500 backdrop-blur-md ${
        isDark ? 'bg-[#0e1014]/90' : 'bg-slate-900/35'
      } ${isOpening ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="w-full max-w-md mx-auto my-auto">
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
            isDark
              ? 'bg-[#161920] border-white/15 text-stone-100 shadow-[0_30px_80px_rgba(0,0,0,0.65)]'
              : 'bg-white text-slate-900 shadow-[0_30px_80px_-15px_rgba(15,23,42,0.3),0_12px_28px_-6px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/10'
          } ${isOpening ? '-translate-y-3 scale-[1.01]' : 'translate-y-0 scale-100'}`}
          style={isDark ? undefined : { borderColor: `${accentColor}40` }}
        >
          {/* Inner hairline stationery frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 rounded-lg border"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : `${accentColor}1f`
            }}
          />

          {/* Top Envelope Flap Geometry with gentle theme wash */}
          <div
            className="relative pt-10 pb-8 px-8 text-center"
            style={
              isDark
                ? undefined
                : {
                    background: `linear-gradient(180deg, ${accentColor}10 0%, #ffffff 100%)`
                  }
            }
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 400 76"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-16"
              style={{ color: isDark ? 'rgba(255,255,255,0.1)' : `${accentColor}33` }}
            >
              <path d="M0,0 L200,68 L400,0" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>

            <p
              className="text-xs uppercase tracking-[0.14em] font-semibold mb-3"
              style={{ color: accentColor }}
            >
              Thư Mời Lễ Tốt Nghiệp
            </p>

            <h2
              className={`text-2xl sm:text-3xl font-bold font-editorial tracking-tight leading-snug ${
                isDark ? 'text-stone-50' : 'text-stone-900'
              }`}
            >
              {graduate?.fullName || 'Tân Cử Nhân'}
            </h2>

            {graduate?.school && (
              <p
                className={`text-sm mt-2 ${
                  isDark ? 'text-stone-300' : 'text-stone-600'
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
                  '--tw-ring-color': isDark ? '#161920' : '#ffffff'
                }}
              >
                <GraduationCap className="w-5 h-5 stroke-[1.75]" />
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="relative z-10 px-7 sm:px-10 pb-10 pt-3 text-center space-y-6">
            <div className="space-y-2">
              <p
                className={`text-xs uppercase tracking-[0.14em] font-semibold ${
                  isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                {guest?.salutation || 'Trân trọng kính mời'}
              </p>

              <p
                className={`text-2xl sm:text-[28px] font-editorial font-bold leading-snug break-words ${
                  isDark ? 'text-white' : 'text-stone-900'
                }`}
              >
                {guest?.name || 'Quý Khách'}
              </p>

              {guest?.relationship && (
                <p
                  className={`text-sm ${
                    isDark ? 'text-stone-300' : 'text-stone-600'
                  }`}
                >
                  {guest.relationship}
                </p>
              )}
            </div>

            {guest?.customNote && (
              <p
                className={`text-base italic leading-relaxed max-w-sm mx-auto ${
                  isDark ? 'text-stone-200' : 'text-stone-700'
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
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                <span>{isOpening ? 'Đang mở...' : 'Mở thiệp mời'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {(guest?.inviteCode || guest?.id) && (
              <p
                className={`text-xs font-mono tracking-[0.08em] uppercase pt-1 ${
                  isDark ? 'text-stone-400' : 'text-stone-500'
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
