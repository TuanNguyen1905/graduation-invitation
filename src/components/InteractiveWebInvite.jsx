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
  ArrowUpRight
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import EnvelopeModal from './EnvelopeModal';
import { createGoogleCalendarUrl } from '../utils/calendar';
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
    ? new Date(ceremony.date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  // Editorial Fine-Stationery Palette Tokens
  const outerBg = isDarkMode ? 'bg-[#0e1014] text-stone-100' : 'bg-[#f1ede6] text-stone-900';
  const sheetBg = isDarkMode
    ? 'bg-[#161920] border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.45)]'
    : 'bg-[#fdfbf7] border-stone-300/75 shadow-[0_20px_60px_-20px_rgba(28,25,23,0.12)]';
  const hairline = isDarkMode ? 'border-white/10' : 'border-stone-200/90';
  const headingColor = isDarkMode ? 'text-stone-50' : 'text-stone-900';
  const bodyColor = isDarkMode ? 'text-stone-300' : 'text-stone-600';
  const mutedColor = isDarkMode ? 'text-stone-400' : 'text-stone-500';
  const subtleSurface = isDarkMode
    ? 'bg-white/[0.03] border-white/10'
    : 'bg-[#f6f3ec]/70 border-stone-200/80';
  const inputStyle = isDarkMode
    ? 'bg-[#101218] border-white/15 text-stone-100 placeholder:text-stone-500 focus:border-stone-400'
    : 'bg-white border-stone-300/80 text-stone-900 placeholder:text-stone-400 focus:border-stone-600';

  const isSectionEnabled = (id) => {
    const found = sections.find((s) => s.id === id);
    return found ? Boolean(found.enabled) : false;
  };

  /* ── SECTION RENDERERS (Clean, Fine-Stationery Rhythm) ────────── */

  const renderHeroSection = () => (
    <section className={`py-10 sm:py-14 px-6 sm:px-12 ${textAlign}`}>
      {/* School & Faculty masthead */}
      {(graduate.school || graduate.faculty) && (
        <div className="mb-8 space-y-1">
          {graduate.school && (
            <p
              className="text-[11px] uppercase tracking-[0.24em] font-semibold"
              style={{ color: accentColor }}
            >
              {graduate.school}
            </p>
          )}
          {(graduate.faculty || graduate.classBatch) && (
            <p className={`text-[11px] tracking-[0.12em] ${mutedColor}`}>
              {[graduate.faculty, graduate.classBatch].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Invitation Masthead */}
      <div className="space-y-3 mb-9">
        <p className={`text-[11px] uppercase tracking-[0.26em] font-medium ${mutedColor}`}>
          Thư Mời Tham Dự
        </p>
        <h1 className={`text-3xl sm:text-4xl font-editorial font-semibold tracking-tight leading-tight ${headingColor}`}>
          Lễ Tốt Nghiệp Cử Nhân
        </h1>
        <div
          className={`w-12 h-px ${alignCenter ? 'mx-auto' : ''}`}
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Personalized Recipient Salutation */}
      <div className={`py-6 mb-9 border-y ${hairline} space-y-2`}>
        <p className={`text-[11px] uppercase tracking-[0.22em] font-medium ${mutedColor}`}>
          {currentGuest?.salutation || 'Trân trọng kính mời'}
        </p>
        <div className={`text-2xl sm:text-[26px] font-editorial font-semibold ${headingColor}`}>
          {currentGuest?.name || 'Quý Khách'}
        </div>
        {currentGuest?.customNote && (
          <p className={`text-sm sm:text-base italic font-garamond leading-relaxed max-w-md ${alignCenter ? 'mx-auto' : ''} pt-1 ${bodyColor}`}>
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
              <figcaption className={`pt-3 text-center text-xs font-editorial italic ${mutedColor}`}>
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
        <p className={`text-[11px] uppercase tracking-[0.22em] ${mutedColor}`}>
          Tân Cử Nhân
        </p>
        <h2 className={`text-2xl sm:text-3xl font-editorial font-semibold tracking-tight uppercase ${headingColor}`}>
          {graduate.fullName}
        </h2>
        {(graduate.degree || graduate.honor) && (
          <p className="text-sm font-medium" style={{ color: accentColor }}>
            {[graduate.degree, graduate.honor].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {graduate.quote && (
        <p className={`mt-6 text-sm sm:text-base italic font-garamond leading-relaxed max-w-md ${alignCenter ? 'mx-auto' : ''} ${bodyColor}`}>
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
    <section className={`py-10 sm:py-12 px-6 sm:px-12 border-t ${hairline} ${textAlign}`}>
      <p
        className="text-[11px] uppercase tracking-[0.24em] font-semibold mb-2"
        style={{ color: accentColor }}
      >
        Thời Gian & Địa Điểm
      </p>
      <h3 className={`text-xl sm:text-2xl font-editorial font-semibold mb-8 ${headingColor}`}>
        Thông Tin Buổi Lễ
      </h3>

      <div className={`grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-y ${hairline} ${isDarkMode ? 'divide-white/10' : 'divide-stone-200/90'} text-left`}>
        <div className="py-5 sm:pr-6 space-y-1.5">
          <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold ${mutedColor}`}>
            <Calendar className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span>Thời gian</span>
          </div>
          <p className={`text-sm font-semibold capitalize ${headingColor}`}>
            {formattedDate}
          </p>
          <p className={`text-xs ${bodyColor}`}>
            {ceremony.time}{ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}
          </p>
        </div>

        <div className="py-5 sm:pl-6 space-y-1.5">
          <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold ${mutedColor}`}>
            <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span>Địa điểm</span>
          </div>
          <p className={`text-sm font-semibold ${headingColor}`}>
            {ceremony.venueName}
          </p>
          <p className={`text-xs leading-relaxed ${bodyColor}`}>
            {ceremony.address}
          </p>
        </div>
      </div>

      {ceremony.dressCode && (
        <p className={`mt-5 text-xs ${mutedColor}`}>
          Trang phục gợi ý: <span className={`font-medium ${headingColor}`}>{ceremony.dressCode}</span>
        </p>
      )}

      <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ceremony.mapQuery || ceremony.address || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs uppercase tracking-[0.14em] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          <span>Xem chỉ đường</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs uppercase tracking-[0.14em] font-semibold border transition-colors ${
            isDarkMode
              ? 'border-white/20 text-stone-200 hover:bg-white/5'
              : 'border-stone-300 text-stone-700 hover:bg-stone-100'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
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
            className="text-[11px] uppercase tracking-[0.24em] font-semibold mb-2"
            style={{ color: accentColor }}
          >
            Chương Trình
          </p>
          <h3 className={`text-xl sm:text-2xl font-editorial font-semibold ${headingColor}`}>
            Lịch Trình Buổi Lễ
          </h3>
        </div>

        <ol className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-stone-200/80'}`}>
          {ceremony.timeline.map((step, idx) => (
            <li key={idx} className="py-4 flex items-baseline gap-5">
              <span
                className="w-14 shrink-0 text-xs font-mono font-semibold tabular-nums"
                style={{ color: accentColor }}
              >
                {step.time}
              </span>
              <div className="space-y-1">
                <div className={`text-sm font-semibold ${headingColor}`}>{step.title}</div>
                {step.desc && <p className={`text-xs leading-relaxed ${mutedColor}`}>{step.desc}</p>}
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
            className="text-[11px] uppercase tracking-[0.24em] font-semibold mb-2"
            style={{ color: accentColor }}
          >
            Kỷ Niệm
          </p>
          <h3 className={`text-xl sm:text-2xl font-editorial font-semibold ${headingColor}`}>
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
          className="text-[11px] uppercase tracking-[0.24em] font-semibold"
          style={{ color: accentColor }}
        >
          Phản Hồi Tham Dự
        </p>
        <h3 className={`text-xl sm:text-2xl font-editorial font-semibold ${headingColor}`}>
          Xác Nhận Tham Dự
        </h3>
        <p className={`text-xs leading-relaxed max-w-sm ${alignCenter ? 'mx-auto' : ''} ${mutedColor}`}>
          Sự hiện diện của bạn là niềm vui lớn đối với {graduate.fullName || 'tân cử nhân'}.
        </p>
      </div>

      {rsvpSubmitted ? (
        <div className={`p-6 rounded-lg border text-center space-y-2 ${subtleSurface}`}>
          <div
            className="w-9 h-9 rounded-full mx-auto flex items-center justify-center text-white"
            style={{ backgroundColor: accentColor }}
          >
            <Check className="w-4 h-4" />
          </div>
          <h4 className={`text-sm font-semibold ${headingColor}`}>
            Đã ghi nhận phản hồi của bạn
          </h4>
          <p className={`text-xs ${mutedColor}`}>
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
              className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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
              className={`py-3 px-4 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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
              <label className={`text-xs block ${mutedColor}`}>Số lượng người tham dự</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
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
            className="w-full py-3 rounded-lg text-xs uppercase tracking-[0.16em] font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            Gửi xác nhận
          </button>
        </form>
      )}
    </section>
  );

  const renderGuestbookSection = () => (
    <section className={`py-10 sm:py-12 px-6 sm:px-12 border-t ${hairline}`}>
      <div className={`mb-7 space-y-2 ${textAlign}`}>
        <p
          className="text-[11px] uppercase tracking-[0.24em] font-semibold"
          style={{ color: accentColor }}
        >
          Lưu Bút
        </p>
        <h3 className={`text-xl sm:text-2xl font-editorial font-semibold ${headingColor}`}>
          Gửi Lời Chúc Mừng
        </h3>
        <p className={`text-xs ${mutedColor}`}>
          Lời nhắn của bạn sẽ được gửi riêng đến {graduate.fullName || 'tân cử nhân'}.
        </p>
      </div>

      <form onSubmit={handleSendWish} className="space-y-3 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Tên của bạn"
          value={wishName}
          onChange={(e) => setWishName(e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none ${inputStyle}`}
        />

        <textarea
          rows={3}
          placeholder="Viết vài dòng nhắn gửi..."
          value={wishMsg}
          onChange={(e) => setWishMsg(e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm resize-none transition-colors focus:outline-none ${inputStyle}`}
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg text-xs uppercase tracking-[0.16em] font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          Gửi lời chúc
        </button>

        {wishSentSuccess && (
          <p className={`text-xs text-center pt-1 font-medium`} style={{ color: accentColor }}>
            Đã gửi lời chúc thành công đến {graduate.fullName}.
          </p>
        )}
      </form>

      {/* Admin-only wishes wall or guest's own sent wishes */}
      {canViewWishes ? (
        <div className="mt-8 space-y-3 max-w-md mx-auto">
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${mutedColor}`}>
            <Lock className="w-3.5 h-3.5" />
            <span>Sổ lưu bút quản trị ({wishes.length})</span>
          </div>
          {wishes.map((item) => (
            <div key={item.id} className={`p-4 rounded-lg border space-y-1 ${subtleSurface}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${headingColor}`}>{item.guestName}</span>
                <span className={`text-[10px] font-mono ${mutedColor}`}>{item.time}</span>
              </div>
              <p className={`text-xs leading-relaxed ${bodyColor}`}>“{item.message}”</p>
            </div>
          ))}
        </div>
      ) : (
        mySentWishes.length > 0 && (
          <div className="mt-6 space-y-2.5 max-w-md mx-auto">
            {mySentWishes.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border space-y-1 ${subtleSurface}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${headingColor}`}>{item.guestName}</span>
                  <span className={`text-[10px] ${mutedColor}`}>Đã gửi</span>
                </div>
                <p className={`text-xs leading-relaxed ${bodyColor}`}>“{item.message}”</p>
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
    <div className={`min-h-screen ${outerBg} transition-colors duration-300 py-6 sm:py-10 px-4 font-sans`}>
      {!hasOpenedEnvelope && (
        <EnvelopeModal
          guest={currentGuest}
          graduate={graduate}
          theme={{ ...theme, mode: isDarkMode ? 'dark' : 'light' }}
          onOpen={() => setHasOpenedEnvelope(true)}
        />
      )}

      {/* Minimal Utility Strip above the invitation sheet */}
      <div className="max-w-xl mx-auto mb-4 flex items-center justify-between gap-3">
        <span className={`text-[11px] uppercase tracking-[0.2em] font-medium ${mutedColor}`}>
          Thiệp mời
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'border-white/15 text-stone-300 hover:bg-white/5'
                : 'border-stone-300/80 bg-white/70 text-stone-700 hover:bg-white'
            }`}
            title={isDarkMode ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDarkMode ? 'Sáng' : 'Tối'}</span>
          </button>

          <button
            type="button"
            onClick={() => setHasOpenedEnvelope(false)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'border-white/15 text-stone-300 hover:bg-white/5'
                : 'border-stone-300/80 bg-white/70 text-stone-700 hover:bg-white'
            }`}
            title="Xem lại phong bì"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phong bì</span>
          </button>

          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                isDarkMode
                  ? 'border-white/15 text-stone-300 hover:bg-white/5'
                  : 'border-stone-300/80 bg-white/70 text-stone-700 hover:bg-white'
              }`}
              title="Tải ảnh thiệp mời"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lưu ảnh</span>
            </button>
          )}
        </div>
      </div>

      {/* Single Continuous Fine-Stationery Invitation Sheet */}
      <article className={`relative max-w-xl mx-auto rounded-xl border overflow-hidden ${sheetBg}`}>
        {/* Subtle top hairline accent */}
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

        {orderedIds.map((sectionId) => {
          switch (sectionId) {
            case 'hero':
              return <React.Fragment key="hero">{renderHeroSection()}</React.Fragment>;
            case 'countdown':
              return <React.Fragment key="countdown">{renderCountdownSection()}</React.Fragment>;
            case 'venue':
              return <React.Fragment key="venue">{renderVenueSection()}</React.Fragment>;
            case 'timeline':
              return <React.Fragment key="timeline">{renderTimelineSection()}</React.Fragment>;
            case 'gallery':
              return <React.Fragment key="gallery">{renderGallerySection()}</React.Fragment>;
            case 'rsvp':
              return <React.Fragment key="rsvp">{renderRsvpSection()}</React.Fragment>;
            case 'guestbook':
              return <React.Fragment key="guestbook">{renderGuestbookSection()}</React.Fragment>;
            default:
              return null;
          }
        })}

        {/* Minimal Stationery Colophon Footer */}
        <footer className={`py-6 px-6 border-t ${hairline} text-center space-y-1`}>
          <p className={`text-xs font-editorial italic ${mutedColor}`}>
            Trân trọng cảm ơn sự hiện diện của bạn
          </p>
          {(currentGuest?.inviteCode || graduate.classBatch) && (
            <p className={`text-[10px] font-mono tracking-[0.16em] uppercase ${mutedColor} opacity-75`}>
              {[graduate.classBatch, currentGuest?.inviteCode].filter(Boolean).join(' · ')}
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
              className="absolute -top-10 right-0 p-2 text-stone-300 hover:text-white cursor-pointer"
              aria-label="Đóng ảnh"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="w-full h-auto rounded-lg max-h-[80vh] object-contain mx-auto"
            />
            {selectedPhoto.title && (
              <p className="text-center text-xs text-stone-300 mt-3">{selectedPhoto.title}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
