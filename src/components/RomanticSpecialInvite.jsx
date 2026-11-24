import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  MapPin,
  CalendarPlus,
  ArrowUpRight,
  Heart,
  Volume2,
  VolumeX,
  Download,
  Mail,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Check,
  Compass,
  Home
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { ROMANTIC_PALETTES } from '../data/mockData';
import { createGoogleCalendarUrl } from '../utils/calendar';
import { joinCleanParts } from '../utils/inviteHelper';
import { verifyGuestUnlockInApi } from '../services/api';

function parseSpecial(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Lightweight Canvas Petal & Bokeh Background (C2.3 & C5)
 * Tự động tạm dừng khi ẩn khỏi viewport hoặc tab ẩn, và tắt hoàn toàn khi prefers-reduced-motion bật.
 */
function RomanticAtmosphereCanvas({ petalColor, particleColor, reducedMotion }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = null;
    let isVisible = true;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const count = width < 640 ? 18 : 28;
    const particles = Array.from({ length: count }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: idx % 3 === 0 ? 4 + Math.random() * 4 : 6 + Math.random() * 6,
      speedY: 0.35 + Math.random() * 0.55,
      speedX: (Math.random() - 0.5) * 0.4,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      alpha: 0.25 + Math.random() * 0.35,
      isBokeh: idx % 3 === 0
    }));

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleVisibility = () => {
      if (document.hidden) isVisible = false;
      else isVisible = true;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (isVisible && !document.hidden) {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(p.y * 0.01) * 0.25;
          p.angle += p.spin;
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x > width + 20) p.x = -20;
          if (p.x < -20) p.x = width + 20;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = p.alpha;
          if (p.isBokeh) {
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.rotate(p.angle);
            ctx.fillStyle = petalColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
    };
  }, [petalColor, particleColor, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}

/**
 * Scroll-reveal wrapper via IntersectionObserver (C2.4)
 */
function RevealOnScroll({ children, className = '', reducedMotion = false, delayMs = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion || shown) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion, shown]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: reducedMotion ? '0ms' : `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

export default function RomanticSpecialInvite({
  invitation,
  currentGuest,
  onNavigateToHome,
  onOpenExportModal,
  onUpdateGuestRsvp,
  onUnlockedGuest,
  initialOpenedEnvelope = false
}) {
  const special = parseSpecial(currentGuest?.specialConfig || currentGuest?.special_config);
  const palette =
    ROMANTIC_PALETTES.find((p) => p.id === special.paletteId) || ROMANTIC_PALETTES[0];

  const { graduate = {}, ceremony = {} } = invitation || {};

  // Detect prefers-reduced-motion (C5)
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // C3 Unlock Gate State
  const isLocked = Boolean(currentGuest?.specialLocked || special?.unlockGate?.locked);
  const [unlockAnswer, setUnlockAnswer] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isVerifyingUnlock, setIsVerifyingUnlock] = useState(false);

  // C2.1 3D Wax-Seal Envelope State
  const [envelopePhase, setEnvelopePhase] = useState(
    initialOpenedEnvelope ? 'opened' : 'sealed'
  ); // 'sealed' | 'cracking' | 'rising' | 'opened'
  const dragStartYRef = useRef(null);

  // C2.3 Optional Gyroscope Parallax (mobile tilt with permission)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroSupported] = useState(
    () => typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
  );

  // C2.8 Optional Audio Player
  const audioRef = useRef(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const hasMusic = Boolean(special.musicUrl && String(special.musicUrl).trim());

  // C2.5 Photo Lightbox + Touch Swipe
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const swipeStartXRef = useRef(null);

  // C2.7 RSVP state
  const [rsvpStatus, setRsvpStatus] = useState(currentGuest?.rsvpStatus || 'pending');
  const [rsvpFeedback, setRsvpFeedback] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState(false);

  useEffect(() => {
    setRsvpStatus(currentGuest?.rsvpStatus || 'pending');
  }, [currentGuest?.id, currentGuest?.rsvpStatus]);

  // Gyroscope orientation listener
  useEffect(() => {
    if (!gyroEnabled || reducedMotion) return;
    const handleOrient = (e) => {
      const gx = Math.max(-12, Math.min(12, (e.gamma || 0) * 0.35));
      const gy = Math.max(-12, Math.min(12, ((e.beta || 45) - 45) * 0.25));
      setTilt({ x: gx, y: gy });
    };
    window.addEventListener('deviceorientation', handleOrient);
    return () => window.removeEventListener('deviceorientation', handleOrient);
  }, [gyroEnabled, reducedMotion]);

  const handleEnableGyro = async () => {
    if (gyroEnabled) {
      setGyroEnabled(false);
      setTilt({ x: 0, y: 0 });
      return;
    }
    try {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') setGyroEnabled(true);
      } else {
        setGyroEnabled(true);
      }
    } catch {
      // Unsupported in in-app webview; ignore silently
    }
  };

  const handleToggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlayingMusic) {
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      audio.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const triggerOpenEnvelope = () => {
    if (envelopePhase !== 'sealed') return;

    // Optional background music starts only after explicit user touch (C2.8)
    if (hasMusic && audioRef.current && !isPlayingMusic) {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }

    if (reducedMotion) {
      setEnvelopePhase('opened');
      return;
    }

    setEnvelopePhase('cracking');
    setTimeout(() => setEnvelopePhase('rising'), 380);
    setTimeout(() => setEnvelopePhase('opened'), 1050);
  };

  const handleSubmitUnlock = async (e) => {
    e.preventDefault();
    if (!unlockAnswer.trim()) {
      setUnlockError('Vui lòng nhập câu trả lời của bạn.');
      return;
    }
    setIsVerifyingUnlock(true);
    setUnlockError('');
    const code = currentGuest?.inviteCode || currentGuest?.invite_code;
    const res = await verifyGuestUnlockInApi(code, unlockAnswer.trim());
    setIsVerifyingUnlock(false);

    if (res?.ok && res?.guest) {
      try {
        sessionStorage.setItem(`gradinvite_unlock_${code.toUpperCase()}`, res.unlockToken || '');
      } catch {
        // ignore storage restrictions
      }
      if (onUnlockedGuest) {
        onUnlockedGuest(res.guest, res.unlockToken);
      }
    } else {
      setUnlockError(res?.error || 'Đáp án chưa chính xác, hãy thử lại nhé.');
    }
  };

  const handleRomanticRsvp = () => {
    setRsvpStatus('confirmed');
    setRsvpFeedback(true);
    setFloatingHearts(true);
    if (onUpdateGuestRsvp && currentGuest) {
      onUpdateGuestRsvp(currentGuest.id, 'confirmed', 1);
    }

    // Android Vibration API (safe feature-detect)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([45, 35, 70]);
      }
    } catch {
      // ignore
    }

    // Romantic rose & gold confetti burst
    if (!reducedMotion) {
      try {
        confetti({
          particleCount: 55,
          spread: 68,
          origin: { y: 0.72 },
          colors: [palette.accent, palette.secondary, '#f4a2b8', '#ffffff']
        });
      } catch {
        // ignore
      }
    }
    setTimeout(() => setFloatingHearts(false), 3200);
  };

  const milestones = Array.isArray(special.milestones)
    ? special.milestones.filter((m) => m && (m.title || m.description || m.date || m.photoUrl))
    : [];
  const photos = Array.isArray(special.photos)
    ? special.photos.filter((p) => p && p.url)
    : [];

  const openPhotoLightbox = (idx) => {
    const run = () => setLightboxIndex(idx);
    if (!reducedMotion && typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      document.startViewTransition(run);
    } else {
      run();
    }
  };

  const stepPhoto = (dir) => {
    if (!photos.length || lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + dir + photos.length) % photos.length);
  };

  const formattedDate = ceremony.date
    ? new Date(`${ceremony.date}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    : '';

  const googleCalUrl = createGoogleCalendarUrl({
    title: `Lễ Tốt Nghiệp Cử Nhân: ${graduate.fullName || ''}`,
    description: `Lễ trao bằng tốt nghiệp của ${graduate.fullName || ''} tại ${ceremony.venueName || ''}.`,
    location: `${ceremony.venueName || ''}, ${ceremony.address || ''}`,
    startDate: ceremony.date,
    startTime: ceremony.time
  });

  const displayName = special.petName?.trim() || currentGuest?.name || 'Em';
  const openingLines = (special.openingMessage || currentGuest?.customNote || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  /* ── LOCKED VIEW (C3) ────────────────────────────────────────── */
  if (isLocked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 safe-area-x safe-area-bottom font-sans"
        style={{ background: palette.pageBg, color: palette.textPrimary }}
      >
        <RomanticAtmosphereCanvas
          petalColor={palette.petalColor}
          particleColor={palette.particleColor}
          reducedMotion={reducedMotion}
        />
        <div
          className="relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-10 bg-white/95 backdrop-blur-md border shadow-[0_25px_70px_-15px_rgba(88,28,45,0.2)] space-y-5 text-center"
          style={{ borderColor: `${palette.accent}35` }}
        >
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: palette.seal }}
          >
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold" style={{ color: palette.accent }}>
              Thiệp Riêng Tư Dành Cho {currentGuest?.name}
            </p>
            <h1 className="text-2xl font-romantic-serif font-bold text-balance">
              {special?.unlockGate?.question || 'Nhập mật mã kỷ niệm để mở thiệp'}
            </h1>
            {special?.unlockGate?.answerHint && (
              <p className="text-sm italic" style={{ color: palette.textMuted }}>
                Gợi ý: {special.unlockGate.answerHint}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmitUnlock} className="space-y-3">
            <input
              type="text"
              value={unlockAnswer}
              onChange={(e) => {
                setUnlockAnswer(e.target.value);
                setUnlockError('');
              }}
              placeholder="Nhập câu trả lời của hai đứa..."
              className="w-full min-h-[44px] px-4 py-3 rounded-xl border bg-white text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              style={{ borderColor: `${palette.accent}45` }}
              autoFocus
            />
            {unlockError && (
              <p className="text-sm text-rose-700 font-medium">{unlockError}</p>
            )}
            <button
              type="submit"
              disabled={isVerifyingUnlock}
              className="w-full min-h-[44px] py-3 rounded-xl text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: palette.accent }}
            >
              <Unlock className="w-4 h-4" />
              <span>{isVerifyingUnlock ? 'Đang kiểm tra...' : 'Mở khóa phong bì'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── RENDER AUDIO ELEMENT (ONLY PLAYS ON EXPLICIT TAP) ──────── */
  const audioNode = hasMusic ? (
    <audio ref={audioRef} src={special.musicUrl} loop preload="none" />
  ) : null;

  /* ── 3D WAX-SEAL ENVELOPE (C2.1) ─────────────────────────────── */
  if (envelopePhase !== 'opened') {
    const isCracking = envelopePhase === 'cracking' || envelopePhase === 'rising';
    const isRising = envelopePhase === 'rising';

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 [@media(max-height:500px)]:py-2 safe-area-x safe-area-bottom font-sans relative overflow-hidden"
        style={{ background: palette.pageBg, color: palette.textPrimary }}
      >
        {audioNode}
        <RomanticAtmosphereCanvas
          petalColor={palette.petalColor}
          particleColor={palette.particleColor}
          reducedMotion={reducedMotion}
        />

        <div className="relative z-10 w-full max-w-md [@media(max-height:500px)]:max-w-lg mx-auto text-center space-y-5 [@media(max-height:500px)]:space-y-2.5">
          <div className="space-y-1 [@media(max-height:500px)]:hidden">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: palette.accent }}>
              Gửi Riêng {currentGuest?.name}
            </p>
            <h1 className="text-2xl sm:text-3xl font-romantic-serif font-bold text-balance">
              Một Bức Thư Nhỏ Từ {graduate.nickname || 'Tuấn'}
            </h1>
          </div>

          {/* 3D Perspective Envelope */}
          <div
            className="relative mx-auto w-full aspect-[4/3] [@media(max-height:500px)]:aspect-[16/9] max-h-[340px] [@media(max-height:500px)]:max-h-[210px] select-none"
            style={{ perspective: '1200px' }}
          >
            {/* Letter Card inside envelope sliding upward */}
            <div
              className="absolute inset-x-4 bottom-3 top-6 rounded-xl bg-white border shadow-md flex flex-col items-center justify-center px-5 transition-all duration-700 ease-out"
              style={{
                borderColor: `${palette.accent}30`,
                transform: isRising ? 'translateY(-44%)' : 'translateY(0%)',
                zIndex: isRising ? 25 : 10
              }}
            >
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: palette.accent }}>
                Lễ Tốt Nghiệp Cử Nhân
              </p>
              <p className="font-handwriting text-2xl sm:text-3xl mt-1" style={{ color: palette.textPrimary }}>
                {displayName}
              </p>
            </div>

            {/* Envelope Base Body */}
            <div
              className="absolute inset-0 rounded-2xl border shadow-[0_24px_60px_-14px_rgba(92,31,49,0.28)] overflow-hidden"
              style={{
                backgroundColor: palette.envelope,
                borderColor: `${palette.accent}35`,
                zIndex: 15
              }}
            >
              {/* Diagonal Pocket Fold SVG */}
              <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
                <polygon points="0,300 200,145 400,300" fill={palette.surface} opacity="0.96" />
                <polygon points="0,0 200,155 0,300" fill={palette.envelopeInner} opacity="0.72" />
                <polygon points="400,0 200,155 400,300" fill={palette.envelopeInner} opacity="0.82" />
              </svg>
            </div>

            {/* 3D Animated Top Flap */}
            <div
              className="absolute inset-x-0 top-0 h-[56%] origin-top transition-transform duration-500 ease-in-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: isCracking ? 'rotateX(-176deg)' : 'rotateX(0deg)',
                zIndex: isCracking ? 8 : 30
              }}
            >
              <svg viewBox="0 0 400 170" preserveAspectRatio="none" className="w-full h-full drop-shadow-sm">
                <polygon
                  points="0,0 400,0 200,165"
                  fill={palette.envelope}
                  stroke={`${palette.accent}35`}
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* Interactive Wax Seal (Tap OR Pull down to break) */}
            <button
              type="button"
              onClick={triggerOpenEnvelope}
              onPointerDown={(e) => {
                dragStartYRef.current = e.clientY;
              }}
              onPointerMove={(e) => {
                if (dragStartYRef.current !== null && e.clientY - dragStartYRef.current > 24) {
                  dragStartYRef.current = null;
                  triggerOpenEnvelope();
                }
              }}
              onPointerUp={() => {
                dragStartYRef.current = null;
              }}
              aria-label="Mở dấu niêm sáp thiệp mời"
              className={`absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-40 w-16 h-16 [@media(max-height:500px)]:w-14 [@media(max-height:500px)]:h-14 rounded-full flex items-center justify-center text-white font-romantic-serif font-bold text-lg shadow-[0_8px_22px_rgba(92,20,38,0.45)] ring-4 ring-white/80 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
                isCracking ? 'scale-125 opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{
                background: `radial-gradient(circle at 35% 30%, ${palette.accent}, ${palette.seal})`
              }}
            >
              <span className="tracking-wider">{special.coupleInitials || 'T & T'}</span>
            </button>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={triggerOpenEnvelope}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-7 py-3 rounded-full text-white text-sm font-semibold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: palette.accent }}
            >
              <Heart className="w-4 h-4 fill-white/30" />
              <span>Chạm hoặc kéo dấu sáp để mở thiệp mời</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── OPENED ROMANTIC INVITATION LETTER (C2.2 - C2.9) ──────────── */
  return (
    <div
      className="min-h-screen relative overflow-hidden py-5 sm:py-10 px-4 safe-area-x safe-area-bottom font-sans"
      style={{ background: palette.pageBg, color: palette.textPrimary }}
    >
      {audioNode}
      <RomanticAtmosphereCanvas
        petalColor={palette.petalColor}
        particleColor={palette.particleColor}
        reducedMotion={reducedMotion}
      />

      {/* Row 1: Separate Return Bar (Trang sự kiện | Tên khách mời) synced with romantic palette */}
      {onNavigateToHome && (
        <header className="invitation-shell relative z-20 mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="min-h-[44px] min-w-[44px] px-3 py-2 -ml-3 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 hover:bg-white/60"
            style={{ color: palette.textMuted }}
          >
            <Home className="w-4 h-4 shrink-0" style={{ color: palette.accent }} />
            <span>Trang sự kiện</span>
          </button>

          {currentGuest?.name && (
            <span
              className="text-xs sm:text-sm font-semibold truncate max-w-[180px] sm:max-w-[260px]"
              style={{ color: palette.textPrimary }}
            >
              {currentGuest.name}
            </span>
          )}
        </header>
      )}

      {/* Row 2: Top Controls (Music + Gyro + Replay Envelope + Export) */}
      <div className="invitation-shell relative z-20 mb-4 flex items-center justify-between gap-2">
        <span
          className="hidden sm:inline text-xs uppercase tracking-[0.14em] font-semibold"
          style={{ color: palette.accent }}
        >
          Thiệp mời
        </span>

        <div className="flex flex-wrap items-center justify-end w-full sm:w-auto gap-2">
        {hasMusic && (
          <button
            type="button"
            onClick={handleToggleMusic}
            className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full bg-white/90 border text-xs sm:text-sm font-medium shadow-xs cursor-pointer"
            style={{ borderColor: `${palette.accent}35`, color: palette.textPrimary }}
          >
            {isPlayingMusic ? <Volume2 className="w-4 h-4" style={{ color: palette.accent }} /> : <VolumeX className="w-4 h-4" />}
            <span className="max-w-[150px] truncate">{special.musicTitle || (isPlayingMusic ? 'Đang phát nhạc' : 'Bật nhạc')}</span>
          </button>
        )}

        {gyroSupported && !reducedMotion && (
          <button
            type="button"
            onClick={handleEnableGyro}
            className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-full bg-white/90 border text-xs sm:text-sm font-medium shadow-xs cursor-pointer"
            style={{
              borderColor: gyroEnabled ? palette.accent : `${palette.accent}30`,
              color: gyroEnabled ? palette.accent : palette.textPrimary
            }}
            title="Hiệu ứng chiều sâu khi nghiêng điện thoại"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">{gyroEnabled ? '3D Nghiêng: Bật' : 'Chiều sâu 3D'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setEnvelopePhase('sealed')}
          className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full bg-white/90 border text-xs sm:text-sm font-medium shadow-xs cursor-pointer"
          style={{ borderColor: `${palette.accent}35`, color: palette.textPrimary }}
        >
          <Mail className="w-4 h-4" style={{ color: palette.accent }} />
          <span>Phong bì</span>
        </button>

        {onOpenExportModal && (
          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-white text-xs sm:text-sm font-semibold shadow-sm cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: palette.accent }}
          >
            <Download className="w-4 h-4" />
            <span>Lưu ảnh</span>
          </button>
        )}
        </div>
      </div>

      {/* Main Letter Card with optional subtle Gyroscope Tilt */}
      <article
        className="invitation-shell relative z-10 rounded-3xl bg-white/95 backdrop-blur-sm border overflow-hidden shadow-[0_30px_80px_-15px_rgba(92,28,46,0.22),0_10px_25px_-5px_rgba(15,23,42,0.08)] transition-transform duration-150 ease-out"
        style={{
          borderColor: `${palette.accent}38`,
          transform: gyroEnabled && !reducedMotion
            ? `perspective(1200px) rotateY(${tilt.x * 0.25}deg) rotateX(${-tilt.y * 0.25}deg)`
            : undefined
        }}
      >
        <div
          className="h-1 w-full opacity-90"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${palette.accent} 30%, ${palette.secondary} 70%, transparent 100%)` }}
        />

        {/* C2.2 Handwritten Opening & Personal Message */}
        <section
          className="px-5 sm:px-14 pt-12 sm:pt-16 pb-10 text-center"
          style={{ background: `linear-gradient(180deg, ${palette.envelope} 0%, #ffffff 62%)` }}
        >
          <p className="school-balanced uppercase tracking-[0.14em] font-semibold" style={{ color: palette.accent }}>
            {graduate.school}
          </p>
          {(graduate.faculty || graduate.classBatch) && (
            <p className="text-sm mt-1.5 text-balance" style={{ color: palette.textMuted }}>
              {joinCleanParts([graduate.faculty, graduate.classBatch])}
            </p>
          )}

          <div className="mt-7 space-y-2">
            <p className="text-xs sm:text-sm uppercase tracking-[0.16em] font-semibold" style={{ color: palette.textMuted }}>
              {currentGuest?.salutation || 'Gửi Người Thương'}
            </p>

            {/* Handwritten SVG Reveal & Script Font for Pet Name */}
            <div className="py-2">
              <h1
                className="font-handwriting font-bold tracking-normal leading-tight text-balance"
                style={{
                  fontSize: 'clamp(2.4rem, 7vw, 4rem)',
                  color: palette.accent
                }}
              >
                {displayName}
              </h1>
              <svg
                viewBox="0 0 240 22"
                className="w-44 h-5 mx-auto mt-1"
                aria-hidden="true"
              >
                <path
                  d="M12,14 Q70,4 120,12 T228,10"
                  fill="none"
                  stroke={palette.secondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          strokeDasharray: 260,
                          strokeDashoffset: 0,
                          animation: 'romanticStrokeDraw 1.6s ease-out forwards'
                        }
                  }
                />
              </svg>
            </div>
          </div>

          {openingLines.length > 0 && (
            <div className="mt-6 max-w-xl mx-auto space-y-3 editorial-body leading-relaxed italic" style={{ color: palette.textPrimary }}>
              {openingLines.map((line, idx) => (
                <RevealOnScroll key={idx} reducedMotion={reducedMotion} delayMs={idx * 140}>
                  <p>“{line}”</p>
                </RevealOnScroll>
              ))}
            </div>
          )}

          {/* Graduate Portrait */}
          {graduate.avatarUrl && (
            <div className="my-9 flex justify-center">
              <figure
                className="p-3 pb-5 bg-white border rounded-xl shadow-md rotate-[-1.5deg] max-w-[230px]"
                style={{ borderColor: `${palette.accent}2e` }}
              >
                <div className="w-48 h-56 overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={graduate.avatarUrl}
                    alt={graduate.fullName}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <figcaption className="pt-3 text-sm font-romantic-serif font-semibold" style={{ color: palette.textMuted }}>
                  {graduate.fullName}
                </figcaption>
              </figure>
            </div>
          )}
        </section>

        {/* C2.4 Two-Person Milestones Timeline (only shown when Tuấn has added milestones) */}
        {milestones.length > 0 && (
          <section className="px-5 sm:px-14 py-12 border-t" style={{ borderColor: `${palette.accent}20` }}>
            <div className="text-center mb-9 space-y-2">
              <p className="text-xs sm:text-sm uppercase tracking-[0.16em] font-semibold" style={{ color: palette.accent }}>
                Hành Trình Của Hai Đứa
              </p>
              <h2 className="editorial-h2 font-romantic-serif font-bold">
                Những Mốc Kỷ Niệm
              </h2>
            </div>

            <div className="space-y-8 max-w-2xl mx-auto">
              {milestones.map((m, idx) => (
                <RevealOnScroll key={m.id || idx} reducedMotion={reducedMotion} delayMs={idx * 80}>
                  <div
                    className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-5 rounded-2xl border bg-white shadow-xs"
                    style={{ borderColor: `${palette.accent}25` }}
                  >
                    {m.photoUrl && (
                      <div className="md:col-span-5 overflow-hidden rounded-xl aspect-[4/3] bg-slate-100">
                        <img
                          src={m.photoUrl}
                          alt={m.title || 'Kỷ niệm'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <div className={m.photoUrl ? 'md:col-span-7 space-y-1.5' : 'md:col-span-12 space-y-1.5'}>
                      {m.date && (
                        <p className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: palette.accent }}>
                          {m.date}
                        </p>
                      )}
                      {m.title && (
                        <h3 className="text-xl font-romantic-serif font-bold" style={{ color: palette.textPrimary }}>
                          {m.title}
                        </h3>
                      )}
                      {m.description && (
                        <p className="editorial-body leading-relaxed" style={{ color: palette.textMuted }}>
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </section>
        )}

        {/* C2.5 Shared Polaroid Gallery (only shown when Tuấn has added photos) */}
        {photos.length > 0 && (
          <section
            className="px-5 sm:px-14 py-12 border-t"
            style={{ backgroundColor: `${palette.envelope}66`, borderColor: `${palette.accent}20` }}
          >
            <div className="text-center mb-9 space-y-2">
              <p className="text-xs sm:text-sm uppercase tracking-[0.16em] font-semibold" style={{ color: palette.accent }}>
                Khung Hình Chung
              </p>
              <h2 className="editorial-h2 font-romantic-serif font-bold">
                Ký Ức Bên Nhau
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id || idx}
                  type="button"
                  onClick={() => openPhotoLightbox(idx)}
                  className={`group bg-white p-3 pb-4 rounded-xl border shadow-sm hover:shadow-md transition-all text-left cursor-pointer ${
                    idx % 2 === 0 ? 'sm:-rotate-1 hover:rotate-0' : 'sm:rotate-1 hover:rotate-0'
                  }`}
                  style={{ borderColor: `${palette.accent}28` }}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.caption || `Ảnh ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {photo.caption && (
                    <p className="mt-2.5 text-sm font-romantic-serif text-center" style={{ color: palette.textMuted }}>
                      {photo.caption}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* C2.6 Ceremony Details + Countdown */}
        <section className="px-5 sm:px-14 py-12 border-t text-center" style={{ borderColor: `${palette.accent}20` }}>
          <p className="text-xs sm:text-sm uppercase tracking-[0.16em] font-semibold mb-2" style={{ color: palette.accent }}>
            Ngày Chung Đôi
          </p>
          <h2 className="editorial-h1 font-romantic-serif font-bold mb-6" style={{ color: palette.textPrimary }}>
            Lễ Tốt Nghiệp Cử Nhân
          </h2>

          <div className="mb-8">
            <CountdownTimer
              targetDate={ceremony.date}
              targetTime={ceremony.time}
              accentColor={palette.accent}
              isDarkMode={false}
              showLabel
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-y text-left" style={{ borderColor: `${palette.accent}25` }}>
            <div className="py-5 md:pr-8 space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-semibold" style={{ color: palette.textMuted }}>
                <Calendar className="w-4 h-4" style={{ color: palette.accent }} />
                <span>Thời gian</span>
              </div>
              <p className="editorial-body font-semibold capitalize">{formattedDate}</p>
              <p className="editorial-body font-medium">
                Có mặt từ <span className="font-bold" style={{ color: palette.accent }}>{ceremony.time || '07:30'}</span>
                {ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}
              </p>
            </div>

            <div className="py-5 md:pl-8 space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-semibold" style={{ color: palette.textMuted }}>
                <MapPin className="w-4 h-4" style={{ color: palette.accent }} />
                <span>Địa điểm</span>
              </div>
              <p className="editorial-body font-semibold">{ceremony.venueName}</p>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: palette.textMuted }}>
                {ceremony.address}
              </p>
            </div>
          </div>

          {Array.isArray(ceremony.timeline) && ceremony.timeline.length > 0 && (
            <ol className="divide-y max-w-xl mx-auto mt-8 text-left" style={{ borderColor: `${palette.accent}20` }}>
              {ceremony.timeline.map((step, idx) => (
                <li key={idx} className="py-3.5 flex items-baseline gap-4">
                  <span className="w-16 shrink-0 text-sm font-mono font-bold tabular-nums" style={{ color: palette.accent }}>
                    {step.time}
                  </span>
                  <div className="min-w-0">
                    <div className="editorial-body font-semibold">{step.title}</div>
                    {step.desc && <p className="text-sm leading-relaxed" style={{ color: palette.textMuted }}>{step.desc}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ceremony.mapQuery || ceremony.address || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: palette.accent }}
            >
              <span>Xem chỉ đường</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-xl border text-sm font-semibold transition-colors bg-white hover:bg-slate-50"
              style={{ borderColor: `${palette.accent}40`, color: palette.textPrimary }}
            >
              <CalendarPlus className="w-4 h-4" style={{ color: palette.accent }} />
              <span>Thêm vào lịch</span>
            </a>
          </div>
        </section>

        {/* C2.7 Custom RSVP with Heart Confetti + Vibration */}
        <section
          className="px-5 sm:px-14 py-12 border-t text-center relative overflow-hidden"
          style={{ backgroundColor: `${palette.envelope}70`, borderColor: `${palette.accent}20` }}
        >
          <div className="max-w-md mx-auto space-y-5">
            <p className="text-xs sm:text-sm uppercase tracking-[0.16em] font-semibold" style={{ color: palette.accent }}>
              Lời Hẹn Ngày Tốt Nghiệp
            </p>
            <h2 className="editorial-h2 font-romantic-serif font-bold">
              Hẹn Gặp Em Tại Buổi Lễ Nhé
            </h2>

            <button
              type="button"
              onClick={handleRomanticRsvp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8 py-3.5 rounded-full text-white text-base font-semibold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.seal})` }}
            >
              {rsvpStatus === 'confirmed' ? <Check className="w-5 h-5" /> : <Heart className="w-5 h-5 fill-white/30" />}
              <span>{special.rsvpButtonLabel?.trim() || 'Em chắc chắn sẽ đến bên anh'}</span>
            </button>

            {(rsvpFeedback || rsvpStatus === 'confirmed') && (
              <p className="text-sm font-medium inline-flex items-center justify-center gap-1.5" style={{ color: palette.accent }}>
                <Sparkles className="w-4 h-4" />
                <span>Đã ghi nhận lời hẹn của {displayName}. Anh chờ em nhé!</span>
              </p>
            )}
          </div>

          {floatingHearts && !reducedMotion && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Heart className="w-12 h-12 text-rose-400/70 fill-rose-400/50 animate-ping" />
            </div>
          )}
        </section>

        {/* C2.9 Closing Wish, Handwritten Signature & Save Image */}
        <footer className="px-5 sm:px-14 py-12 border-t text-center space-y-6 bg-white" style={{ borderColor: `${palette.accent}20` }}>
          {special.closingWish && (
            <p className="editorial-body italic leading-relaxed max-w-xl mx-auto" style={{ color: palette.textPrimary }}>
              “{special.closingWish}”
            </p>
          )}

          <div className="space-y-2 pt-2">
            {special.signatureDataUrl ? (
              <img
                src={special.signatureDataUrl}
                alt={`Chữ ký của ${graduate.fullName}`}
                className="h-20 mx-auto object-contain"
              />
            ) : (
              <p className="font-handwriting text-3xl" style={{ color: palette.accent }}>
                {graduate.fullName || 'Nguyễn Đình Tuấn'}
              </p>
            )}
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: palette.textMuted }}>
              {graduate.fullName}
            </p>
          </div>

          {onOpenExportModal && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenExportModal}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-full border text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderColor: `${palette.accent}45`, color: palette.accent }}
              >
                <Download className="w-4 h-4" />
                <span>Lưu thiệp thành ảnh kỷ niệm</span>
              </button>
            </div>
          )}
        </footer>
      </article>

      {/* C2.5 Photo Lightbox with Swipe Navigation */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          onTouchStart={(e) => {
            swipeStartXRef.current = e.touches?.[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const startX = swipeStartXRef.current;
            const endX = e.changedTouches?.[0]?.clientX;
            swipeStartXRef.current = null;
            if (startX !== null && typeof endX === 'number') {
              const delta = endX - startX;
              if (delta > 45) stepPhoto(-1);
              else if (delta < -45) stepPhoto(1);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        >
          <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="self-end mb-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
              aria-label="Đóng ảnh"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full flex items-center justify-center">
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => stepPhoto(-1)}
                  className="absolute left-1 sm:-left-12 min-w-[44px] min-h-[44px] rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].caption || 'Kỷ niệm'}
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => stepPhoto(1)}
                  className="absolute right-1 sm:-right-12 min-w-[44px] min-h-[44px] rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {photos[lightboxIndex].caption && (
              <p className="text-center text-sm text-stone-200 mt-3">
                {photos[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
