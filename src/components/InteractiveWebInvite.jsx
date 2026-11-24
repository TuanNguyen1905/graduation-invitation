import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  CalendarPlus,
  Check,
  Download,
  Mail,
  X,
  Sun,
  Moon,
  Lock,
  ArrowUpRight,
  Home
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import EnvelopeModal from './EnvelopeModal';
import { createGoogleCalendarUrl } from '../utils/calendar';
import { playCelebrationSound } from '../utils/audio';
import { DEFAULT_LAYOUT } from '../data/mockData';
import { joinCleanParts } from '../utils/inviteHelper';

export default function InteractiveWebInvite({
  invitation,
  currentGuest,
  theme,
  onNavigateToHome,
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

  // Dark / Light Mode State (defaults to light stationery unless theme explicitly sets dark)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return theme?.mode === 'dark';
  });

  useEffect(() => {
    if (theme?.mode) {
      setIsDarkMode(theme.mode === 'dark');
    }
  }, [theme?.mode]);

  useEffect(() => {
    setRsvpStatus(currentGuest?.rsvpStatus || 'pending');
    setGuestCount(currentGuest?.guestCount || 1);
    setRsvpSubmitted(false);
    setWishName(currentGuest?.name || '');
  }, [currentGuest?.id, currentGuest?.name, currentGuest?.rsvpStatus, currentGuest?.guestCount]);

  // Wish form state
  const [wishName, setWishName] = useState(currentGuest?.name || '');
  const [wishMsg, setWishMsg] = useState('');
  const [mySentWishes, setMySentWishes] = useState([]);
  const [wishSentSuccess, setWishSentSuccess] = useState(false);

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const { graduate = {}, ceremony = {}, wishes = [], gallery = [] } = invitation || {};
  const layout = invitation?.layout || DEFAULT_LAYOUT;
  const sections = layout.sections || DEFAULT_LAYOUT.sections;

  const accentColor = theme?.accentColor || '#1e3a5f';
  const secondaryColor = theme?.secondaryColor || accentColor;
  const alignCenter = layout.alignment !== 'left';
  const textAlign = alignCenter ? 'text-center' : 'text-left';

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    const finalStatus = rsvpStatus === 'pending' ? 'confirmed' : rsvpStatus;
    setRsvpStatus(finalStatus);
    if (onUpdateGuestRsvp && currentGuest) {
      onUpdateGuestRsvp(currentGuest.id, finalStatus, guestCount);
    }
    setRsvpSubmitted(true);
    try {
      playCelebrationSound();
    } catch {
      // ignore
    }
  };

  const handleSendWish = (e) => {
    e.preventDefault();
    if (!wishMsg.trim()) return;

    const payload = {
      guestName: wishName.trim() || 'Khách mời',
      relationship: currentGuest?.relationship || 'Khách mời',
      message: wishMsg.trim(),
      emoji: '🎓'
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
    setTimeout(() => setWishSentSuccess(false), 4500);
  };

  const calendarTitle = `Lễ Tốt Nghiệp Cử Nhân: ${graduate.fullName || ''}`;
  const calendarDesc = `Tham dự Lễ trao bằng tốt nghiệp của ${graduate.fullName || ''} tại ${ceremony.venueName || ''}.`;
  const googleCalUrl = createGoogleCalendarUrl({
    title: calendarTitle,
    description: calendarDesc,
    location: `${ceremony.venueName || ''}, ${ceremony.address || ''}`,
    startDate: ceremony.date,
    startTime: ceremony.time
  });

  const formattedDate = ceremony.date
    ? new Date(`${ceremony.date}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    : '';

  // Clean Tinted-White Backdrop + Theme Glow / Charcoal Dark Mode Palette Tokens
  const outerBg = isDarkMode ? 'bg-[#0e1014] text-stone-100' : 'bg-[#f3f5f9] text-slate-900';
  const outerLightStyle = isDarkMode
    ? {
        backgroundColor: '#0e1014',
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${accentColor}1c 0%, transparent 58%)`
      }
    : {
        backgroundColor: '#f3f5f9',
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 65%), radial-gradient(circle at 100% 100%, ${secondaryColor}12 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)`
      };
  const sheetBg = isDarkMode
    ? 'bg-[#161920] border-white/12 shadow-[0_24px_70px_rgba(0,0,0,0.65)]'
    : 'bg-white border shadow-[0_25px_70px_-12px_rgba(15,23,42,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.06]';
  const sheetStyle = isDarkMode ? undefined : { borderColor: `${accentColor}38` };
  const hairline = isDarkMode ? 'border-white/10' : 'border-slate-200/80';
  const headingColor = isDarkMode ? 'text-stone-50' : 'text-slate-900';
  const bodyColor = isDarkMode ? 'text-stone-200' : 'text-slate-700';
  const mutedColor = isDarkMode ? 'text-stone-300' : 'text-slate-600';
  const subtleSurface = isDarkMode
    ? 'bg-white/[0.03] border-white/10'
    : 'bg-slate-50/70 border-slate-200/80';
  const tintedSectionStyle = isDarkMode
    ? undefined
    : { backgroundColor: `${accentColor}07`, borderColor: `${accentColor}22` };
  const inputStyle = isDarkMode
    ? 'bg-[#101218] border-white/15 text-stone-100 placeholder:text-stone-400 focus:border-stone-400'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-slate-700';

  const isSectionEnabled = (id) => {
    const found = sections.find((s) => s.id === id);
    return found ? Boolean(found.enabled) : false;
  };

  /* ── SECTION RENDERERS (Clean, Fine-Stationery Rhythm) ────────── */

  const renderHeroSection = () => (
    <section
      className={`py-10 sm:py-14 px-6 sm:px-12 ${textAlign} transition-colors duration-300`}
      style={
        isDarkMode
          ? {
              background: `linear-gradient(180deg, ${accentColor}16 0%, #161920 48%)`
            }
          : {
              background: `linear-gradient(180deg, ${accentColor}10 0%, ${secondaryColor}06 24%, #ffffff 58%)`
            }
      }
    >
      {/* School & Faculty masthead */}
      {(graduate.school || graduate.faculty) && (
        <div className="mb-8 space-y-1.5">
          {graduate.school && (
            <p
              className="school-balanced uppercase tracking-[0.1em] font-semibold"
              style={{ color: accentColor }}
            >
              {graduate.school}
            </p>
          )}
          {(graduate.faculty || graduate.classBatch) && (
            <p className={`text-sm text-balance ${mutedColor}`}>
              {joinCleanParts([graduate.faculty, graduate.classBatch])}
            </p>
          )}
        </div>
      )}

      {/* Invitation Masthead */}
      <div className="space-y-3 mb-9">
        <p className={`text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold ${mutedColor}`}>
          Thư Mời Tham Dự
        </p>
        <h1 className={`editorial-h1 font-editorial font-bold tracking-tight leading-tight ${headingColor}`}>
          Lễ Tốt Nghiệp Cử Nhân
        </h1>
        <div
          className={`w-12 h-px ${alignCenter ? 'mx-auto' : ''}`}
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Personalized Recipient Salutation */}
      <div
        className={`py-6 px-5 mb-9 rounded-xl border ${hairline} space-y-2`}
        style={tintedSectionStyle}
      >
        <p className={`text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold ${mutedColor}`}>
          {currentGuest?.salutation || 'Trân trọng kính mời'}
        </p>
        <div className={`text-2xl sm:text-3xl font-editorial font-bold ${headingColor}`}>
          {currentGuest?.name || 'Quý Khách'}
        </div>
        {currentGuest?.customNote && (
          <p className={`text-base italic leading-relaxed max-w-md ${alignCenter ? 'mx-auto' : ''} pt-1 ${bodyColor}`}>
            “{currentGuest.customNote}”
          </p>
        )}
      </div>

      {/* Graduate Portrait (Honors layout.avatarStyle without neon glow) */}
      {graduate.avatarUrl && (
        <div className="my-8">
          {layout.avatarStyle === 'polaroid' ? (
            <figure className={`inline-block p-3 pb-5 border ${isDarkMode ? 'bg-[#1d212a] border-white/10' : 'bg-white border-stone-200'} shadow-sm max-w-[230px]`}>
              <div className="w-48 h-56 overflow-hidden bg-stone-200">
                <img
                  src={graduate.avatarUrl}
                  alt={graduate.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className={`pt-3 text-center text-sm font-medium ${mutedColor}`}>
                {graduate.fullName}
              </figcaption>
            </figure>
          ) : layout.avatarStyle === 'banner' ? (
            <div className={`w-full max-w-md aspect-[16/10] ${alignCenter ? 'mx-auto' : ''} overflow-hidden rounded-lg border ${hairline}`}>
              <img
                src={graduate.avatarUrl}
                alt={graduate.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`inline-block p-1.5 rounded-full border ${hairline}`}>
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden bg-stone-200">
                <img
                  src={graduate.avatarUrl}
                  alt={graduate.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Graduate Name, Degree & Quote */}
      <div className="space-y-2 mt-6">
        <p className={`text-xs sm:text-sm uppercase tracking-[0.14em] font-medium ${mutedColor}`}>
          Tân Cử Nhân
        </p>
        <h2 className={`editorial-h2 font-editorial font-bold tracking-tight uppercase ${headingColor}`}>
          {graduate.fullName}
        </h2>
        {(graduate.degree || graduate.honor) && (
          <p className="editorial-body font-semibold" style={{ color: accentColor }}>
            {joinCleanParts([graduate.degree, graduate.honor])}
          </p>
        )}
      </div>

      {graduate.quote && (
        <p className={`mt-6 editorial-body italic leading-relaxed max-w-xl ${alignCenter ? 'mx-auto' : ''} ${bodyColor}`}>
          “{graduate.quote}”
        </p>
      )}
    </section>
  );

  const renderCountdownSection = () => (
    <section className={`py-8 px-6 sm:px-12 border-t ${hairline}`}>
      <CountdownTimer
        targetDate={ceremony.date}
        targetTime={ceremony.time}
        accentColor={accentColor}
        isDarkMode={isDarkMode}
        showLabel
      />
    </section>
  );

  const renderVenueSection = () => (
    <section className={`py-10 sm:py-12 px-5 sm:px-12 border-t ${hairline} ${textAlign}`}>
      <p
        className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-2"
        style={{ color: accentColor }}
      >
        Thời Gian & Địa Điểm
      </p>
      <h3 className={`editorial-h2 font-editorial font-bold mb-8 ${headingColor}`}>
        Thông Tin Buổi Lễ
      </h3>

      <div className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-y ${hairline} ${isDarkMode ? 'divide-white/10' : 'divide-stone-200/90'} text-left`}>
        <div className="py-5 md:pr-8 space-y-2">
          <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-semibold ${mutedColor}`}>
            <Calendar className="w-4 h-4" style={{ color: accentColor }} />
            <span>Thời gian</span>
          </div>
          <p className={`editorial-body font-semibold capitalize ${headingColor}`}>
            {formattedDate}
          </p>
          <p className={`editorial-body font-medium ${bodyColor}`}>
            Có mặt từ <span className="font-bold" style={{ color: accentColor }}>{ceremony.time || '07:30'}</span>
            {ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}
          </p>
        </div>

        <div className="py-5 md:pl-8 space-y-2">
          <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-semibold ${mutedColor}`}>
            <MapPin className="w-4 h-4" style={{ color: accentColor }} />
            <span>Địa điểm</span>
          </div>
          <p className={`editorial-body font-semibold ${headingColor}`}>
            {ceremony.venueName}
          </p>
          <p className={`text-sm sm:text-base leading-relaxed ${bodyColor}`}>
            {ceremony.address}
          </p>
        </div>
      </div>

      {ceremony.dressCode && (
        <p className={`mt-5 text-sm sm:text-base ${mutedColor}`}>
          Trang phục gợi ý: <span className={`font-semibold ${headingColor}`}>{ceremony.dressCode}</span>
        </p>
      )}

      <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ceremony.mapQuery || ceremony.address || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          <span>Xem chỉ đường</span>
          <ArrowUpRight className="w-4 h-4" />
        </a>

        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg text-sm font-semibold border transition-colors ${
            isDarkMode
              ? 'border-white/20 text-stone-100 hover:bg-white/5'
              : 'border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Thêm vào lịch</span>
        </a>
      </div>
    </section>
  );

  const renderTimelineSection = () => {
    if (!ceremony.timeline?.length) return null;
    return (
      <section className={`py-10 sm:py-12 px-6 sm:px-12 border-t ${hairline}`}>
        <div className={`mb-7 ${textAlign}`}>
          <p
            className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-2"
            style={{ color: accentColor }}
          >
            Chương Trình
          </p>
          <h3 className={`text-2xl font-editorial font-bold ${headingColor}`}>
            Lịch Trình Buổi Lễ
          </h3>
        </div>

        <ol className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-stone-200/80'}`}>
          {ceremony.timeline.map((step, idx) => (
            <li key={idx} className="py-4 flex items-baseline gap-5">
              <span
                className="w-16 shrink-0 text-sm font-mono font-semibold tabular-nums"
                style={{ color: accentColor }}
              >
                {step.time}
              </span>
              <div className="space-y-1">
                <div className={`text-base font-semibold ${headingColor}`}>{step.title}</div>
                {step.desc && <p className={`text-sm leading-relaxed ${mutedColor}`}>{step.desc}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  };

  const renderGallerySection = () => {
    if (!gallery?.length) return null;
    return (
      <section className={`py-10 sm:py-12 px-6 sm:px-12 border-t ${hairline}`}>
        <div className={`mb-7 ${textAlign}`}>
          <p
            className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-2"
            style={{ color: accentColor }}
          >
            Kỷ Niệm
          </p>
          <h3 className={`text-2xl font-editorial font-bold ${headingColor}`}>
            Khoảnh Khắc Thanh Xuân
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {gallery.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              className={`group relative overflow-hidden rounded-lg aspect-[4/3] border ${hairline} cursor-pointer text-left`}
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderRsvpSection = () => (
    <section className={`py-10 sm:py-12 px-6 sm:px-12 border-t ${hairline}`}>
      <div className={`mb-7 space-y-2 ${textAlign}`}>
        <p
          className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold"
          style={{ color: accentColor }}
        >
          Phản Hồi Tham Dự
        </p>
        <h3 className={`text-2xl font-editorial font-bold ${headingColor}`}>
          Xác Nhận Tham Dự
        </h3>
        <p className={`text-sm leading-relaxed max-w-sm ${alignCenter ? 'mx-auto' : ''} ${mutedColor}`}>
          Sự hiện diện của bạn là niềm vui lớn đối với {graduate.fullName || 'tân cử nhân'}.
        </p>
      </div>

      {rsvpSubmitted ? (
        <div className={`p-6 rounded-lg border text-center space-y-2 ${subtleSurface}`}>
          <div
            className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white"
            style={{ backgroundColor: accentColor }}
          >
            <Check className="w-5 h-5" />
          </div>
          <h4 className={`text-base font-semibold ${headingColor}`}>
            Đã ghi nhận phản hồi của bạn
          </h4>
          <p className={`text-sm leading-relaxed ${mutedColor}`}>
            {rsvpStatus === 'declined'
              ? `Cảm ơn ${currentGuest?.name || 'bạn'} đã phản hồi. Rất mong sẽ gặp lại bạn vào một dịp gần nhất.`
              : `Cảm ơn ${currentGuest?.name || 'bạn'} (${guestCount} người). Hẹn gặp bạn tại buổi lễ.`}
          </p>
        </div>
      ) : (
        <form onSubmit={handleRsvpSubmit} className="space-y-4 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRsvpStatus('confirmed')}
              className={`min-h-[44px] py-3 px-4 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                rsvpStatus === 'confirmed'
                  ? 'text-white border-transparent'
                  : `${subtleSurface} ${bodyColor} hover:border-stone-400`
              }`}
              style={rsvpStatus === 'confirmed' ? { backgroundColor: accentColor } : {}}
            >
              Sẽ tham dự
            </button>

            <button
              type="button"
              onClick={() => setRsvpStatus('declined')}
              className={`min-h-[44px] py-3 px-4 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                rsvpStatus === 'declined'
                  ? isDarkMode
                    ? 'bg-stone-200 text-stone-900 border-stone-200'
                    : 'bg-stone-800 text-white border-stone-800'
                  : `${subtleSurface} ${bodyColor} hover:border-stone-400`
              }`}
            >
              Rất tiếc bận mất rồi
            </button>
          </div>

          {rsvpStatus === 'confirmed' && (
            <div className="space-y-2 pt-1">
              <label className={`text-sm font-medium block ${mutedColor}`}>Số lượng người tham dự</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`min-h-[44px] py-2.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                      guestCount === num
                        ? 'text-white border-transparent'
                        : `${subtleSurface} ${bodyColor}`
                    }`}
                    style={guestCount === num ? { backgroundColor: accentColor } : {}}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[44px] py-3.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            Gửi xác nhận
          </button>
        </form>
      )}
    </section>
  );

  const renderGuestbookSection = () => (
    <section className={`py-10 sm:py-12 px-5 sm:px-10 border-t ${hairline}`}>
      <div className={`mb-7 space-y-2 ${textAlign}`}>
        <p
          className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold"
          style={{ color: accentColor }}
        >
          Lưu Bút
        </p>
        <h3 className={`text-2xl font-editorial font-bold ${headingColor}`}>
          Gửi Lời Chúc Mừng
        </h3>
        <p className={`text-sm ${mutedColor}`}>
          Lời nhắn của bạn sẽ được gửi riêng đến {graduate.fullName || 'tân cử nhân'}.
        </p>
      </div>

      <form onSubmit={handleSendWish} className="space-y-3.5 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Tên của bạn"
          value={wishName}
          onChange={(e) => setWishName(e.target.value)}
          className={`w-full min-h-[44px] px-4 py-3 rounded-lg border text-base transition-colors focus:outline-none ${inputStyle}`}
        />

        <textarea
          rows={3}
          placeholder="Viết vài dòng nhắn gửi..."
          value={wishMsg}
          onChange={(e) => setWishMsg(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border text-base resize-none transition-colors focus:outline-none ${inputStyle}`}
          required
        />

        <button
          type="submit"
          className="w-full min-h-[44px] py-3.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          Gửi lời chúc
        </button>

        {wishSentSuccess && (
          <p className="text-sm text-center pt-1 font-medium" style={{ color: accentColor }}>
            Đã gửi lời chúc thành công đến {graduate.fullName}.
          </p>
        )}
      </form>

      {/* Admin-only wishes wall or guest's own sent wishes */}
      {canViewWishes ? (
        <div className="mt-8 space-y-3 max-w-md mx-auto">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${mutedColor}`}>
            <Lock className="w-3.5 h-3.5" />
            <span>Sổ lưu bút quản trị ({wishes.length})</span>
          </div>
          {wishes.map((item) => (
            <div key={item.id} className={`p-4 rounded-lg border space-y-1.5 ${subtleSurface}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold ${headingColor}`}>{item.guestName}</span>
                <span className={`text-xs font-mono ${mutedColor}`}>{item.time}</span>
              </div>
              <p className={`text-sm leading-relaxed ${bodyColor}`}>“{item.message}”</p>
            </div>
          ))}
        </div>
      ) : (
        mySentWishes.length > 0 && (
          <div className="mt-6 space-y-2.5 max-w-md mx-auto">
            {mySentWishes.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border space-y-1.5 ${subtleSurface}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${headingColor}`}>{item.guestName}</span>
                  <span className={`text-xs ${mutedColor}`}>Đã gửi</span>
                </div>
                <p className={`text-sm leading-relaxed ${bodyColor}`}>“{item.message}”</p>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );

  // Ordered sections (stripping decorative fluff like fake music player & fake reactions)
  const orderedIds = sections
    .filter((s) => s.enabled && !['music', 'reactions', 'school'].includes(s.id))
    .map((s) => s.id);

  // Ensure hero always appears if school was enabled or hero is enabled
  if (!orderedIds.includes('hero') && isSectionEnabled('school')) {
    orderedIds.unshift('hero');
  }

  return (
    <div
      className={`min-h-screen flex-1 ${outerBg} transition-colors duration-300 pt-2 sm:pt-5 pb-8 sm:pb-12 px-4 safe-area-x safe-area-top safe-area-bottom font-sans`}
      style={outerLightStyle}
    >
      {!hasOpenedEnvelope && (
        <EnvelopeModal
          guest={currentGuest}
          graduate={graduate}
          theme={{ ...theme, mode: isDarkMode ? 'dark' : 'light' }}
          onOpen={() => setHasOpenedEnvelope(true)}
        />
      )}

      {/* Row 1: Return Bar (Trang sự kiện | Tên khách mời) - synced with active theme */}
      {onNavigateToHome && (
        <header
          className={`invitation-shell mb-2 flex items-center justify-between gap-3 transition-colors duration-300 ${
            isDarkMode ? 'text-stone-300' : 'text-slate-700'
          }`}
        >
          <button
            type="button"
            onClick={onNavigateToHome}
            className={`min-h-[44px] min-w-[44px] px-3 py-2 -ml-3 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
              isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
            <span>Trang sự kiện</span>
          </button>

          {currentGuest?.name && (
            <span
              className="text-xs sm:text-sm font-semibold truncate max-w-[180px] sm:max-w-[260px]"
              style={{ color: isDarkMode ? '#f5f5f4' : '#0f172a' }}
            >
              {currentGuest.name}
            </span>
          )}
        </header>
      )}

      {/* Row 2: Utility Strip above the invitation sheet (Thiệp mời | Tối / Phong bì / Lưu ảnh) */}
      <div className="invitation-shell mb-4 flex items-center justify-between gap-2">
        <span
          className="hidden sm:inline text-xs uppercase tracking-[0.14em] font-semibold"
          style={{ color: accentColor }}
        >
          Thiệp mời
        </span>

        <div className="flex flex-wrap items-center justify-end w-full sm:w-auto gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
              isDarkMode
                ? 'bg-white/[0.04] text-stone-100 hover:bg-white/[0.09]'
                : 'bg-white/90 backdrop-blur-md text-slate-800 hover:bg-white shadow-xs'
            }`}
            style={{
              borderColor: isDarkMode ? `${accentColor}40` : `${accentColor}2e`
            }}
            title={isDarkMode ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" style={{ color: accentColor }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: accentColor }} />
            )}
            <span>{isDarkMode ? 'Sáng' : 'Tối'}</span>
          </button>

          <button
            type="button"
            onClick={() => setHasOpenedEnvelope(false)}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
              isDarkMode
                ? 'bg-white/[0.04] text-stone-100 hover:bg-white/[0.09]'
                : 'bg-white/90 backdrop-blur-md text-slate-800 hover:bg-white shadow-xs'
            }`}
            style={{
              borderColor: isDarkMode ? `${accentColor}40` : `${accentColor}2e`
            }}
            title="Xem lại phong bì"
          >
            <Mail className="w-4 h-4" style={{ color: accentColor }} />
            <span>Phong bì</span>
          </button>

          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: accentColor }}
              title="Tải ảnh thiệp mời"
            >
              <Download className="w-4 h-4" />
              <span>Lưu ảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* Single Continuous Fine-Stationery Invitation Sheet */}
      <article
        className={`relative invitation-shell rounded-2xl overflow-hidden transition-all duration-300 ${sheetBg}`}
        style={sheetStyle}
      >
        {/* Top tone accent smoothed into hero */}
        <div
          className="h-1 w-full opacity-85"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 30%, ${secondaryColor} 70%, transparent 100%)`
          }}
        />

        {(() => {
          const rendered = [];
          for (let i = 0; i < orderedIds.length; i++) {
            const sectionId = orderedIds[i];
            const nextId = orderedIds[i + 1];
            if (
              (sectionId === 'rsvp' && nextId === 'guestbook') ||
              (sectionId === 'guestbook' && nextId === 'rsvp')
            ) {
              rendered.push(
                <div
                  key={`${sectionId}-${nextId}`}
                  className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x ${
                    isDarkMode ? 'divide-white/10' : 'divide-stone-200/80'
                  }`}
                >
                  {sectionId === 'rsvp' ? renderRsvpSection() : renderGuestbookSection()}
                  {nextId === 'guestbook' ? renderGuestbookSection() : renderRsvpSection()}
                </div>
              );
              i++;
              continue;
            }
            switch (sectionId) {
              case 'hero':
                rendered.push(<React.Fragment key="hero">{renderHeroSection()}</React.Fragment>);
                break;
              case 'countdown':
                rendered.push(<React.Fragment key="countdown">{renderCountdownSection()}</React.Fragment>);
                break;
              case 'venue':
                rendered.push(<React.Fragment key="venue">{renderVenueSection()}</React.Fragment>);
                break;
              case 'timeline':
                rendered.push(<React.Fragment key="timeline">{renderTimelineSection()}</React.Fragment>);
                break;
              case 'gallery':
                rendered.push(<React.Fragment key="gallery">{renderGallerySection()}</React.Fragment>);
                break;
              case 'rsvp':
                rendered.push(<React.Fragment key="rsvp">{renderRsvpSection()}</React.Fragment>);
                break;
              case 'guestbook':
                rendered.push(<React.Fragment key="guestbook">{renderGuestbookSection()}</React.Fragment>);
                break;
              default:
                break;
            }
          }
          return rendered;
        })()}

        {/* Minimal Stationery Colophon Footer */}
        <footer className={`py-6 px-6 border-t ${hairline} text-center space-y-1.5`}>
          <p className={`text-sm italic ${mutedColor}`}>
            Trân trọng cảm ơn sự hiện diện của bạn
          </p>
          {(currentGuest?.inviteCode || graduate.classBatch) && (
            <p className={`text-xs font-mono tracking-[0.08em] uppercase ${mutedColor} opacity-80`}>
              {joinCleanParts([graduate.classBatch, currentGuest?.inviteCode])}
            </p>
          )}
        </footer>
      </article>

      {/* Clean Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-stone-200 hover:text-white cursor-pointer"
              aria-label="Đóng ảnh"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="w-full h-auto rounded-lg max-h-[80vh] object-contain mx-auto"
            />
            {selectedPhoto.title && (
              <p className="text-center text-sm text-stone-200 mt-3">{selectedPhoto.title}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
