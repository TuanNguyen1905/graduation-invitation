import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Sparkles,
  Search,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Award,
  ExternalLink,
  Download,
  Share2,
  MessageSquare,
  Flame,
  Shield,
  ChevronRight,
  Lock,
  CalendarPlus,
  Send,
  Ticket,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CountdownTimer from './CountdownTimer';
import { createGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';

export default function LandingPage({
  invitation,
  onOpenGuestInvite,
  onNavigateToAdmin,
  onAddWish
}) {
  const { graduate, ceremony, gallery = [] } = invitation;

  // Search / Lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupError, setLookupError] = useState('');

  // Wish form state (chỉ lưu tạm lời chúc do chính người dùng hiện tại vừa gửi trong phiên)
  const [wishName, setWishName] = useState('');
  const [wishMessage, setWishMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎓');
  const [isWishSent, setIsWishSent] = useState(false);
  const [mySentWishes, setMySentWishes] = useState([]);

  // Calendar Links
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

  // Handle Lookup
  const handleLookup = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setLookupError('Vui lòng nhập họ tên hoặc mã thiệp mời của bạn.');
      return;
    }

    setLookupError('');

    // Check if query matches any guest's inviteCode or name
    const guests = invitation.guests || [];
    const matched = guests.find(
      (g) =>
        (g.inviteCode && g.inviteCode.toUpperCase() === query.toUpperCase()) ||
        (g.id && g.id.toLowerCase() === query.toLowerCase()) ||
        (g.name && g.name.toLowerCase().includes(query.toLowerCase()))
    );

    if (matched) {
      onOpenGuestInvite(matched.inviteCode || matched.id);
    } else {
      // Fallback: create dynamic invite for this name
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
      emoji: selectedEmoji
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

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    setTimeout(() => setIsWishSent(false), 4000);
  };

  const sampleGuests = (invitation.guests || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-200 selection:text-sky-900">
      
      {/* ── TOP HEADER / NAVBAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-sky-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 p-0.5 shadow-md shadow-sky-500/20">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div>
              <div className="text-base font-black tracking-wide font-genz text-slate-900 flex items-center gap-1.5">
                GradInvite
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-sans font-extrabold border border-sky-200">
                  2026
                </span>
              </div>
              <div className="text-[10px] text-sky-600 font-semibold hidden sm:block">
                Lễ Tốt Nghiệp Cử Nhân • {graduate.fullName}
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#about" className="hover:text-sky-600 transition-colors">Giới Thiệu</a>
            <a href="#lookup" className="hover:text-sky-600 transition-colors">Tra Cứu Thiệp</a>
            <a href="#ceremony" className="hover:text-sky-600 transition-colors">Thời Gian & Địa Điểm</a>
            <a href="#timeline" className="hover:text-sky-600 transition-colors">Lịch Trình</a>
            <a href="#wishes" className="hover:text-sky-600 transition-colors">Lời Chúc</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <a
              href="#lookup"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer font-genz"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tra Cứu Thiệp</span>
            </a>
          </div>

        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <section id="about" className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-sky-50/60 via-white to-slate-50">
        
        {/* Subtle decorative background blur spots */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-100/50 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-extrabold tracking-wider uppercase font-genz mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Official Graduation Celebration • Class of 2026
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight font-genz uppercase mb-4 leading-tight">
            LỄ TỐT NGHIỆP CỬ NHÂN
          </h1>

          <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-700 uppercase tracking-wide font-genz mb-2">
            {graduate.fullName}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mb-6">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            {graduate.degree} • {graduate.honor}
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-semibold uppercase tracking-widest max-w-xl mx-auto mb-8 font-genz">
            {graduate.school}
            <br />
            <span className="text-slate-400 font-medium lowercase">
              {graduate.faculty} • {graduate.classBatch}
            </span>
          </p>

          {/* Avatar with Polaroid Frame */}
          <div className="relative inline-block my-2">
            <div className="relative p-3.5 bg-white rounded-3xl shadow-2xl border border-sky-100 transform hover:scale-[1.02] transition-transform duration-300 max-w-[260px] sm:max-w-[280px] mx-auto">
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                <img
                  src={graduate.avatarUrl}
                  alt={graduate.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-3 pb-1 text-center font-black text-sm text-slate-800 font-genz">
                {graduate.fullName} 🎓
              </div>
              <div className="text-[11px] text-sky-600 font-semibold font-mono">
                {graduate.nickname || 'Tân Cử Nhân 2026'}
              </div>
            </div>

            {/* Floating Gen Z Sticker */}
            <div className="absolute -top-3 -right-3 hidden sm:block">
              <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-[11px] shadow-lg shadow-pink-500/30 border border-white font-genz">
                ✨ 100% UNLOCKED
              </span>
            </div>
            <div className="absolute -bottom-3 -left-3 hidden sm:block">
              <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-[11px] shadow-lg shadow-sky-500/30 border border-white font-genz">
                🎓 FINALLY DONE
              </span>
            </div>
          </div>

          {/* Quote Card */}
          {graduate.quote && (
            <div className="max-w-2xl mx-auto mt-8 p-5 rounded-2xl bg-white border border-sky-100 shadow-md shadow-sky-500/5 text-slate-700 italic text-xs sm:text-sm leading-relaxed">
              "{graduate.quote}"
            </div>
          )}

          {/* Countdown to Ceremony */}
          <div className="max-w-xl mx-auto mt-8">
            <CountdownTimer
              targetDate={ceremony.date}
              targetTime={ceremony.time}
              accentColor="#0ea5e9"
            />
          </div>

        </div>
      </section>

      {/* ── VIP GUEST INVITATION LOOKUP (TRA CỨU THIỆP MỜI) ──────────── */}
      <section id="lookup" className="py-14 sm:py-20 bg-white border-y border-sky-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white shadow-2xl shadow-sky-500/25 relative overflow-hidden">
            
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)',
                backgroundSize: '30px 30px'
              }}
            />

            <div className="relative text-center max-w-2xl mx-auto space-y-3">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 uppercase tracking-wider font-genz">
                <Ticket className="w-3.5 h-3.5 text-amber-300" />
                Dành Riêng Cho Khách Mời
              </div>

              <h2 className="text-2xl sm:text-4xl font-black font-genz tracking-tight text-white">
                Tra Cứu Thiệp Mời Của Bạn
              </h2>

              <p className="text-xs sm:text-sm text-sky-100 leading-relaxed max-w-lg mx-auto">
                Nhập <strong>Họ tên</strong> hoặc <strong>Mã thiệp mời (INV-...)</strong> được gửi qua tin nhắn / email để mở thiệp mời tương tác cá nhân hóa.
              </p>

              {/* Lookup Form */}
              <form onSubmit={handleLookup} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-sky-300" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setLookupError('');
                    }}
                    placeholder="Nhập tên của bạn hoặc mã thiệp (vd: Mai Linh, INV-...)"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-black active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 font-genz shrink-0"
                >
                  <span>Mở Thiệp</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </button>
              </form>

              {/* Error Message */}
              {lookupError && (
                <p className="text-xs text-rose-200 font-bold mt-2">
                  ⚠️ {lookupError}
                </p>
              )}

              {/* Sample Quick Chips */}
              {sampleGuests.length > 0 && (
                <div className="pt-4 border-t border-white/20 mt-6">
                  <div className="text-[11px] text-sky-200 font-semibold mb-2">
                    Hoặc chọn xem nhanh thiệp mời mẫu:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {sampleGuests.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => onOpenGuestInvite(g.inviteCode || g.id)}
                        className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/30 text-white text-xs font-bold border border-white/25 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{g.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({g.inviteCode || g.id})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* ── CEREMONY DETAILS (THỜI GIAN & ĐỊA ĐIỂM) ─────────────────── */}
      <section id="ceremony" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 font-genz">
              Thời Khắc Trọng Đại
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-genz">
              Thông Tin Chi Tiết Lễ Tốt Nghiệp
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Hãy lưu lại thời gian và địa điểm để có mặt chung vui và cùng nhau lưu giữ khoảnh khắc thanh xuân.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Time */}
            <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-md shadow-sky-500/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-genz">Thời Gian</h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">{formattedDate}</p>
                <p className="font-mono text-sky-600 font-semibold">{ceremony.time} - {ceremony.endExpected}</p>
              </div>
              <div className="pt-2 flex flex-col gap-1.5">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-600 font-bold hover:text-sky-700"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Thêm vào Google Calendar</span>
                </a>
              </div>
            </div>

            {/* Card 2: Venue */}
            <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-md shadow-sky-500/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-genz">Địa Điểm</h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">{ceremony.venueName}</p>
                <p className="text-[11px] leading-relaxed text-slate-500">{ceremony.address}</p>
              </div>
              <div className="pt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(ceremony.mapQuery || ceremony.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:text-blue-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Chỉ đường Google Maps</span>
                </a>
              </div>
            </div>

            {/* Card 3: Dress Code */}
            <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-md shadow-sky-500/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-genz">Dress Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ceremony.dressCode || "Tone-sur-tone: Trắng, Pastel, Denim hoặc Outfit Cháy Phố ✨"}
              </p>
              <div className="pt-2 text-[11px] text-pink-600 font-semibold">
                👗 Hãy diện bộ cánh thật xinh nhé!
              </div>
            </div>

            {/* Card 4: School & Faculty */}
            <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-md shadow-sky-500/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-genz">Khoa & Niên Khóa</h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">{graduate.faculty}</p>
                <p className="text-slate-500">{graduate.classBatch}</p>
              </div>
              <div className="pt-2 text-[11px] text-amber-700 font-semibold">
                🏛️ {graduate.school}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── CEREMONY TIMELINE (LỊCH TRÌNH BUỔI LỄ) ───────────────────── */}
      {ceremony.timeline && ceremony.timeline.length > 0 && (
        <section id="timeline" className="py-16 sm:py-24 bg-white border-t border-sky-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            
            <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-sky-600 font-genz">
                Lịch Trình Chi Tiết
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-genz">
                Các Mốc Giờ Quan Trọng
              </h2>
            </div>

            <div className="space-y-4">
              {ceremony.timeline.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-sky-50/40 border border-sky-100 hover:border-sky-300 transition-all shadow-xs"
                >
                  <div className="w-16 sm:w-20 shrink-0 text-center py-2 px-2.5 rounded-xl bg-white border border-sky-200 shadow-xs">
                    <span className="font-mono text-sm sm:text-base font-black text-sky-600">
                      {step.time}
                    </span>
                  </div>

                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 font-genz">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ── GUESTBOOK & WISHES (BỨC TƯỜNG LỜI CHÚC) ───────────────────── */}
      <section id="wishes" className="py-16 sm:py-24 bg-gradient-to-b from-sky-50/50 via-white to-slate-50 border-t border-sky-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 font-genz">
              Sổ Lưu Bút Kỷ Niệm
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-genz">
              Gửi Lời Chúc Mừng Tân Cử Nhân
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Hãy để lại vài dòng nhắn gửi ấm áp để chúc mừng ngày lễ tốt nghiệp nhé!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Wish Submission Form (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-white border border-sky-100 shadow-xl shadow-sky-500/5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-genz flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-500" />
                <span>Viết Lời Chúc</span>
              </h3>

              <form onSubmit={handleSendWish} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Tên của bạn</label>
                  <input
                    type="text"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    placeholder="VD: Mai Linh, Bro Tuấn Anh..."
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-sky-200 bg-sky-50/40 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Emoji cảm xúc</label>
                  <div className="flex gap-2 mt-1">
                    {['🎓', '✨', '💐', '🔥', '🚀', '💖'].map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer transition-all ${
                          selectedEmoji === emoji ? 'bg-sky-500 text-white scale-110 shadow-sm' : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Lời chúc</label>
                  <textarea
                    rows={3}
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                    placeholder="Chúc mừng tốt nghiệp! Chúc bạn sự nghiệp thăng hoa, bay cao bay xa nhé..."
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-sky-200 bg-sky-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 font-genz transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Bắn Lời Chúc Mừng 🚀</span>
                </button>

                {isWishSent && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 text-center animate-fade-in">
                    🎉 Đã gửi lời chúc thành công! Cảm ơn bạn rất nhiều!
                  </div>
                )}
              </form>
            </div>

            {/* Private Wishes Box (7 cols — Chỉ hiển thị lời chúc của chính bạn vừa gửi, ẩn lưu bút của người khác) */}
            <div className="lg:col-span-7 space-y-3 max-h-[460px] overflow-y-auto pr-1">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-sky-100 shadow-sm text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900 font-genz">
                  Sổ Lưu Bút Chế Độ Riêng Tư
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Mọi lời chúc bạn gửi sẽ được lưu trữ kín đáo và gửi trực tiếp đến <strong className="text-sky-700">{graduate.fullName}</strong>. Chỉ chủ nhân buổi lễ (Admin) mới có thể đọc được lưu bút của các khách mời khác.
                </p>
              </div>

              {mySentWishes.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.emoji || '🎓'}</span>
                      <span className="text-xs font-bold font-genz text-emerald-900">
                        {item.guestName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">
                        Đã gửi riêng tư ✓
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600">{item.time}</span>
                  </div>
                  <p className="text-xs pl-7 text-slate-700 leading-relaxed">
                    "{item.message}"
                  </p>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-12 bg-white border-t border-sky-100 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-genz font-bold text-slate-800 text-sm">
          <GraduationCap className="w-5 h-5 text-sky-600" />
          <span>GradInvite • Personalized Graduation Invitation System</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
          Chúc mừng Tân Cử Nhân {graduate.fullName} • Lễ Tốt Nghiệp Khóa 2022 - 2026.
        </p>
      </footer>

    </div>
  );
}

