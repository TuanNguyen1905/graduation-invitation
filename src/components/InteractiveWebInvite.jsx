import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CalendarPlus,
  Heart,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Share2,
  Download,
  Sparkles,
  Compass,
  GraduationCap,
  Shirt,
  Volume2,
  VolumeX,
  Mail,
  Camera,
  X,
  Headphones,
  Play,
  Pause,
  Flame,
  Award,
  Ticket,
  User,
  Sun,
  Moon,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CountdownTimer from './CountdownTimer';
import EnvelopeModal from './EnvelopeModal';
import { createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { playCelebrationSound } from '../utils/audio';
import { DEFAULT_LAYOUT } from '../data/mockData';

export default function InteractiveWebInvite({
  invitation,
  currentGuest,
  theme,
  onOpenExportModal,
  onUpdateGuestRsvp,
  onAddWish,
  initialOpenedEnvelope = false,
  canViewWishes = false
}) {
  const [hasOpenedEnvelope, setHasOpenedEnvelope] = useState(() => initialOpenedEnvelope);
  const [rsvpStatus, setRsvpStatus] = useState(currentGuest?.rsvpStatus || 'pending');
  const [guestCount, setGuestCount] = useState(currentGuest?.guestCount || 1);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Dark / Light Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return theme?.mode ? theme.mode !== 'light' : true;
  });

  // Sync mode when theme prop changes
  useEffect(() => {
    if (theme?.mode) {
      setIsDarkMode(theme.mode !== 'light');
    }
  }, [theme?.mode]);

  // New wish form state
  const [wishName, setWishName] = useState(currentGuest?.name || '');
  const [wishMsg, setWishMsg] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎓');
  const [mySentWishes, setMySentWishes] = useState([]);
  const [wishSentSuccess, setWishSentSuccess] = useState(false);

  // Background music mock player state
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Gen Z interactive reactions counter
  const [reactions, setReactions] = useState({
    heart: 142,
    fire: 98,
    grad: 215,
    congrats: 116
  });
  const [userReacted, setUserReacted] = useState({});

  const { graduate, ceremony, wishes, gallery } = invitation;
  const layout = invitation.layout || DEFAULT_LAYOUT;
  const sections = layout.sections || DEFAULT_LAYOUT.sections;

  // Dynamic colors
  const primaryColor = theme.accentColor || '#0284c7';
  const secondaryColor = theme.secondaryColor || '#38bdf8';

  const handleToggleMusic = () => {
    const nextState = !isPlayingMusic;
    setIsPlayingMusic(nextState);
    if (nextState) {
      playCelebrationSound();
    }
  };

  const handleReactionClick = (key) => {
    setReactions((prev) => ({
      ...prev,
      [key]: prev[key] + (userReacted[key] ? -1 : 1)
    }));
    setUserReacted((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));

    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: [primaryColor, secondaryColor, '#f5d061', '#ffffff']
      });
    } catch {
      // ignore
    }
  };

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    if (onUpdateGuestRsvp && currentGuest) {
      onUpdateGuestRsvp(currentGuest.id, rsvpStatus, guestCount);
    }
    setRsvpSubmitted(true);
    playCelebrationSound();
  };

  const handleSendWish = (e) => {
    e.preventDefault();
    if (!wishMsg.trim()) return;

    const payload = {
      guestName: wishName || 'Người thân giấu tên',
      relationship: currentGuest?.relationship || 'Khách mời',
      message: wishMsg.trim(),
      emoji: selectedEmoji,
    };

    if (onAddWish) {
      onAddWish(payload);
    }

    setMySentWishes((prev) => [
      { id: `my-wish-${Date.now()}`, ...payload, time: 'Vừa gửi' },
      ...prev
    ]);
    setWishSentSuccess(true);
    setWishMsg('');
    setTimeout(() => setWishSentSuccess(false), 4000);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }
  };

  const calendarTitle = `Lễ Tốt Nghiệp Cử Nhân: ${graduate.fullName}`;
  const calendarDesc = `Tham dự Lễ trao bằng tốt nghiệp cử nhân của ${graduate.fullName} - ${graduate.degree} tại ${ceremony.venueName}.\n\nThông điệp: ${graduate.quote}`;
  const googleCalUrl = createGoogleCalendarUrl({
    title: calendarTitle,
    description: calendarDesc,
    location: `${ceremony.venueName}, ${ceremony.address}`,
    startDate: ceremony.date,
    startTime: ceremony.time,
  });

  const formattedDate = new Date(ceremony.date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isBoardingPassTheme = theme.id === 'genz-boarding-pass';
  const textAlign = layout.alignment === 'left' ? 'text-left' : 'text-center';
  const roundness = layout.cardRoundness || 'rounded-3xl';

  // Dynamic Theme & Mode Styles
  const pageBgClass = isDarkMode
    ? `bg-gradient-to-b ${theme.background || 'from-slate-950 via-slate-900 to-slate-950'} text-slate-100`
    : 'bg-gradient-to-b from-slate-50 via-sky-50/40 to-slate-100 text-slate-800';

  const cardBgClass = isDarkMode
    ? (theme.cardBg || 'bg-slate-900/90 text-slate-100 border-white/10 shadow-2xl backdrop-blur-xl')
    : 'bg-white/95 text-slate-800 border-slate-200 shadow-xl shadow-sky-500/5 backdrop-blur-xl';

  const cardBorderClass = isDarkMode ? (theme.borderClass || 'border-white/10') : 'border-slate-200';
  const subCardBg = isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200/90 text-slate-800';
  const subText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDarkMode ? 'text-white' : 'text-slate-900';
  const inputBg = isDarkMode
    ? 'bg-white/10 border-white/15 text-white placeholder:text-slate-400'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400';

  const primaryBtnStyle = {
    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
    color: '#ffffff',
    boxShadow: `0 8px 25px ${primaryColor}40`
  };

  /* --- INDIVIDUAL MODULAR SECTION RENDERERS --- */

  const renderMusic = () => (
    <div className={`flex items-center justify-between p-3 sm:p-3.5 ${roundness} ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/90 border-slate-200 shadow-sm'} border backdrop-blur-xl shadow-xl transition-all`}>
      <div className="flex items-center gap-3">
        <div
          className="relative w-10 h-10 rounded-xl p-0.5 shadow-md"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <div className={`w-full h-full ${isDarkMode ? 'bg-slate-950' : 'bg-white'} rounded-[10px] flex items-center justify-center`}>
            <Headphones className="w-4 h-4 animate-pulse" style={{ color: primaryColor }} />
          </div>
        </div>
        <div className="text-left">
          <div
            className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 font-genz"
            style={{ color: primaryColor }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Now Playing • Graduation Vibe
          </div>
          <div className={`text-xs font-bold truncate max-w-[210px] sm:max-w-sm mt-0.5 ${headingText}`}>
            {graduate.spotifySong || "Thanh Xuân (Graduation Anthem) • Da LAB"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPlayingMusic && (
          <div className="flex items-end gap-1 h-5 px-1">
            <span className="w-1 rounded-full animate-eq-1" style={{ backgroundColor: primaryColor }}></span>
            <span className="w-1 rounded-full animate-eq-2" style={{ backgroundColor: secondaryColor }}></span>
            <span className="w-1 rounded-full animate-eq-3" style={{ backgroundColor: primaryColor }}></span>
            <span className="w-1 rounded-full animate-eq-4" style={{ backgroundColor: secondaryColor }}></span>
          </div>
        )}
        <button
          onClick={handleToggleMusic}
          className={`p-2 rounded-xl transition-all cursor-pointer ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          title={isPlayingMusic ? "Tạm dừng giai điệu" : "Phát giai điệu chúc mừng"}
        >
          {isPlayingMusic ? <Pause className="w-4 h-4" style={{ color: primaryColor }} /> : <Play className="w-4 h-4 fill-current" style={{ color: primaryColor }} />}
        </button>
      </div>
    </div>
  );

  const renderSchool = () => (
    <div className={`space-y-1.5 ${textAlign}`}>
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border shadow-sm"
        style={{
          borderColor: `${primaryColor}40`,
          backgroundColor: `${primaryColor}15`,
          color: primaryColor
        }}
      >
        <GraduationCap className="w-4 h-4" />
        {graduate.school}
      </div>
      <div className={`text-[11px] uppercase tracking-widest font-semibold font-genz ${subText}`}>
        {graduate.faculty} • {graduate.classBatch}
      </div>
    </div>
  );

  const renderHero = () => (
    <div className={`relative overflow-hidden ${roundness} border ${cardBorderClass} ${cardBgClass} p-6 sm:p-10 ${textAlign} transition-all`}>
      {/* Gen Z Floating Stickers */}
      <div className="absolute top-4 left-3 sticker-tilt-left hidden sm:inline-block">
        <span
          className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg border border-white/20"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          ✨ 100% DONE
        </span>
      </div>

      <div className="absolute top-4 right-3 sticker-tilt-right hidden sm:inline-block">
        <span
          className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg border border-white/20"
          style={{ background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` }}
        >
          🎓 FINALLY GRADUATED
        </span>
      </div>

      {/* Salutation to Specific Guest */}
      <div className={`mb-6 pb-5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
        {(currentGuest?.inviteCode || currentGuest?.id) && (
          <div className="mb-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-mono text-[10px] font-black tracking-widest uppercase border shadow-xs"
              style={{
                borderColor: `${primaryColor}45`,
                backgroundColor: `${primaryColor}15`,
                color: primaryColor
              }}
            >
              <Ticket className="w-3 h-3" />
              MÃ THIỆP CÁ NHÂN: {currentGuest.inviteCode || currentGuest.id}
            </span>
          </div>
        )}
        <div
          className="text-xs uppercase tracking-widest font-extrabold mb-1 font-genz"
          style={{ color: primaryColor }}
        >
          {currentGuest?.salutation || "Hú le • Trân trọng kính mời"}
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-wide font-genz ${headingText}`}>
          {currentGuest?.name || "Quý Khách & Bạn Bè"}
        </h1>
        {currentGuest?.customNote && (
          <p className={`text-xs sm:text-sm italic mt-2 max-w-lg mx-auto py-2.5 px-4 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            "{currentGuest.customNote}"
          </p>
        )}
      </div>

      <p className={`text-xs uppercase tracking-widest font-bold mb-2 font-genz ${subText}`}>
        Đến tham dự Lễ Trao Bằng Cử Nhân cùng
      </p>

      {/* Graduate Avatar with Customizable Style */}
      {layout.avatarStyle === 'polaroid' ? (
        <div className="relative inline-block my-4 p-3.5 bg-white text-slate-900 rounded-xl shadow-2xl sticker-tilt-right max-w-[220px]">
          <div className="w-40 h-40 overflow-hidden rounded-lg mx-auto bg-slate-900">
            <img src={graduate.avatarUrl} alt={graduate.fullName} className="w-full h-full object-cover" />
          </div>
          <div className="pt-2 text-center font-bold text-xs font-genz text-slate-800">
            {graduate.fullName} 🎓
          </div>
        </div>
      ) : layout.avatarStyle === 'banner' ? (
        <div className="relative w-full max-w-md h-52 mx-auto rounded-3xl overflow-hidden shadow-2xl my-4 border-2 border-white/20">
          <img src={graduate.avatarUrl} alt={graduate.fullName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
            <span className="text-white font-extrabold text-sm">{graduate.honor}</span>
          </div>
        </div>
      ) : (
        <div className="relative inline-block my-4 group">
          <div
            className="absolute -inset-2 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          ></div>
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-white/20 backdrop-blur-md shadow-2xl mx-auto">
            <img
              src={graduate.avatarUrl}
              alt={graduate.fullName}
              className="w-full h-full rounded-full object-cover border-2 border-white shadow-inner"
            />
          </div>
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[11px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            {graduate.nickname || "Tân Cử Nhân"}
          </div>
        </div>
      )}

      {/* Graduate Name & Title */}
      <div className="space-y-1 mt-3">
        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight uppercase font-genz ${headingText}`}>
          {graduate.fullName}
        </h2>
        <div
          className="text-sm sm:text-base font-bold"
          style={{ color: primaryColor }}
        >
          {graduate.degree}
        </div>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-500 border border-amber-400/30 mt-1">
          {graduate.honor}
        </div>
      </div>

      {/* Quote / Vibe note */}
      {graduate.quote && (
        <div className="mt-5 max-w-lg mx-auto">
          <p className={`text-xs sm:text-sm italic leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            "{graduate.quote}"
          </p>
        </div>
      )}
    </div>
  );

  const renderReactions = () => (
    <div className={`p-4 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl flex items-center justify-around gap-2 transition-all`}>
      <button
        onClick={() => handleReactionClick('heart')}
        className={`flex-1 py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
          userReacted.heart
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-105'
            : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-rose-300' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
        }`}
      >
        <Heart className="w-4 h-4 fill-current" />
        <span>{reactions.heart}</span>
      </button>

      <button
        onClick={() => handleReactionClick('fire')}
        className={`flex-1 py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
          userReacted.fire
            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-105'
            : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-amber-300' : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
        }`}
      >
        <Flame className="w-4 h-4 fill-current" />
        <span>{reactions.fire}</span>
      </button>

      <button
        onClick={() => handleReactionClick('grad')}
        className={`flex-1 py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
          userReacted.grad
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105'
            : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-sky-300' : 'bg-sky-50 hover:bg-sky-100 text-sky-700'
        }`}
      >
        <Award className="w-4 h-4" />
        <span>{reactions.grad}</span>
      </button>

      <button
        onClick={() => handleReactionClick('congrats')}
        className={`flex-1 py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
          userReacted.congrats
            ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25 scale-105'
            : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>{reactions.congrats}</span>
      </button>
    </div>
  );

  const renderCountdown = () => (
    <div className={`p-6 sm:p-8 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl space-y-4 ${textAlign}`}>
      <div className="flex items-center justify-center gap-2 text-xs uppercase font-extrabold tracking-wider font-genz" style={{ color: primaryColor }}>
        <Clock className="w-4 h-4" />
        Đếm Ngược Đến Giờ Khắc Tốt Nghiệp
      </div>
      <CountdownTimer targetDate={ceremony.date} targetTime={ceremony.time} accentColor={primaryColor} />
    </div>
  );

  const renderVenue = () => (
    <div className={`p-6 sm:p-8 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl space-y-5 ${textAlign}`}>
      <div className="space-y-1">
        <span
          className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor
          }}
        >
          Thông Tin Chi Tiết
        </span>
        <h3 className={`text-xl sm:text-2xl font-black mt-2 font-genz ${headingText}`}>
          Thời Gian & Địa Điểm Cử Hành
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* Time Card */}
        <div className={`p-4 rounded-2xl ${subCardBg} flex items-start gap-3`}>
          <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-[10px] uppercase font-bold tracking-wider ${subText}`}>Thời gian tổ chức</div>
            <div className={`text-sm font-bold mt-0.5 capitalize ${headingText}`}>{formattedDate}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: primaryColor }}>
              Bắt đầu lúc {ceremony.time} - {ceremony.endExpected}
            </div>
          </div>
        </div>

        {/* Venue Card */}
        <div className={`p-4 rounded-2xl ${subCardBg} flex items-start gap-3`}>
          <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-[10px] uppercase font-bold tracking-wider ${subText}`}>Địa điểm tổ chức</div>
            <div className={`text-sm font-bold mt-0.5 ${headingText}`}>{ceremony.venueName}</div>
            <div className={`text-xs line-clamp-1 mt-0.5 ${subText}`}>{ceremony.address}</div>
          </div>
        </div>
      </div>

      {/* Dresscode Notice */}
      {
      //ceremony.dressCode && (
        // <div
        //   className="p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold"
        //   style={{
        //     backgroundColor: `${primaryColor}10`,
        //     borderColor: `${primaryColor}30`,
        //     color: isDarkMode ? '#e2e8f0' : '#1e293b'
        //   }}
        // >
        //   <Shirt className="w-4 h-4" style={{ color: primaryColor }} />
        //   {/* <span>Dress Code: <strong>{ceremony.dressCode}</strong></span> */}
        // </div>
      //)
      }

      {/* Action Buttons: Google Maps & Add to Calendar */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ceremony.mapQuery || ceremony.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all"
          style={primaryBtnStyle}
        >
          <Compass className="w-4 h-4" />
          Mở Bản Đồ Chỉ Đường
        </a>

        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
            isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          Thêm Vào Lịch (Google)
        </a>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className={`p-6 sm:p-8 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl space-y-6`}>
      <div className={`space-y-1 ${textAlign}`}>
        <span
          className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor
          }}
        >
          Chương Trình
        </span>
        <h3 className={`text-xl sm:text-2xl font-black mt-2 font-genz ${headingText}`}>
          Lịch Trình Chi Tiết
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b" style={{ '--tw-gradient-from': primaryColor, '--tw-gradient-to': secondaryColor }}>
        {ceremony.timeline.map((step, idx) => (
          <div key={idx} className="relative group">
            <span
              className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: primaryColor }}
            ></span>
            <div className={`p-4 rounded-2xl ${subCardBg} space-y-1 transition-transform group-hover:scale-[1.01]`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black" style={{ color: primaryColor }}>
                  {step.time}
                </span>
                <span className={`text-[10px] ${subText}`}>Mốc {idx + 1}</span>
              </div>
              <div className={`text-sm font-bold font-genz ${headingText}`}>{step.title}</div>
              {step.desc && <p className={`text-xs ${subText}`}>{step.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className={`p-6 sm:p-8 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl space-y-6`}>
      <div className={`space-y-1 ${textAlign}`}>
        <span
          className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor
          }}
        >
          Kỷ Niệm Thanh Xuân
        </span>
        <h3 className={`text-xl sm:text-2xl font-black mt-2 font-genz ${headingText}`}>
          Album Ảnh Kỷ Yếu & Đại Học
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {gallery.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative rounded-2xl overflow-hidden aspect-4/3 cursor-pointer shadow-md border border-white/10"
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
              <span className="text-white text-xs font-bold font-genz">{photo.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRsvp = () => (
    <div className={`p-6 sm:p-8 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl space-y-6`}>
      <div className={`space-y-1 ${textAlign}`}>
        <span
          className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor
          }}
        >
          Phản Hồi Tham Dự
        </span>
        <h3 className={`text-xl sm:text-2xl font-black mt-2 font-genz ${headingText}`}>
          Xác Nhận Tham Dự (RSVP)
        </h3>
        <p className={`text-xs ${subText}`}>
          Để Minh chuẩn bị chu đáo hoa, quà và chỗ ngồi tiếp đón bạn tốt nhất nha!
        </p>
      </div>

      {rsvpSubmitted ? (
        <div className={`p-6 rounded-2xl text-center space-y-2 ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-200' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-base font-bold font-genz">Đã Gửi Xác Nhận Thành Công!</h4>
          <p className="text-xs opacity-90">
            Cảm ơn {currentGuest?.name || 'bạn'} rất nhiều. Hẹn gặp bạn tại Lễ Tốt Nghiệp nhé! ✨
          </p>
        </div>
      ) : (
        <form onSubmit={handleRsvpSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRsvpStatus('confirmed')}
              className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                rsvpStatus === 'confirmed'
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-102 font-extrabold'
                  : subCardBg
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Chắc Chắn Đi ✨</span>
            </button>

            <button
              type="button"
              onClick={() => setRsvpStatus('declined')}
              className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                rsvpStatus === 'declined'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md scale-102 font-extrabold'
                  : subCardBg
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Bận Mất Rồi 🥺</span>
            </button>
          </div>

          {rsvpStatus === 'confirmed' && (
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${subText}`}>Số lượng người cùng tham dự:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      guestCount === num
                        ? 'text-white font-extrabold shadow'
                        : isDarkMode ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={guestCount === num ? primaryBtnStyle : {}}
                  >
                    {num} người
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg cursor-pointer"
            style={primaryBtnStyle}
          >
            Gửi Xác Nhận Tham Dự Ngay ✨
          </button>
        </form>
      )}
    </div>
  );

  const renderGuestbook = () => (
    <div className={`p-6 sm:p-8 ${roundness} border ${cardBorderClass} ${cardBgClass} backdrop-blur-xl shadow-xl space-y-6`}>
      <div className={`flex items-center gap-3 border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`text-base sm:text-lg font-bold font-genz ${headingText}`}>Sổ Lưu Bút & Lời Chúc Mừng</h3>
          <p className={`text-xs ${subText}`}>Gửi lời nhắn nhủ cute hoặc chúc mừng tân cử nhân</p>
        </div>
      </div>

      {/* Form write wish */}
      <form onSubmit={handleSendWish} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Tên của bạn..."
            value={wishName}
            onChange={(e) => setWishName(e.target.value)}
            className={`sm:col-span-1 px-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${inputBg}`}
          />

          {/* Emoji selector */}
          <div className={`sm:col-span-2 flex items-center justify-around p-1.5 rounded-xl border ${subCardBg}`}>
            {['🎓', '💐', '🥂', '✨', '🔥', '💖'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setSelectedEmoji(em)}
                className={`px-3 py-1 text-lg rounded-lg transition-transform cursor-pointer ${
                  selectedEmoji === em ? 'scale-125 border border-sky-400 shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={selectedEmoji === em ? { backgroundColor: `${primaryColor}30` } : {}}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          placeholder="Viết lời chúc mừng của bạn gửi tới tân cử nhân..."
          value={wishMsg}
          onChange={(e) => setWishMsg(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border text-xs resize-none font-medium focus:outline-none ${inputBg}`}
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 font-genz"
          style={primaryBtnStyle}
        >
          <Heart className="w-4 h-4 fill-current text-white" />
          Bắn Lời Chúc Mừng 🚀
        </button>

        {wishSentSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
            🎉 Đã gửi lời chúc riêng tư thành công tới {graduate.fullName}!
          </div>
        )}
      </form>

      {/* List of Wishes — Chỉ Admin (canViewWishes) mới xem được lời chúc của mọi người */}
      {canViewWishes ? (
        <div className="space-y-3 pt-2">
          <div className={`flex items-center justify-between text-[11px] font-bold ${subText}`}>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Toàn Bộ Lưu Bút (Chỉ Admin thấy • {wishes.length})
            </span>
          </div>
          {wishes.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border space-y-1.5 transition-all ${subCardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.emoji || '🎓'}</span>
                  <span className="text-xs font-bold font-genz" style={{ color: primaryColor }}>
                    {item.guestName}
                  </span>
                  {item.relationship && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                      {item.relationship}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-mono ${subText}`}>{item.time}</span>
              </div>
              <p className={`text-xs pl-7 leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                "{item.message}"
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {/* <div className={`p-4 rounded-2xl border flex items-start gap-3 ${subCardBg}`}>
            <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
            <div className="space-y-1">
              <div className={`text-xs font-bold ${headingText}`}>
                Lưu bút chế độ riêng tư
              </div>
              <p className={`text-[11px] leading-relaxed ${subText}`}>
                Lời chúc của bạn sẽ được gửi trực tiếp & bảo mật đến {graduate.fullName}. Chỉ chủ nhân buổi lễ mới xem được lưu bút của các khách mời khác.
              </p>
            </div>
          </div> */}

          {mySentWishes.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border space-y-1.5 transition-all ${subCardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.emoji || '🎓'}</span>
                  <span className="text-xs font-bold font-genz" style={{ color: primaryColor }}>
                    {item.guestName}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    Lời chúc của bạn ✓
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${subText}`}>{item.time}</span>
              </div>
              <p className={`text-xs pl-7 leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                "{item.message}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${pageBgClass} transition-colors duration-500 pb-20 font-sans`}>
      {/* Envelope Modal (Opens on first view or when triggered) */}
      {!hasOpenedEnvelope && (
        <EnvelopeModal
          guest={currentGuest}
          graduate={graduate}
          theme={theme}
          onOpen={() => setHasOpenedEnvelope(true)}
        />
      )}

      {/* Floating Action Controls */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2.5">
        
        {/* Dark / Light Mode Toggle Button (Tính năng người dùng yêu cầu!) */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full shadow-2xl backdrop-blur-md transition-all hover:scale-110 cursor-pointer ${
            isDarkMode
              ? 'bg-slate-900/90 text-amber-300 border border-amber-400/50 hover:bg-slate-800'
              : 'bg-white text-indigo-600 border border-slate-300 hover:bg-slate-50'
          }`}
          title={isDarkMode ? "Chuyển sang Chế độ Sáng (Light Mode)" : "Chuyển sang Chế độ Tối (Dark Mode)"}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>

        {/* Envelope trigger button */}
        <button
          onClick={() => setHasOpenedEnvelope(false)}
          className={`p-3 rounded-full shadow-xl backdrop-blur-md transition-transform hover:scale-110 cursor-pointer ${
            isDarkMode ? 'bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/40' : 'bg-white hover:bg-slate-50 text-sky-600 border border-slate-200'
          }`}
          title="Xem lại phong bì mở thiệp"
        >
          <Mail className="w-5 h-5" />
        </button>

        {/* High-res card download button */}
        <button
          onClick={onOpenExportModal}
          className="p-3 rounded-full text-white font-bold shadow-xl transition-transform hover:scale-110 cursor-pointer"
          style={primaryBtnStyle}
          title="Tải ảnh thiệp mời chất lượng cao"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Main Dynamic Layout Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-7">
        
        {/* Subtle Top Mode Pill Switcher */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: primaryColor }}></span>
            <span className={`text-[11px] font-bold font-genz uppercase tracking-wider ${subText}`}>
              Thiệp Mời Online
            </span>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/20 text-amber-300 border border-white/15'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Chế độ Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chế độ Tối</span>
              </>
            )}
          </button>
        </div>

        {/* Render Sections in Custom Layout Order */}
        {sections.map((section) => {
          if (!section.enabled) return null;
          switch (section.id) {
            case 'music':
              return <div key="music">{renderMusic()}</div>;
            case 'school':
              return <div key="school">{renderSchool()}</div>;
            case 'hero':
              return <div key="hero">{renderHero()}</div>;
            case 'reactions':
              return <div key="reactions">{renderReactions()}</div>;
            case 'countdown':
              return <div key="countdown">{renderCountdown()}</div>;
            case 'venue':
              return <div key="venue">{renderVenue()}</div>;
            case 'timeline':
              return <div key="timeline">{renderTimeline()}</div>;
            case 'gallery':
              return <div key="gallery">{renderGallery()}</div>;
            case 'rsvp':
              return <div key="rsvp">{renderRsvp()}</div>;
            case 'guestbook':
              return <div key="guestbook">{renderGuestbook()}</div>;
            default:
              return null;
          }
        })}

        {/* Lightbox Modal for Photo */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          >
            <div className="relative max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 p-2 text-white hover:text-sky-400 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-auto rounded-3xl shadow-2xl border border-white/20 max-h-[80vh] object-contain mx-auto"
              />
              <div className="text-center text-sm font-bold text-white mt-3 font-genz">
                {selectedPhoto.title}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`text-center pt-4 pb-12 text-xs space-y-1 ${subText}`}>
          <p className={`font-genz font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            ✨ GradInvite • Personalized Graduation Invitation
          </p>
          <p className="text-[11px] opacity-80">
            Hành trình 4 năm rực rỡ • Chúc mừng tân cử nhân 2026
          </p>
        </div>

      </div>
    </div>
  );
}
