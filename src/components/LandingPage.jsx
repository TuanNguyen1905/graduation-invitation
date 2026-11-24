import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  ArrowUpRight,
  CalendarPlus,
  Lock
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { createGoogleCalendarUrl } from '../utils/calendar';
import { fetchGuestInvitationFromApi } from '../services/api';
import { joinCleanParts } from '../utils/inviteHelper';

export default function LandingPage({
  invitation,
  onOpenGuestInvite,
  onAddWish
}) {
  const { graduate = {}, ceremony = {}, theme } = invitation || {};
  const accentColor = theme?.accentColor || '#1e3a5f';
  const secondaryColor = theme?.secondaryColor || '#38bdf8';

  // Search / Lookup state (chỉ tra cứu bằng mã thiệp qua server)
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Wish form state (private submission, only shows user's own sent wishes in current session)
  const [wishName, setWishName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [isWishSent, setIsWishSent] = useState(false);
  const [mySentWishes, setMySentWishes] = useState([]);

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

  const handleLookup = async (e) => {
    e?.preventDefault();
    const code = searchQuery.trim();
    if (!code) {
      setLookupError('Vui lòng nhập mã thiệp mời của bạn (ví dụ: INV-...).');
      return;
    }

    setLookupError('');
    setIsLookingUp(true);
    const result = await fetchGuestInvitationFromApi(code);
    setIsLookingUp(false);

    if (result?.found) {
      const matchedCode = result.data?.guest?.invite_code || code;
      onOpenGuestInvite(matchedCode);
    } else {
      setLookupError(result?.error || 'Không tìm thấy thiệp mời với mã này. Vui lòng kiểm tra lại.');
    }
  };

  const handleSendWish = (e) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) return;

    const payload = {
      guestName: wishName.trim(),
      relationship: 'Khách mời',
      message: wishMessage.trim(),
      emoji: '🎓'
    };

    if (onAddWish) {
      onAddWish(payload);
    }

    setMySentWishes((prev) => [
      { id: `my-wish-${Date.now()}`, ...payload, time: 'Vừa gửi' },
      ...prev
    ]);
    setIsWishSent(true);
    setWishMessage('');
    setTimeout(() => setIsWishSent(false), 4500);
  };

  const showTimeline =
    Array.isArray(ceremony.timeline) &&
    ceremony.timeline.length > 0 &&
    (invitation?.layout?.sections?.find((s) => s.id === 'timeline')?.enabled ?? false);

  return (
    <div
      className="min-h-screen text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900"
      style={{
        backgroundColor: '#f3f5f9',
        backgroundImage: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 65%), radial-gradient(circle at 100% 100%, ${secondaryColor}12 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)`
      }}
    >
      {/* Minimal Editorial Header (safe-area + landscape compact <=12% height + 44px touch targets) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b safe-area-top" style={{ borderColor: `${accentColor}20` }}>
        <div className="invitation-shell px-4 sm:px-8 h-14 sm:h-16 landscape-compact-header-inner flex items-center justify-between gap-2 sm:gap-4">
          <a href="#top" className="font-editorial text-sm sm:text-lg font-bold tracking-tight text-slate-900 truncate min-h-[44px] inline-flex items-center">
            {graduate.fullName || 'Lễ Tốt Nghiệp 2026'}
          </a>

          <nav className="hidden sm:flex items-center gap-1 text-sm font-medium text-slate-700">
            <a href="#ceremony" className="inline-flex items-center min-h-[44px] px-3 rounded-lg hover:bg-slate-100/70 hover:text-slate-900 transition-colors">Thông tin</a>
            <a href="#lookup" className="inline-flex items-center min-h-[44px] px-3 rounded-lg hover:bg-slate-100/70 hover:text-slate-900 transition-colors">Mở thiệp</a>
            <a href="#wishes" className="inline-flex items-center min-h-[44px] px-3 rounded-lg hover:bg-slate-100/70 hover:text-slate-900 transition-colors">Lời chúc</a>
          </nav>

          <a
            href="#lookup"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <span>Mở thiệp</span>
          </a>
        </div>
      </header>

      <main id="top" className="invitation-shell px-4 sm:px-8 py-8 sm:py-14 space-y-12 safe-area-bottom">
        {/* Main Editorial Invitation Card */}
        <article
          className="bg-white border rounded-2xl shadow-[0_25px_70px_-12px_rgba(15,23,42,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.06] overflow-hidden"
          style={{ borderColor: `${accentColor}38` }}
        >
          <div
            className="h-1.5 w-full"
            style={{ background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})` }}
          />

          {/* Hero Section */}
          <section
            className="px-5 sm:px-14 pt-10 sm:pt-16 pb-10 text-center"
            style={{
              background: `linear-gradient(180deg, ${accentColor}0c 0%, #ffffff 42%)`
            }}
          >
            {graduate.school && (
              <p className="school-balanced uppercase tracking-[0.1em] font-semibold mx-auto max-w-md" style={{ color: accentColor }}>
                {graduate.school}
              </p>
            )}
            {(graduate.faculty || graduate.classBatch) && (
              <p className="text-sm text-slate-600 mt-2 text-balance">
                {joinCleanParts([graduate.faculty, graduate.classBatch])}
              </p>
            )}

            <div className="mt-7 sm:mt-8 space-y-3">
              <p className="text-xs sm:text-sm uppercase tracking-[0.14em] text-slate-600 font-semibold">
                Trân Trọng Kính Mời
              </p>
              <h1 className="editorial-h1 font-editorial font-bold tracking-tight text-slate-900 leading-tight mx-auto">
                Lễ Tốt Nghiệp Cử Nhân
              </h1>
              <div className="w-12 h-px mx-auto" style={{ backgroundColor: accentColor }} />
            </div>

            {/* Clean Editorial Portrait */}
            {graduate.avatarUrl && (
              <div className="my-8 sm:my-10 flex justify-center">
                <figure className="p-2.5 bg-white border shadow-xs max-w-[240px]" style={{ borderColor: `${accentColor}28` }}>
                  <div className="w-48 h-56 sm:w-52 sm:h-64 overflow-hidden bg-slate-100">
                    <img
                      src={graduate.avatarUrl}
                      alt={graduate.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </figure>
              </div>
            )}

            <div className="space-y-2">
              <h2 className="editorial-h2 font-editorial font-bold uppercase tracking-tight text-slate-900">
                {graduate.fullName}
              </h2>
              {(graduate.degree || graduate.honor) && (
                <p className="editorial-body font-semibold" style={{ color: accentColor }}>
                  {joinCleanParts([graduate.degree, graduate.honor])}
                </p>
              )}
            </div>

            {graduate.quote && (
              <p className="mt-6 editorial-body italic text-slate-700 leading-relaxed max-w-xl mx-auto">
                “{graduate.quote}”
              </p>
            )}

            <div className="mt-10">
              <CountdownTimer
                targetDate={ceremony.date}
                targetTime={ceremony.time}
                accentColor={accentColor}
                isDarkMode={false}
                showLabel
              />
            </div>
          </section>

          {/* Ceremony Time & Venue */}
          <section id="ceremony" className="px-5 sm:px-14 py-10 border-t border-slate-200 text-center">
            <p className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-2" style={{ color: accentColor }}>
              Thời Gian & Địa Điểm
            </p>
            <h3 className="editorial-h2 font-editorial font-bold text-slate-900 mb-8">
              Thông Tin Buổi Lễ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-y border-slate-200 text-left">
              <div className="py-5 md:pr-8 space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">
                  <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                  <span>Thời gian</span>
                </div>
                <p className="editorial-body font-semibold text-slate-900 capitalize">{formattedDate}</p>
                <p className="editorial-body text-slate-800 font-medium">
                  Có mặt từ <span className="font-bold" style={{ color: accentColor }}>{ceremony.time || '07:30'}</span>
                  {ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}
                </p>
              </div>

              <div className="py-5 md:pl-8 space-y-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-semibold text-slate-600">
                  <MapPin className="w-4 h-4" style={{ color: accentColor }} />
                  <span>Địa điểm</span>
                </div>
                <p className="editorial-body font-semibold text-slate-900">{ceremony.venueName}</p>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{ceremony.address}</p>
              </div>
            </div>

            {ceremony.dressCode && (
              <p className="mt-5 text-sm sm:text-base text-slate-600">
                Trang phục gợi ý: <span className="font-semibold text-slate-900">{ceremony.dressCode}</span>
              </p>
            )}

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(ceremony.mapQuery || ceremony.address || '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <span>Xem chỉ đường</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={googleCalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Thêm vào lịch</span>
              </a>
            </div>
          </section>

          {/* Optional Ceremony Timeline (only if enabled in Admin layout) */}
          {showTimeline && (
            <section id="timeline" className="px-5 sm:px-14 py-10 border-t border-slate-200">
              <div className="text-center mb-7">
                <p className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold mb-2" style={{ color: accentColor }}>
                  Chương Trình
                </p>
                <h3 className="editorial-h2 font-editorial font-bold text-slate-900">
                  Lịch Trình Buổi Lễ
                </h3>
              </div>

              <ol className="divide-y divide-slate-200/80 max-w-xl mx-auto">
                {ceremony.timeline.map((step, idx) => (
                  <li key={idx} className="py-4 flex items-baseline gap-4 sm:gap-5">
                    <span className="w-16 shrink-0 text-sm sm:text-base font-mono font-semibold tabular-nums" style={{ color: accentColor }}>
                      {step.time}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <div className="editorial-body font-semibold text-slate-900">{step.title}</div>
                      {step.desc && <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Lookup + Wishes: 2 columns on Tablet/Desktop (md+), 1 column on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-t" style={{ borderColor: `${accentColor}22` }}>
            {/* Guest Invitation Lookup */}
            <section
              id="lookup"
              className="px-5 sm:px-10 py-10 flex flex-col justify-center"
              style={{ backgroundColor: `${accentColor}08` }}
            >
              <div className="max-w-md mx-auto w-full text-center space-y-2.5">
                <p className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold" style={{ color: accentColor }}>
                  Thiệp Cá Nhân Hóa
                </p>
                <h3 className="text-2xl font-editorial font-bold text-slate-900 text-balance">
                  Mở Thiệp Mời Của Bạn
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nhập mã thiệp mời đã nhận qua tin nhắn hoặc email để mở thiệp cá nhân và xác nhận tham dự.
                </p>

                <form onSubmit={handleLookup} className="pt-3 flex flex-col gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setLookupError('');
                      }}
                      placeholder="Nhập mã thiệp mời (VD: INV-...)"
                      className="w-full min-h-[44px] pl-10 pr-4 py-3 rounded-lg bg-white border border-slate-300 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLookingUp}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-3 rounded-lg disabled:opacity-60 text-white text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span>{isLookingUp ? 'Đang kiểm tra...' : 'Mở thiệp'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {lookupError && (
                  <p className="text-sm text-rose-700 font-medium pt-1">{lookupError}</p>
                )}
              </div>
            </section>

            {/* Private Wishes Form */}
            <section id="wishes" className="px-5 sm:px-10 py-10 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold" style={{ color: accentColor }}>
                    Lưu Bút
                  </p>
                  <h3 className="text-2xl font-editorial font-bold text-slate-900 text-balance">
                    Gửi Lời Chúc Mừng
                  </h3>
                  <p className="text-sm text-slate-600 inline-flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Lời chúc được gửi riêng tư đến {graduate.fullName}.</span>
                  </p>
                </div>

                <form onSubmit={handleSendWish} className="space-y-3.5">
                  <input
                    type="text"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    placeholder="Tên của bạn"
                    required
                    className="w-full min-h-[44px] px-4 py-3 rounded-lg bg-white border border-slate-300 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
                  />

                  <textarea
                    rows={3}
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                    placeholder="Viết vài dòng nhắn gửi chúc mừng..."
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-base text-slate-900 placeholder:text-slate-500 resize-none focus:outline-none focus:border-slate-700"
                  />

                  <button
                    type="submit"
                    className="w-full min-h-[44px] py-3.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    Gửi lời chúc
                  </button>

                  {isWishSent && (
                    <p className="text-sm text-center font-medium pt-1" style={{ color: accentColor }}>
                      Đã gửi lời chúc của bạn thành công.
                    </p>
                  )}
                </form>

                {mySentWishes.length > 0 && (
                  <div className="mt-6 space-y-2.5">
                    {mySentWishes.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-stone-900">{item.guestName}</span>
                          <span className="text-xs text-stone-500">Đã gửi</span>
                        </div>
                        <p className="text-sm text-stone-700 leading-relaxed">“{item.message}”</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <footer className="py-6 px-6 border-t border-stone-200/80 text-center">
            <p className="text-sm text-stone-600">
              {graduate.fullName} · {graduate.school}
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
