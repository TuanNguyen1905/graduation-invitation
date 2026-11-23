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

export default function LandingPage({
  invitation,
  onOpenGuestInvite,
  onAddWish
}) {
  const { graduate = {}, ceremony = {} } = invitation || {};

  // Search / Lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupError, setLookupError] = useState('');

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
    ? new Date(ceremony.date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const handleLookup = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setLookupError('Vui lòng nhập họ tên hoặc mã thiệp mời của bạn.');
      return;
    }

    setLookupError('');
    const guests = invitation?.guests || [];
    const matched = guests.find(
      (g) =>
        (g.inviteCode && g.inviteCode.toUpperCase() === query.toUpperCase()) ||
        (g.id && g.id.toLowerCase() === query.toLowerCase()) ||
        (g.name && g.name.toLowerCase().includes(query.toLowerCase()))
    );

    if (matched) {
      onOpenGuestInvite(matched.inviteCode || matched.id);
    } else {
      onOpenGuestInvite(query);
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
    <div className="min-h-screen bg-[#f4f1ea] text-stone-900 font-sans selection:bg-stone-200 selection:text-stone-900">
      {/* Minimal Editorial Header */}
      <header className="sticky top-0 z-40 bg-[#f4f1ea]/90 backdrop-blur-md border-b border-stone-200/90">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <a href="#top" className="font-editorial text-sm sm:text-base font-semibold tracking-tight text-stone-900 truncate">
            {graduate.fullName || 'Lễ Tốt Nghiệp 2026'}
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-stone-600">
            <a href="#ceremony" className="hover:text-stone-900 transition-colors">Thông tin</a>
            <a href="#lookup" className="hover:text-stone-900 transition-colors">Mở thiệp</a>
            <a href="#wishes" className="hover:text-stone-900 transition-colors">Lời chúc</a>
          </nav>

          <a
            href="#lookup"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs font-medium transition-colors shrink-0"
          >
            <span>Mở thiệp</span>
          </a>
        </div>
      </header>

      <main id="top" className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-12">
        {/* Main Editorial Invitation Card */}
        <article className="bg-[#fdfbf7] border border-stone-300/80 rounded-xl shadow-[0_20px_60px_-20px_rgba(28,25,23,0.1)] overflow-hidden">
          <div className="h-1 bg-[#1e3a5f]" />

          {/* Hero Section */}
          <section className="px-6 sm:px-14 pt-12 sm:pt-16 pb-10 text-center">
            {graduate.school && (
              <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-[#1e3a5f]">
                {graduate.school}
              </p>
            )}
            {(graduate.faculty || graduate.classBatch) && (
              <p className="text-xs text-stone-500 mt-1.5 tracking-wide">
                {[graduate.faculty, graduate.classBatch].filter(Boolean).join(' · ')}
              </p>
            )}

            <div className="mt-8 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.26em] text-stone-500 font-medium">
                Trân Trọng Kính Mời
              </p>
              <h1 className="text-3xl sm:text-5xl font-editorial font-semibold tracking-tight text-stone-900 leading-tight">
                Lễ Tốt Nghiệp Cử Nhân
              </h1>
              <div className="w-12 h-px bg-[#1e3a5f] mx-auto" />
            </div>

            {/* Clean Editorial Portrait */}
            {graduate.avatarUrl && (
              <div className="my-10 flex justify-center">
                <figure className="p-2.5 bg-white border border-stone-200/90 shadow-xs max-w-[240px]">
                  <div className="w-48 h-56 sm:w-52 sm:h-64 overflow-hidden bg-stone-100">
                    <img
                      src={graduate.avatarUrl}
                      alt={graduate.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </figure>
              </div>
            )}

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-editorial font-semibold uppercase tracking-tight text-stone-900">
                {graduate.fullName}
              </h2>
              {(graduate.degree || graduate.honor) && (
                <p className="text-sm font-medium text-[#1e3a5f]">
                  {[graduate.degree, graduate.honor].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {graduate.quote && (
              <p className="mt-6 text-base italic font-garamond text-stone-600 leading-relaxed max-w-lg mx-auto">
                “{graduate.quote}”
              </p>
            )}

            <div className="mt-10">
              <CountdownTimer
                targetDate={ceremony.date}
                targetTime={ceremony.time}
                accentColor="#1e3a5f"
                isDarkMode={false}
                showLabel
              />
            </div>
          </section>

          {/* Ceremony Time & Venue */}
          <section id="ceremony" className="px-6 sm:px-14 py-10 border-t border-stone-200/90 text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-[#1e3a5f] mb-2">
              Thời Gian & Địa Điểm
            </p>
            <h3 className="text-xl sm:text-2xl font-editorial font-semibold text-stone-900 mb-8">
              Thông Tin Buổi Lễ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border-y border-stone-200 text-left">
              <div className="py-5 sm:pr-7 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-500">
                  <Calendar className="w-3.5 h-3.5 text-[#1e3a5f]" />
                  <span>Thời gian</span>
                </div>
                <p className="text-sm font-semibold text-stone-900 capitalize">{formattedDate}</p>
                <p className="text-xs text-stone-600">
                  {ceremony.time}{ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}
                </p>
              </div>

              <div className="py-5 sm:pl-7 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-500">
                  <MapPin className="w-3.5 h-3.5 text-[#1e3a5f]" />
                  <span>Địa điểm</span>
                </div>
                <p className="text-sm font-semibold text-stone-900">{ceremony.venueName}</p>
                <p className="text-xs text-stone-600 leading-relaxed">{ceremony.address}</p>
              </div>
            </div>

            {ceremony.dressCode && (
              <p className="mt-5 text-xs text-stone-500">
                Trang phục gợi ý: <span className="font-medium text-stone-800">{ceremony.dressCode}</span>
              </p>
            )}

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(ceremony.mapQuery || ceremony.address || '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs uppercase tracking-[0.14em] font-semibold transition-colors"
              >
                <span>Xem chỉ đường</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <a
                href={googleCalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs uppercase tracking-[0.14em] font-semibold transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Thêm vào lịch</span>
              </a>
            </div>
          </section>

          {/* Optional Ceremony Timeline (only if enabled in Admin layout) */}
          {showTimeline && (
            <section id="timeline" className="px-6 sm:px-14 py-10 border-t border-stone-200/90">
              <div className="text-center mb-7">
                <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-[#1e3a5f] mb-2">
                  Chương Trình
                </p>
                <h3 className="text-xl sm:text-2xl font-editorial font-semibold text-stone-900">
                  Lịch Trình Buổi Lễ
                </h3>
              </div>

              <ol className="divide-y divide-stone-200/80 max-w-lg mx-auto">
                {ceremony.timeline.map((step, idx) => (
                  <li key={idx} className="py-4 flex items-baseline gap-5">
                    <span className="w-14 shrink-0 text-xs font-mono font-semibold text-[#1e3a5f] tabular-nums">
                      {step.time}
                    </span>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-stone-900">{step.title}</div>
                      {step.desc && <p className="text-xs text-stone-500 leading-relaxed">{step.desc}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Guest Invitation Lookup */}
          <section id="lookup" className="px-6 sm:px-14 py-10 border-t border-stone-200/90 bg-[#f8f5ef]/75">
            <div className="max-w-md mx-auto text-center space-y-2.5">
              <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-[#1e3a5f]">
                Thiệp Cá Nhân Hóa
              </p>
              <h3 className="text-xl sm:text-2xl font-editorial font-semibold text-stone-900">
                Mở Thiệp Mời Của Bạn
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Nhập họ tên hoặc mã thiệp đã nhận để mở thiệp mời riêng và xác nhận tham dự.
              </p>

              <form onSubmit={handleLookup} className="pt-3 flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setLookupError('');
                    }}
                    placeholder="Nhập tên hoặc mã thiệp..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-white border border-stone-300/90 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <span>Mở thiệp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {lookupError && (
                <p className="text-xs text-rose-600 pt-1">{lookupError}</p>
              )}
            </div>
          </section>

          {/* Private Wishes Form */}
          <section id="wishes" className="px-6 sm:px-14 py-10 border-t border-stone-200/90">
            <div className="max-w-md mx-auto">
              <div className="text-center space-y-2 mb-7">
                <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-[#1e3a5f]">
                  Lưu Bút
                </p>
                <h3 className="text-xl sm:text-2xl font-editorial font-semibold text-stone-900">
                  Gửi Lời Chúc Mừng
                </h3>
                <p className="text-xs text-stone-500 inline-flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-stone-400" />
                  <span>Lời chúc được gửi riêng tư đến {graduate.fullName}.</span>
                </p>
              </div>

              <form onSubmit={handleSendWish} className="space-y-3">
                <input
                  type="text"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="Tên của bạn"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-stone-300/90 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600"
                />

                <textarea
                  rows={3}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Viết vài dòng nhắn gửi chúc mừng..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-stone-300/90 text-sm text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:border-stone-600"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer"
                >
                  Gửi lời chúc
                </button>

                {isWishSent && (
                  <p className="text-xs text-center text-[#1e3a5f] font-medium pt-1">
                    Đã gửi lời chúc của bạn thành công.
                  </p>
                )}
              </form>

              {mySentWishes.length > 0 && (
                <div className="mt-6 space-y-2.5">
                  {mySentWishes.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg border border-stone-200 bg-[#f8f5ef]/70 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-900">{item.guestName}</span>
                        <span className="text-[11px] text-stone-400">Đã gửi</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">“{item.message}”</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <footer className="py-6 px-6 border-t border-stone-200/80 text-center">
            <p className="text-xs font-editorial italic text-stone-500">
              {graduate.fullName} · {graduate.school}
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
}
