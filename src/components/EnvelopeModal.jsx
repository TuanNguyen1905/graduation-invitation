import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, MailOpen, Sparkles } from 'lucide-react';
import { playEnvelopeOpenSound } from '../utils/audio';

export default function EnvelopeModal({ guest, graduate, onOpen, theme }) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenEnvelope = () => {
    setIsOpening(true);

    // Play subtle crystalline audio chime
    playEnvelopeOpenSound();

    // Fire golden celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f5d061', '#e6af2e', '#ffffff', '#38bdf8', '#fb7185']
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f5d061', '#ffffff']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#e6af2e', '#fbbf24']
        });
      }, 250);
    } catch {
      // ignore in test environments
    }

    // Delay closing envelope screen so user sees smooth flap animation
    setTimeout(() => {
      onOpen();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg mx-auto">
        {/* Glow behind envelope */}
        <div
          className="absolute -inset-4 rounded-3xl blur-2xl opacity-60"
          style={{
            background: `linear-gradient(135deg, ${theme.sealColor || '#ec4899'}, #a855f7, #06b6d4)`
          }}
        ></div>

        {/* Envelope Container */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-700 border border-white/20 ${isOpening ? 'scale-105 opacity-90' : 'scale-100'}`}
          style={{ backgroundColor: theme.envelopeColor || '#1e1135' }}
        >
          {/* Top Flap Graphic */}
          <div className="relative pt-10 pb-5 px-6 text-center border-b border-white/10 bg-gradient-to-b from-white/10 to-transparent">
            <div
              className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-2xl border-2 text-white shadow-xl animate-pulse-subtle"
              style={{
                backgroundColor: `${theme.sealColor || '#ec4899'}33`,
                borderColor: theme.sealColor || '#ec4899',
                color: theme.sealColor || '#ec4899'
              }}
            >
              <Award className="w-8 h-8" />
            </div>

            <div className="text-[10px] uppercase tracking-widest text-pink-300 font-extrabold mb-1 font-genz">
              ✨ Official Graduation Invitation • 2026
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-genz tracking-wide">
              LỄ TỐT NGHIỆP CỬ NHÂN
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              {graduate.school}
            </p>
          </div>

          {/* Envelope Body / Personalization Card */}
          <div className="p-6 sm:p-8 text-center space-y-4 bg-gradient-to-b from-transparent to-black/40">
            {/* Guest Tag */}
            <div
              className="inline-block px-5 py-3.5 rounded-2xl border shadow-inner max-w-full"
              style={{
                backgroundColor: `${theme.sealColor || '#ec4899'}18`,
                borderColor: `${theme.sealColor || '#ec4899'}55`
              }}
            >
              {(guest?.inviteCode || guest?.id) && (
                <div className="mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white/90 font-mono text-[10px] font-bold tracking-widest border border-white/15">
                    MÃ THIỆP VIP: {guest.inviteCode || guest.id}
                  </span>
                </div>
              )}
              <div
                className="text-[10px] font-extrabold tracking-wider uppercase font-genz"
                style={{ color: theme.sealColor || '#ec4899' }}
              >
                {guest?.salutation || "Hú le • Kính mời"}
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-genz truncate">
                {guest?.name || "Quý Khách & Bạn Bè"}
              </div>
              {guest?.relationship && (
                <span className="inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-semibold">
                  {guest.relationship}
                </span>
              )}
            </div>

            {/* Custom note to this specific guest */}
            {guest?.customNote && (
              <p className="text-xs sm:text-sm italic text-slate-200 max-w-md mx-auto leading-relaxed border-l-2 pl-3 text-left"
                style={{ borderColor: theme.sealColor || '#ec4899' }}
              >
                "{guest.customNote}"
              </p>
            )}

            <div className="text-xs text-slate-300 font-medium">
              Tân Cử Nhân: <strong className="text-white font-bold">{graduate.fullName}</strong>
            </div>

            {/* Open Envelope Button / Wax Seal */}
            <div className="pt-2">
              <button
                onClick={handleOpenEnvelope}
                disabled={isOpening}
                className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-black text-white transition-all duration-300 shadow-xl active:scale-95 cursor-pointer font-genz text-sm uppercase tracking-wider"
                style={{
                  background: `linear-gradient(135deg, ${theme.sealColor || '#ec4899'}, #a855f7, #06b6d4)`
                }}
              >
                <MailOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>
                  {isOpening ? 'Đang mở thiệp...' : 'Chạm để Mở Thiệp Mời 🚀'}
                </span>
                <Sparkles className="w-4 h-4 text-white animate-bounce" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

