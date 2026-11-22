import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Award, GraduationCap, MailOpen, Sparkles, Ticket } from 'lucide-react';
import { playEnvelopeOpenSound } from '../utils/audio';

export default function EnvelopeModal({ guest, graduate, onOpen, theme }) {
  const [isOpening, setIsOpening] = useState(false);

  const primaryColor = theme?.accentColor || theme?.sealColor || '#0284c7';
  const secondaryColor = theme?.secondaryColor || '#38bdf8';

  const handleOpenEnvelope = () => {
    setIsOpening(true);

    // Play subtle crystalline audio chime
    playEnvelopeOpenSound();

    // Fire celebration confetti matching theme colors
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: [primaryColor, secondaryColor, '#f5d061', '#ffffff']
      });

      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: [primaryColor, '#f5d061', '#ffffff']
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: [secondaryColor, '#f5d061', '#ffffff']
        });
      }, 220);
    } catch {
      // ignore in test environments
    }

    setTimeout(() => {
      onOpen();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-gradient-to-br from-sky-50/95 via-white/95 to-indigo-50/95 backdrop-blur-xl">
      {/* Soft ambient luminous accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: secondaryColor }}
      />

      <div className="relative w-full max-w-lg mx-auto my-auto">
        {/* Soft colored paper shadow behind envelope */}
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-[32px] blur-2xl opacity-20 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
          }}
        />

        {/* Luminous Fine-Paper Envelope Card */}
        <div
          className={`relative overflow-hidden rounded-[28px] bg-white border border-slate-200/90 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.14)] transition-all duration-500 ${
            isOpening ? 'scale-[1.03] -translate-y-2 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Top Accent Ribbon */}
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
            }}
          />

          {/* Envelope Flap Header Geometry */}
          <div className="relative bg-gradient-to-b from-sky-50/70 via-white to-white pt-8 pb-6 px-6 sm:px-8 text-center">
            {/* Subtle V-flap SVG hairline */}
            <svg
              aria-hidden="true"
              viewBox="0 0 400 72"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-14 text-slate-200/80"
            >
              <path
                d="M0,0 L200,64 L400,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>

            {/* Top Official Label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-[10px] uppercase tracking-[0.18em] font-bold text-slate-600 mb-3">
              <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
              <span>Thư Mời Tốt Nghiệp • 2026</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-editorial tracking-tight leading-tight">
              Lễ Tốt Nghiệp Cử Nhân
            </h2>
            {graduate?.school && (
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1.5 max-w-sm mx-auto">
                {graduate.school}
              </p>
            )}

            {/* Wax Seal / Graduation Crest centered on flap tip */}
            <div className="relative z-10 mt-5 flex justify-center">
              <div
                className="w-16 h-16 rounded-full p-1 shadow-lg ring-4 ring-white transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                }}
              >
                <div className="w-full h-full rounded-full border border-white/40 flex items-center justify-center text-white">
                  <Award className="w-7 h-7" />
                </div>
              </div>
            </div>
          </div>

          {/* Envelope Body & Recipient Personalization */}
          <div className="px-6 sm:px-8 pb-8 pt-4 text-center space-y-5 bg-white">
            {/* Personalized Guest Recipient Box */}
            <div
              className="rounded-2xl border p-5 sm:p-6 bg-slate-50/75 space-y-2 transition-colors"
              style={{ borderColor: `${primaryColor}28` }}
            >
              {(guest?.inviteCode || guest?.id) && (
                <div className="flex justify-center">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white font-mono text-[10px] font-bold tracking-wider uppercase border shadow-2xs"
                    style={{
                      color: primaryColor,
                      borderColor: `${primaryColor}35`
                    }}
                  >
                    <Ticket className="w-3 h-3" />
                    <span>Mã thiệp: {guest.inviteCode || guest.id}</span>
                  </span>
                </div>
              )}

              <div
                className="text-[11px] font-extrabold tracking-widest uppercase font-genz pt-1"
                style={{ color: primaryColor }}
              >
                {guest?.salutation || 'Trân trọng kính mời'}
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 font-genz leading-snug break-words">
                {guest?.name || 'Quý Khách & Bạn Bè'}
              </div>

              {guest?.relationship && (
                <div>
                  <span className="inline-block text-[11px] px-3 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold shadow-2xs">
                    {guest.relationship}
                  </span>
                </div>
              )}
            </div>

            {/* Custom Personal Note */}
            {guest?.customNote && (
              <blockquote
                className="text-xs sm:text-sm italic text-slate-600 max-w-md mx-auto leading-relaxed border-l-2 pl-3.5 py-1 text-left bg-slate-50/60 rounded-r-xl pr-3"
                style={{ borderColor: primaryColor }}
              >
                "{guest.customNote}"
              </blockquote>
            )}

            {/* Graduate Host Signature Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              {graduate?.avatarUrl ? (
                <img
                  src={graduate.avatarUrl}
                  alt={graduate.fullName || 'Tân cử nhân'}
                  className="w-6 h-6 rounded-full object-cover border border-white shadow-2xs"
                />
              ) : (
                <GraduationCap className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
              )}
              <span>
                Từ tân cử nhân:{' '}
                <strong className="text-slate-900 font-bold">
                  {graduate?.fullName || 'Nguyễn Đình Tuấn'}
                </strong>
              </span>
            </div>

            {/* Primary CTA Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                disabled={isOpening}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-extrabold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer font-genz text-sm tracking-wide disabled:opacity-70"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 10px 25px -5px ${primaryColor}55`
                }}
              >
                <MailOpen className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>{isOpening ? 'Đang mở thiệp...' : 'Mở Thiệp Mời'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
