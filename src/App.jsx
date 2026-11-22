import React, { useState, useEffect } from 'react';
import { DEFAULT_INVITATION, THEMES, createDynamicTheme } from './data/mockData';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import DesignStudio from './components/DesignStudio';
import InteractiveWebInvite from './components/InteractiveWebInvite';
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
//  - ?invite=... hoặc ?code=...  → Guest Portal (public)
//  - /admin hoặc #/admin         → Admin Dashboard / Login (cần đăng nhập)
//  - Mọi trường hợp còn lại (/)  → Landing Page Công Khai (public)
// ============================================================
function detectRoute() {
  const params = new URLSearchParams(window.location.search);
  const inviteParam = params.get('invite') || params.get('code');
  const guestParam = params.get('guest');

  // 1. Guest portal
  if (inviteParam || guestParam) {
    return { type: 'guest', inviteParam, guestParam };
  }

  // 2. Admin endpoint
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const pageParam = params.get('page');

  if (
    pathname.startsWith('/admin') ||
    hash.startsWith('#/admin') ||
    hash.startsWith('#admin') ||
    pageParam === 'admin'
  ) {
    return { type: 'admin' };
  }

  // 3. Default: Landing page
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
//  GUEST PORTAL (Public — xem thiệp mời cá nhân hóa)
// ============================================================
function GuestPortal({ invitation, allThemes = THEMES, onAddWish, onUpdateGuestRsvp, onNavigateToHome }) {
  const params = new URLSearchParams(window.location.search);
  const inviteParam = params.get('invite') || params.get('code');
  const guestParam = params.get('guest');

  const [currentGuest, setCurrentGuest] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    let matched = null;

    if (inviteParam) {
      matched = invitation.guests.find(
        (g) =>
          (g.inviteCode && g.inviteCode.toUpperCase() === inviteParam.toUpperCase()) ||
          (g.id && g.id.toLowerCase() === inviteParam.toLowerCase())
      );
    }
    if (!matched && guestParam) {
      matched = invitation.guests.find(
        (g) => g.name.toLowerCase() === guestParam.toLowerCase()
      );
    }

    if (matched) {
      setCurrentGuest(matched);
    } else {
      const fallbackName = guestParam || `Khách Mời (${inviteParam})`;
      setCurrentGuest({
        id: `guest-custom-${Date.now()}`,
        inviteCode: inviteParam || `INV-${Date.now().toString().slice(-6)}`,
        name: fallbackName,
        salutation: 'Trân trọng kính mời',
        relationship: 'Khách quý',
        customNote: 'Sự hiện diện của bạn là niềm vinh hạnh to lớn!',
        rsvpStatus: 'pending',
        guestCount: 1,
        themeMode: 'dark',
      });
    }
  }, [invitation, inviteParam, guestParam]);

  // Derive theme for this guest (hỗ trợ customTheme, template, và chế độ Sáng/Tối)
  const guestTheme = invitation
    ? resolveGuestTheme(currentGuest, allThemes)
    : THEMES[0];

  if (!invitation || !currentGuest) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-sky-400 font-genz text-sm animate-pulse flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
          Đang tải thiệp mời cá nhân hóa...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-sky-200 selection:text-sky-900">
      {/* VIP Guest Top Banner */}
      <header className="bg-gradient-to-r from-sky-900 via-blue-950 to-slate-950 border-b border-sky-500/30 px-4 py-2.5 text-xs text-sky-200 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white font-genz">
            💌 Thiệp Mời Cá Nhân Hóa Dành Riêng Cho: {currentGuest.name}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono text-[10px] font-black">
            {currentGuest.inviteCode || currentGuest.id}
          </span>
        </div>

        {onNavigateToHome && (
          <button
            onClick={onNavigateToHome}
            className="text-[11px] font-semibold text-sky-300 hover:text-white underline cursor-pointer shrink-0 transition-colors ml-2 flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trang Chủ Sự Kiện</span>
          </button>
        )}
      </header>

      {/* Dedicated Guest View */}
      <main className="flex-1">
        <InteractiveWebInvite
          invitation={invitation}
          currentGuest={currentGuest}
          theme={guestTheme}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onUpdateGuestRsvp={(id, status, count) => onUpdateGuestRsvp(id, status, count)}
          onAddWish={onAddWish}
        />
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

  // Sync theme when guest changes
  useEffect(() => {
    if (currentGuest) {
      const resolved = resolveGuestTheme(currentGuest, allThemes);
      setTheme(resolved);
      if (resolved.layoutConfig) {
        setInvitation((prev) => ({ ...prev, layout: resolved.layoutConfig }));
      }
    }
  }, [currentGuest, allThemes]);

  // Check DB connection status
  useEffect(() => {
    fetchInvitationFromApi('minh-dhbk-2026').then((data) => {
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
                <span className="text-[11px] font-bold text-slate-500 uppercase font-genz">
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
                <span className="text-[11px] font-bold text-emerald-700 uppercase font-genz">
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
                  ({confirmedPax} khách • {rsvpRate}%)
                </span>
              </div>
            </div>

            {/* KPI 3: Templates */}
            <div
              onClick={() => setCurrentView('studio')}
              className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100/60 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700 uppercase font-genz">
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
                <span className="text-[11px] font-bold text-amber-700 uppercase font-genz">
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

  // Fetch SQLite database data on startup
  useEffect(() => {
    fetchInvitationFromApi('minh-dhbk-2026').then((data) => {
      if (data?.invitation) {
        const dbInv = data.invitation;

        if (data.templates?.length > 0) {
          const mappedTpls = data.templates.map((t) => ({
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

        setInvitation((prev) => ({
          ...prev,
          layout: dbInv.layout_settings ? JSON.parse(dbInv.layout_settings) : prev.layout,
          graduate: {
            ...prev.graduate,
            fullName: dbInv.full_name || prev.graduate.fullName,
            nickname: dbInv.nickname || prev.graduate.nickname,
            degree: dbInv.degree || prev.graduate.degree,
            honor: dbInv.honor || prev.graduate.honor,
            school: dbInv.school || prev.graduate.school,
            faculty: dbInv.faculty || prev.graduate.faculty,
            classBatch: dbInv.class_batch || prev.graduate.classBatch,
            avatarUrl: dbInv.avatar_url || prev.graduate.avatarUrl,
            quote: dbInv.quote || prev.graduate.quote,
            spotifySong: dbInv.spotify_song || prev.graduate.spotifySong,
          },
          ceremony: {
            ...prev.ceremony,
            date: dbInv.ceremony_date || prev.ceremony.date,
            time: dbInv.ceremony_time || prev.ceremony.time,
            endExpected: dbInv.end_expected || prev.ceremony.endExpected,
            venueName: dbInv.venue_name || prev.ceremony.venueName,
            address: dbInv.address || prev.ceremony.address,
            mapQuery: dbInv.map_query || prev.ceremony.mapQuery,
            dressCode: dbInv.dress_code || prev.ceremony.dressCode,
            timeline:
              data.timeline?.length > 0
                ? data.timeline.map((t) => ({ time: t.time, title: t.title, desc: t.description }))
                : prev.ceremony.timeline,
          },
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

  // Sync state to localStorage (không lưu wishes vào localStorage để bảo mật)
  useEffect(() => {
    try {
      localStorage.setItem('grad_invite_data', JSON.stringify({ ...invitation, wishes: [] }));
    } catch {}
  }, [invitation]);

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

  const handleUpdateGuestRsvp = (guestId, status, count) => {
    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) =>
        g.id === guestId ? { ...g, rsvpStatus: status, guestCount: count } : g
      ),
    }));
    sendRsvpToApi(guestId, status, count);
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

  // 1. GUEST PORTAL ROUTE (Public — không truyền lưu bút của người khác)
  if (currentRoute.type === 'guest') {
    return (
      <GuestPortal
        invitation={invitationLoaded ? { ...invitation, wishes: [] } : null}
        allThemes={allThemes}
        onAddWish={handleAddWish}
        onUpdateGuestRsvp={handleUpdateGuestRsvp}
        onNavigateToHome={handleNavigateToHome}
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
