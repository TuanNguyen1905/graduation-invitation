import React, { useState, useEffect } from 'react';
import {
  DEFAULT_INVITATION,
  THEMES,
  createDynamicTheme,
  ROMANTIC_SPECIAL_TEMPLATE_ID
} from './data/mockData';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import DesignStudio from './components/DesignStudio';
import InteractiveWebInvite from './components/InteractiveWebInvite';
import RomanticSpecialInvite from './components/RomanticSpecialInvite';
import GuestManager from './components/GuestManager';
import CanvaEditor from './components/CanvaEditor';
import WebPreviewStudio from './components/WebPreviewStudio';
import WishManager from './components/WishManager';
import CardExportModal from './components/CardExportModal';
import {
  Users,
  CheckCircle2,
  Palette,
  MessageSquare,
  Sparkles,
  Wand2,
  Eye,
  Shield,
  Plus,
  ArrowRight,
  Home,
  Download
} from 'lucide-react';
import {
  fetchInvitationFromApi,
  fetchGuestInvitationFromApi,
  sendRsvpToApi,
  sendWishToApi,
  saveCustomTemplateToApi,
  deleteCustomTemplateFromApi,
  logoutFromApi,
  verifyAuthToken,
  getAuthToken,
} from './services/api';

// ============================================================
//  ROUTE DETECTION & SPA ROUTING
//  - /?invite=... hoặc /?code=... → Guest Portal (public, xác thực mã ở server)
//  - /admin hoặc #/admin          → Admin Dashboard / Login (cần đăng nhập)
//  - /                            → Landing Page Công Khai (public)
//  - Đường dẫn khác (/abc...)     → 404 Not Found
// ============================================================
function detectRoute() {
  const params = new URLSearchParams(window.location.search);
  const inviteParam = (params.get('invite') || params.get('code') || '').trim();
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const pageParam = params.get('page');

  // 1. Admin endpoint
  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash.startsWith('#/admin') ||
    hash.startsWith('#admin') ||
    pageParam === 'admin'
  ) {
    return { type: 'admin' };
  }

  // 2. Reject unknown paths with 404 screen
  if (pathname !== '/' && pathname !== '/index.html') {
    return { type: 'not-found', pathname: window.location.pathname };
  }

  // 3. Guest portal (only by invite code — never by guessing guest name)
  if (inviteParam) {
    return { type: 'guest', inviteParam };
  }

  // 4. Default: Landing page
  return { type: 'landing' };
}

// ============================================================
//  HELPER: Resolve theme for a guest (hỗ trợ cả customTheme đã chỉnh)
// ============================================================
function resolveGuestTheme(guest, allThemesList = THEMES) {
  if (guest?.customTheme) {
    return {
      ...createDynamicTheme({
        name: guest.customTheme.name || 'Tùy Biến Cá Nhân',
        mode: guest.themeMode || guest.customTheme.mode || 'dark',
        primary: guest.customTheme.primary || guest.customTheme.accentColor || '#0284c7',
        secondary: guest.customTheme.secondary || guest.customTheme.secondaryColor || '#38bdf8',
        envelope: guest.customTheme.envelope || guest.customTheme.envelopeColor || '#082f49',
        seal: guest.customTheme.seal || guest.customTheme.sealColor || '#0284c7',
      }),
      isCustom: true,
    };
  }
  const matched =
    allThemesList?.find((t) => t.id === guest?.themeId) ||
    THEMES.find((t) => t.id === guest?.themeId) ||
    THEMES[0];
  return {
    ...matched,
    mode: guest?.themeMode || matched.mode || 'dark',
  };
}

// ============================================================
//  GUEST PORTAL (Public — xác thực đúng 1 mã thiệp qua server)
// ============================================================
function GuestPortal({
  inviteCode,
  invitation,
  allThemes = THEMES,
  onAddWish,
  onUpdateGuestRsvp,
  onNavigateToHome,
  onOpenGuestInvite
}) {
  const [currentGuest, setCurrentGuest] = useState(null);
  const [guestStatus, setGuestStatus] = useState('loading'); // 'loading' | 'found' | 'not-found' | 'rate-limited'
  const [guestErrorMsg, setGuestErrorMsg] = useState('');
  const [retryCode, setRetryCode] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const mapGuestRow = (g, fallbackCode) => ({
    id: g.id,
    inviteCode: g.invite_code || fallbackCode,
    name: g.name,
    salutation: g.salutation,
    relationship: g.relationship,
    gender: g.gender || 'unisex',
    persona: g.persona || 'energetic',
    themeId: g.template_id || 'genz-ocean-blue',
    themeMode: g.theme_mode || 'light',
    customTheme: g.custom_theme_config ? JSON.parse(g.custom_theme_config) : null,
    customNote: g.custom_note,
    specialConfig: g.special_config ? JSON.parse(g.special_config) : null,
    specialLocked: Boolean(g.special_locked),
    rsvpStatus: g.rsvp_status || 'pending',
    guestCount: g.guest_count || 1
  });

  useEffect(() => {
    let cancelled = false;
    setGuestStatus('loading');
    setCurrentGuest(null);

    let savedUnlockToken = null;
    try {
      savedUnlockToken = sessionStorage.getItem(`gradinvite_unlock_${String(inviteCode || '').trim().toUpperCase()}`);
    } catch {
      savedUnlockToken = null;
    }

    fetchGuestInvitationFromApi(inviteCode, savedUnlockToken).then((result) => {
      if (cancelled) return;
      const g = result?.data?.guest || result?.data?.guests?.[0];
      if (result?.found && g) {
        setCurrentGuest(mapGuestRow(g, inviteCode));
        setGuestErrorMsg('');
        setGuestStatus('found');
      } else if (result?.status === 429 || result?.rateLimited) {
        setGuestErrorMsg(result?.error || 'Bạn đã tra cứu mã sai quá nhiều lần. Vui lòng thử lại sau 10 phút.');
        setGuestStatus('rate-limited');
      } else {
        setGuestErrorMsg('');
        setGuestStatus('not-found');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inviteCode]);

  // Derive theme for this guest (hỗ trợ customTheme, template, và chế độ Sáng/Tối)
  const guestTheme = currentGuest
    ? resolveGuestTheme(currentGuest, allThemes)
    : THEMES[0];
  const isGuestDarkMode = guestTheme?.mode === 'dark';

  if (guestStatus === 'loading' || !invitation) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6 text-slate-900 font-sans"
        style={{
          backgroundColor: '#f3f5f9',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1e3a5f18 0%, transparent 65%), linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)'
        }}
      >
        <div className="text-slate-600 text-xs uppercase tracking-[0.16em] font-semibold bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
          Đang mở thiệp mời...
        </div>
      </div>
    );
  }

  if (guestStatus === 'rate-limited') {
    return (
      <div
        className="min-h-screen text-slate-900 flex items-center justify-center p-5 font-sans"
        style={{
          backgroundColor: '#f3f5f9',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1e3a5f18 0%, transparent 65%), linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)'
        }}
      >
        <div className="w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-[0_25px_70px_-12px_rgba(15,23,42,0.18)]">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-rose-700">
            429 · Tạm Giới Hạn Tra Cứu
          </p>
          <h1 className="text-2xl font-editorial font-semibold text-stone-900 text-balance">
            Vui lòng thử lại sau ít phút
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            {guestErrorMsg || 'Bạn đã nhập sai mã thiệp quá 10 lần trong 10 phút. Để bảo mật thông tin khách mời, hệ thống tạm khóa tra cứu từ thiết bị này trong ít phút.'}
          </p>
          {onNavigateToHome && (
            <button
              type="button"
              onClick={onNavigateToHome}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs sm:text-sm font-semibold cursor-pointer inline-flex items-center justify-center"
            >
              Quay về trang chủ sự kiện
            </button>
          )}
        </div>
      </div>
    );
  }

  if (guestStatus === 'not-found' || !currentGuest) {
    return (
      <div
        className="min-h-screen text-slate-900 flex items-center justify-center p-5 font-sans"
        style={{
          backgroundColor: '#f3f5f9',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1e3a5f18 0%, transparent 65%), linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)'
        }}
      >
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-[0_25px_70px_-12px_rgba(15,23,42,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.06]">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-[#1e3a5f]">
            404 · Mã Thiệp Không Hợp Lệ
          </p>
          <h1 className="text-2xl font-editorial font-semibold text-stone-900 text-balance">
            Không tìm thấy thiệp mời
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Mã thiệp <span className="font-mono font-semibold text-stone-800 break-all">{inviteCode}</span> không tồn tại hoặc đã bị thu hồi. Vui lòng kiểm tra lại đúng mã thiệp bạn nhận được.
          </p>

          {onOpenGuestInvite && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (retryCode.trim()) onOpenGuestInvite(retryCode.trim());
              }}
              className="flex flex-col sm:flex-row gap-2.5 pt-2"
            >
              <input
                type="text"
                value={retryCode}
                onChange={(e) => setRetryCode(e.target.value)}
                placeholder="Nhập lại mã thiệp (VD: INV-...)"
                className="flex-1 min-h-[44px] px-3.5 py-2.5 rounded-lg bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600"
              />
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs sm:text-sm uppercase tracking-[0.12em] font-semibold cursor-pointer"
              >
                Mở lại
              </button>
            </form>
          )}

          {onNavigateToHome && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onNavigateToHome}
                className="min-h-[44px] px-4 py-2.5 inline-flex items-center justify-center text-sm font-medium text-stone-600 hover:text-stone-900 underline underline-offset-4 cursor-pointer"
              >
                Quay về trang chủ sự kiện
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isSpecialRomantic = currentGuest?.themeId === ROMANTIC_SPECIAL_TEMPLATE_ID;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Dedicated Guest View (tự đồng bộ toàn bộ nền & thanh điều hướng theo theme đang chọn) */}
      <main className="flex-1 flex flex-col">
        {isSpecialRomantic ? (
          <RomanticSpecialInvite
            invitation={invitation}
            currentGuest={currentGuest}
            onNavigateToHome={onNavigateToHome}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onUpdateGuestRsvp={(id, status, count) =>
              onUpdateGuestRsvp(id, status, count, currentGuest.inviteCode)
            }
            onUnlockedGuest={(unlockedRow) => {
              setCurrentGuest(mapGuestRow(unlockedRow, currentGuest.inviteCode));
            }}
          />
        ) : (
          <InteractiveWebInvite
            invitation={invitation}
            currentGuest={currentGuest}
            theme={guestTheme}
            onNavigateToHome={onNavigateToHome}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onUpdateGuestRsvp={(id, status, count) =>
              onUpdateGuestRsvp(id, status, count, currentGuest.inviteCode)
            }
            onAddWish={onAddWish}
          />
        )}
      </main>

      <CardExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        invitation={invitation}
        currentGuest={currentGuest}
        theme={guestTheme}
      />
    </div>
  );
}

// ============================================================
//  ADMIN PANEL (Đã tối ưu layout theo chuẩn UI/UX Pro Max)
// ============================================================
function AdminPanel({
  invitation,
  setInvitation,
  customTemplates,
  setCustomTemplates,
  allThemes,
  onNavigateToHome
}) {
  const [currentGuest, setCurrentGuest] = useState(invitation?.guests?.[0] || null);
  const [currentView, setCurrentView] = useState('studio'); // 'studio', 'guests', 'canva', 'preview'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Sync currentGuest when guest list changes (e.g., after loading DB or deleting guests)
  useEffect(() => {
    const list = invitation?.guests || [];
    if (list.length === 0) {
      if (currentGuest !== null) setCurrentGuest(null);
      return;
    }
    if (!currentGuest || !list.some((g) => g.id === currentGuest.id)) {
      setCurrentGuest(list[0]);
    }
  }, [invitation?.guests, currentGuest]);

  const [theme, setTheme] = useState(() => {
    return allThemes.find((t) => t.id === invitation?.theme?.id) || THEMES[0];
  });

  // Sync theme when guest or invitation.theme from DB changes
  useEffect(() => {
    if (currentGuest) {
      const resolved = resolveGuestTheme(currentGuest, allThemes);
      setTheme(resolved);
      if (resolved.layoutConfig) {
        setInvitation((prev) => ({ ...prev, layout: resolved.layoutConfig }));
      }
    } else if (invitation?.theme?.id) {
      const matchedInvTheme = allThemes.find((t) => t.id === invitation.theme.id);
      if (matchedInvTheme) {
        setTheme(matchedInvTheme);
      }
    }
  }, [currentGuest, invitation?.theme?.id, allThemes]);

  // Check DB connection status
  useEffect(() => {
    fetchInvitationFromApi().then((data) => {
      if (data?.invitation) setIsDbConnected(true);
    });
  }, []);

  // Update RSVP
  const handleUpdateGuestRsvp = (guestId, status, count) => {
    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) =>
        g.id === guestId ? { ...g, rsvpStatus: status, guestCount: count } : g
      ),
    }));
    if (currentGuest?.id === guestId) {
      setCurrentGuest((prev) => ({ ...prev, rsvpStatus: status, guestCount: count }));
    }
    sendRsvpToApi(guestId, status, count);
  };

  // Add Wish
  const handleAddWish = (newWish) => {
    const wishItem = {
      id: `wish-${Date.now()}`,
      guestName: newWish.guestName,
      relationship: newWish.relationship,
      message: newWish.message,
      emoji: newWish.emoji || '🎓',
      time: 'Vừa xong',
    };
    setInvitation((prev) => ({ ...prev, wishes: [wishItem, ...prev.wishes] }));
    sendWishToApi({
      invitationId: 'minh-dhbk-2026',
      guestName: newWish.guestName,
      relationship: newWish.relationship,
      message: newWish.message,
      emoji: newWish.emoji,
    });
  };

  // Logout
  const handleLogout = async () => {
    await logoutFromApi();
    window.location.reload();
  };

  // KPI Calculations
  const guests = invitation?.guests || [];
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.rsvpStatus === 'confirmed').length;
  const confirmedPax = guests
    .filter((g) => g.rsvpStatus === 'confirmed')
    .reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
  const rsvpRate = totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0;
  const wishesCount = invitation?.wishes?.length || 0;

  return (
    <div className="min-h-screen bg-sky-50/40 flex flex-col font-sans selection:bg-sky-200 selection:text-sky-900">
      
      {/* ── TOP NAVBAR ────────────────────────────────────────────── */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentGuest={currentGuest}
        guests={guests}
        onSelectGuest={(g) => setCurrentGuest(g)}
        isDbConnected={isDbConnected}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onNavigateToHome={onNavigateToHome}
        onLogout={handleLogout}
      />

      {/* ── ADMIN COMMAND RIBBON / KPI OVERVIEW ────────────────────── */}
      <section className="bg-white border-b border-sky-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          
          {/* Bento KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            
            {/* KPI 1: Guests */}
            <div
              onClick={() => setCurrentView('guests')}
              className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100/80 hover:bg-sky-100/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase font-genz">
                  Tổng Khách Mời
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-genz">
                  {totalGuests}
                </span>
                <span className="text-xs text-sky-600 font-semibold">người</span>
              </div>
            </div>

            {/* KPI 2: RSVP Confirmed */}
            <div
              onClick={() => setCurrentView('guests')}
              className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase font-genz">
                  Xác Nhận Tham Dự
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-900 font-genz">
                  {confirmedGuests}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">
                  ({confirmedPax} khách · {rsvpRate}%)
                </span>
              </div>
            </div>

            {/* KPI 3: Templates */}
            <div
              onClick={() => setCurrentView('studio')}
              className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase font-genz">
                  Kho Template
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Palette className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-indigo-900 font-genz">
                  {allThemes.length}
                </span>
                <span className="text-xs text-indigo-600 font-semibold">
                  mẫu {customTemplates.length > 0 && `(★ ${customTemplates.length} tự tạo)`}
                </span>
              </div>
            </div>

            {/* KPI 4: Wishes */}
            <div
              onClick={() => setCurrentView('wishes')}
              className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 hover:bg-amber-100/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase font-genz">
                  Sổ Lưu Bút (Admin)
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-900 font-genz">
                  {wishesCount}
                </span>
                <span className="text-xs text-amber-700 font-semibold">lời chúc</span>
              </div>
            </div>

          </div>

          {/* Contextual Workspace Sub-header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div>
              <div className="text-sm font-black text-slate-900 font-genz flex items-center gap-2">
                {currentView === 'studio' && '🎨 Studio Thiết Kế Thiệp & Bố Cục'}
                {currentView === 'guests' && '👥 Quản Lý Khách Mời, Tạo Hàng Loạt & Gửi Mail'}
                {currentView === 'canva' && '🪄 Trình Biên Tập Đồ Họa Canva Kéo Thả'}
                {currentView === 'preview' && '👁️ Mô Phỏng Trực Tiếp Trải Nghiệm Khách Mời'}
                {currentView === 'wishes' && '💌 Sổ Lưu Bút & Lời Chúc Riêng Tư (Chỉ Admin)'}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {currentView === 'studio' && 'Tùy biến bảng màu, phông chữ, chế độ sáng/tối và lưu cấu hình thành các mẫu template.'}
                {currentView === 'guests' && 'Cấp mã thiệp duy nhất, gửi mail qua Aliyun Enterprise, tải QR và cập nhật phản hồi RSVP.'}
                {currentView === 'canva' && 'Tự do thêm nhãn dán sticker, hình khối và bố trí typography trên canvas đồ họa.'}
                {currentView === 'preview' && `Đang xem mô phỏng thiệp của: ${currentGuest?.name || 'Khách mời'}`}
                {currentView === 'wishes' && 'Toàn bộ lưu bút của khách mời gửi về được bảo mật tại đây, người ngoài không thể xem.'}
              </div>
            </div>

            {/* View-specific Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {currentView !== 'preview' && (
                <button
                  onClick={() => setCurrentView('preview')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-500" />
                  <span>Xem Thử Thiệp</span>
                </button>
              )}

              {currentView !== 'guests' && (
                <button
                  onClick={() => setCurrentView('guests')}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-500/20"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>DS Khách Mời</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── MAIN WORKSPACE CONTENT ─────────────────────────────────── */}
      <main className="flex-1">
        {currentView === 'studio' && (
          <DesignStudio
            invitation={invitation}
            setInvitation={setInvitation}
            currentGuest={currentGuest}
            setCurrentGuest={setCurrentGuest}
            theme={theme}
            setTheme={setTheme}
            customTemplates={customTemplates}
            setCustomTemplates={setCustomTemplates}
            allThemes={allThemes}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onSwitchToGuestView={() => setCurrentView('preview')}
          />
        )}

        {currentView === 'canva' && (
          <CanvaEditor
            invitation={invitation}
            currentGuest={currentGuest}
            onSaveDesign={(design) => {
              console.log('Saved custom Canva layout:', design);
            }}
          />
        )}

        {currentView === 'preview' && (
          <WebPreviewStudio
            invitation={invitation}
            setInvitation={setInvitation}
            currentGuest={currentGuest}
            setCurrentGuest={setCurrentGuest}
            theme={theme}
            setTheme={setTheme}
            allThemes={allThemes}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onUpdateGuestRsvp={handleUpdateGuestRsvp}
            onAddWish={handleAddWish}
          />
        )}

        {currentView === 'guests' && (
          <GuestManager
            invitation={invitation}
            setInvitation={setInvitation}
            currentGuest={currentGuest}
            setCurrentGuest={setCurrentGuest}
            allThemes={allThemes}
            customTemplates={customTemplates}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onSwitchToGuestView={() => setCurrentView('preview')}
            onOpenGuestPortal={(guest) => {
              const inviteCode = guest.inviteCode || guest.id;
              let path = window.location.pathname.replace(/\/admin\/?.*$/, '');
              if (!path.endsWith('/')) path += '/';
              const url = `${window.location.origin}${path}?invite=${encodeURIComponent(inviteCode)}`;
              window.open(url, '_blank');
            }}
          />
        )}

        {currentView === 'wishes' && (
          <WishManager
            invitation={invitation}
            setInvitation={setInvitation}
          />
        )}
      </main>

      {/* Export Card / High-res Generator Modal */}
      <CardExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        invitation={invitation}
        currentGuest={currentGuest}
        theme={theme}
      />

    </div>
  );
}

// ============================================================
//  ROOT APP COMPONENT — SPA Routing & Session Management
// ============================================================
export default function App() {
  const [currentRoute, setCurrentRoute] = useState(detectRoute);

  // Shared invitation state (không giữ lưu bút hay danh sách khách mẫu khi DB đang trống)
  const [invitation, setInvitation] = useState(() => {
    try {
      const saved = localStorage.getItem('grad_invite_data');
      const parsed = saved ? JSON.parse(saved) : { ...DEFAULT_INVITATION, guests: [] };
      return { ...parsed, wishes: [] };
    } catch {
      return { ...DEFAULT_INVITATION, guests: [], wishes: [] };
    }
  });

  const [customTemplates, setCustomTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('grad_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allThemes = [...customTemplates, ...THEMES];

  // Auth state for Admin: null (checking), false (unauthorized), true (authorized)
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [invitationLoaded, setInvitationLoaded] = useState(false);

  // Synchronize browser history / popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(detectRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch database data on startup
  useEffect(() => {
    fetchInvitationFromApi().then((data) => {
      if (data?.invitation) {
        const dbInv = data.invitation;

        let mappedTpls = [];
        if (data.templates?.length > 0) {
          mappedTpls = data.templates.map((t) => ({
            ...createDynamicTheme({
              name: t.name,
              mode: t.mode || 'dark',
              primary: t.primary_color,
              secondary: t.secondary_color,
              envelope: t.envelope_color,
              seal: t.seal_color,
            }),
            id: t.id,
            badge: t.badge || 'Mẫu thiết kế đã lưu ✨',
            layoutConfig: t.layout_config ? JSON.parse(t.layout_config) : null,
            isSavedTemplate: true,
          }));
          setCustomTemplates(mappedTpls);
        }

        const resolvedThemes = [...mappedTpls, ...THEMES];
        const matchedInvTheme = resolvedThemes.find((t) => t.id === dbInv.theme_id) || THEMES[0];

        setInvitation((prev) => ({
          ...prev,
          theme: matchedInvTheme,
          layout: dbInv.layout_settings ? JSON.parse(dbInv.layout_settings) : prev.layout,
          graduate: {
            ...prev.graduate,
            fullName: dbInv.full_name ?? '',
            nickname: dbInv.nickname ?? '',
            degree: dbInv.degree ?? '',
            honor: dbInv.honor ?? '',
            school: dbInv.school ?? '',
            faculty: dbInv.faculty ?? '',
            classBatch: dbInv.class_batch ?? '',
            avatarUrl: dbInv.avatar_url ?? prev.graduate.avatarUrl,
            quote: dbInv.quote ?? '',
            spotifySong: dbInv.spotify_song ?? '',
          },
          ceremony: {
            ...prev.ceremony,
            date: dbInv.ceremony_date ?? prev.ceremony.date,
            time: dbInv.ceremony_time ?? prev.ceremony.time,
            endExpected: dbInv.end_expected ?? '',
            venueName: dbInv.venue_name ?? '',
            address: dbInv.address ?? '',
            mapQuery: dbInv.map_query ?? '',
            dressCode: dbInv.dress_code ?? '',
            timeline:
              Array.isArray(data.timeline)
                ? data.timeline.map((t) => ({ time: t.time, title: t.title, desc: t.description }))
                : prev.ceremony.timeline,
          },
          gallery:
            Array.isArray(data.gallery) && data.gallery.length > 0
              ? data.gallery.map((p) => ({ id: p.id, title: p.title, url: p.photo_url || p.url }))
              : prev.gallery,
          guests: Array.isArray(data.guests)
            ? data.guests.map((g) => ({
                id: g.id,
                inviteCode: g.invite_code || g.access_code || g.id,
                name: g.name,
                email: g.email || '',
                salutation: g.salutation,
                relationship: g.relationship,
                gender: g.gender || 'unisex',
                persona: g.persona || 'energetic',
                themeId: g.template_id || 'genz-ocean-blue',
                themeMode: g.theme_mode || 'dark',
                customTheme: g.custom_theme_config ? JSON.parse(g.custom_theme_config) : null,
                specialConfig: g.special_config ? JSON.parse(g.special_config) : null,
                customNote: g.custom_note,
                rsvpStatus: g.rsvp_status,
                guestCount: g.guest_count,
                phone: g.phone,
              }))
            : prev.guests,
          wishes: Array.isArray(data.wishes)
            ? data.wishes.map((w) => ({
                id: w.id,
                guestName: w.guest_name,
                relationship: w.relationship,
                message: w.message,
                emoji: w.emoji,
                time: w.created_at
                  ? new Date(w.created_at).toLocaleString('vi-VN')
                  : 'Vừa xong',
              }))
            : [],
        }));
      }
      setInvitationLoaded(true);
    });
  }, [isAuthenticated]);

  // Check auth when on Admin route
  useEffect(() => {
    if (currentRoute.type !== 'admin') return;
    const token = getAuthToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    verifyAuthToken().then((valid) => setIsAuthenticated(valid));
  }, [currentRoute.type]);

  // Sync state to localStorage sau khi đã tải xong DB (không ghi đè trước khi DB phản hồi)
  useEffect(() => {
    if (!invitationLoaded) return;
    try {
      localStorage.setItem('grad_invite_data', JSON.stringify({ ...invitation, wishes: [] }));
    } catch {}
  }, [invitation, invitationLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem('grad_custom_templates', JSON.stringify(customTemplates));
    } catch {}
  }, [customTemplates]);

  // Wish & RSVP Handlers
  const handleAddWish = (newWish) => {
    if (isAuthenticated) {
      const wishItem = {
        id: `wish-${Date.now()}`,
        guestName: newWish.guestName,
        relationship: newWish.relationship,
        message: newWish.message,
        emoji: newWish.emoji || '🎓',
        time: 'Vừa xong',
      };
      setInvitation((prev) => ({ ...prev, wishes: [wishItem, ...prev.wishes] }));
    }
    sendWishToApi({
      invitationId: 'minh-dhbk-2026',
      guestName: newWish.guestName,
      relationship: newWish.relationship,
      message: newWish.message,
      emoji: newWish.emoji,
    });
  };

  const handleUpdateGuestRsvp = (guestId, status, count, inviteCode = '') => {
    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) =>
        g.id === guestId ? { ...g, rsvpStatus: status, guestCount: count } : g
      ),
    }));
    sendRsvpToApi(guestId, status, count, '', inviteCode);
  };

  // Navigation helpers
  const handleNavigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentRoute({ type: 'admin' });
  };

  const handleNavigateToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute({ type: 'landing' });
  };

  const handleOpenGuestInvite = (inviteCode) => {
    window.history.pushState({}, '', `/?invite=${encodeURIComponent(inviteCode)}`);
    setCurrentRoute({ type: 'guest', inviteParam: inviteCode });
  };

  // ============================================================
  //  VIEW RENDERING
  // ============================================================

  // 0. 404 NOT FOUND ROUTE
  if (currentRoute.type === 'not-found') {
    return (
      <div
        className="min-h-screen text-slate-900 flex items-center justify-center p-5 font-sans"
        style={{
          backgroundColor: '#f3f5f9',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1e3a5f18 0%, transparent 65%), linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)'
        }}
      >
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-[0_25px_70px_-12px_rgba(15,23,42,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08)]">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-[#1e3a5f]">
            404 · Không Tìm Thấy Trang
          </p>
          <h1 className="text-2xl font-editorial font-semibold text-stone-900 text-balance">
            Đường dẫn không tồn tại
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Trang <span className="font-mono text-stone-800 break-all">{currentRoute.pathname}</span> không có trên hệ thống.
          </p>
          <button
            type="button"
            onClick={handleNavigateToHome}
            className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1e3a5f] hover:bg-[#172e4c] text-white text-xs sm:text-sm uppercase tracking-[0.12em] font-semibold cursor-pointer inline-flex items-center justify-center"
          >
            Về trang chủ sự kiện
          </button>
        </div>
      </div>
    );
  }

  // 1. GUEST PORTAL ROUTE (Public — xác thực đúng 1 mã thiệp qua API)
  if (currentRoute.type === 'guest') {
    return (
      <GuestPortal
        inviteCode={currentRoute.inviteParam}
        invitation={invitationLoaded ? { ...invitation, guests: [], wishes: [] } : null}
        allThemes={allThemes}
        onAddWish={handleAddWish}
        onUpdateGuestRsvp={handleUpdateGuestRsvp}
        onNavigateToHome={handleNavigateToHome}
        onOpenGuestInvite={handleOpenGuestInvite}
      />
    );
  }

  // 2. ADMIN ROUTE (Requires Auth)
  if (currentRoute.type === 'admin') {
    if (isAuthenticated === null) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center">
          <div className="text-sky-600 font-genz text-sm animate-pulse flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
            Đang xác thực bảo mật trang quản trị...
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
      <AdminPanel
        invitation={invitation}
        setInvitation={setInvitation}
        customTemplates={customTemplates}
        setCustomTemplates={setCustomTemplates}
        allThemes={allThemes}
        onNavigateToHome={handleNavigateToHome}
      />
    );
  }

  // 3. LANDING PAGE (Default Root Route `/` — không truyền lưu bút của người khác)
  return (
    <LandingPage
      invitation={{ ...invitation, wishes: [] }}
      onOpenGuestInvite={handleOpenGuestInvite}
      onNavigateToAdmin={handleNavigateToAdmin}
      onAddWish={handleAddWish}
    />
  );
}
