import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Palette,
  Eye,
  Users,
  Download,
  Share2,
  Database,
  Wand2,
  LogOut,
  MessageSquare
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  currentGuest,
  guests = [],
  onSelectGuest,
  isDbConnected,
  onOpenExportModal,
  onNavigateToHome,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-sky-100 shadow-xs transition-colors safe-area-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[56px] sm:min-h-[64px] py-1.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo & Link to Public Landing Page */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setCurrentView('studio')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-h-[44px] min-w-[44px] text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black tracking-wide font-genz text-slate-900 flex items-center gap-1.5 truncate">
                GradInvite
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-sans font-extrabold border border-sky-200">
                  ADMIN
                </span>
              </div>
              <div className="text-xs text-sky-600 font-semibold hidden sm:block">
                Hệ Thống Quản Trị Thiệp Mời ✨
              </div>
            </div>
          </button>

          {/* Quick link to Landing Page */}
          {onNavigateToHome && (
            <button
              type="button"
              onClick={onNavigateToHome}
              className="hidden lg:inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition-all cursor-pointer ml-2"
              title="Xem Trang Chủ Công Khai (Landing Page)"
            >
              <Eye className="w-3.5 h-3.5 text-sky-500" />
              <span>Xem Trang Chủ</span>
            </button>
          )}
        </div>

        {/* Center: Main View Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-sky-50/80 border border-sky-100 rounded-2xl text-xs font-bold font-genz">
          <button
            type="button"
            onClick={() => setCurrentView('studio')}
            className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Studio Thiết Kế</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('guests')}
            className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'guests'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>DS Khách & Gửi Thiệp</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('canva')}
            className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'canva'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>Canva Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'preview'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Xem Thử Thiệp Khách</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('wishes')}
            className={`flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'wishes'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Sổ Lưu Bút</span>
          </button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {/* SQLite Status */}
          {isDbConnected && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              DB Connected
            </div>
          )}

          {/* Quick Guest Switcher (nếu có danh sách khách) */}
          {guests.length > 0 && onSelectGuest && (
            <div className="hidden sm:flex items-center gap-1 bg-sky-50/70 border border-sky-100 rounded-xl px-2.5 min-h-[44px] text-xs">
              <span className="text-slate-500 font-medium text-xs">Khách:</span>
              <select
                value={currentGuest?.id || ''}
                onChange={(e) => {
                  const target = guests.find((g) => g.id === e.target.value);
                  if (target) onSelectGuest(target);
                }}
                className="bg-transparent text-sky-800 font-bold focus:outline-none cursor-pointer max-w-[130px] min-h-[40px] truncate font-genz text-xs"
              >
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Card */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer font-genz"
            title="Xuất Ảnh Thiệp"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Ảnh (2K)</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer active:scale-95"
              title="Đăng xuất khỏi trang Quản Trị"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Đăng Xuất</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Tab Switcher Strip (>=44px touch targets, wraps cleanly without page scroll) */}
      <div className="md:hidden border-t border-sky-100 px-3 py-1.5 bg-sky-50/50 flex flex-wrap items-center gap-1.5 text-xs font-bold font-genz">
        <button
          type="button"
          onClick={() => setCurrentView('studio')}
          className={`min-h-[44px] px-3 py-2 rounded-lg whitespace-nowrap ${currentView === 'studio' ? 'bg-sky-500 text-white' : 'text-slate-700 bg-white border border-sky-100'}`}
        >
          Studio
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('guests')}
          className={`min-h-[44px] px-3 py-2 rounded-lg whitespace-nowrap ${currentView === 'guests' ? 'bg-sky-500 text-white' : 'text-slate-700 bg-white border border-sky-100'}`}
        >
          DS Khách
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('canva')}
          className={`min-h-[44px] px-3 py-2 rounded-lg whitespace-nowrap ${currentView === 'canva' ? 'bg-sky-500 text-white' : 'text-slate-700 bg-white border border-sky-100'}`}
        >
          Canva
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('preview')}
          className={`min-h-[44px] px-3 py-2 rounded-lg whitespace-nowrap ${currentView === 'preview' ? 'bg-sky-500 text-white' : 'text-slate-700 bg-white border border-sky-100'}`}
        >
          Xem Thử
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('wishes')}
          className={`min-h-[44px] px-3 py-2 rounded-lg whitespace-nowrap ${currentView === 'wishes' ? 'bg-sky-500 text-white' : 'text-slate-700 bg-white border border-sky-100'}`}
        >
          Lưu Bút
        </button>
      </div>
    </header>
  );
}
