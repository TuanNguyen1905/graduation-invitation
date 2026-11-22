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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-sky-100 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Link to Public Landing Page */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setCurrentView('studio')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <div>
              <div className="text-base font-black tracking-wide font-genz text-slate-900 flex items-center gap-1.5">
                GradInvite
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-sans font-extrabold border border-sky-200">
                  PRO ADMIN
                </span>
              </div>
              <div className="text-[10px] text-sky-600 font-semibold hidden sm:block">
                Hệ Thống Quản Trị Thiệp Mời ✨
              </div>
            </div>
          </div>

          {/* Quick link to Landing Page */}
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition-all cursor-pointer ml-2"
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
            onClick={() => setCurrentView('studio')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Studio Thiết Kế</span>
          </button>

          <button
            onClick={() => setCurrentView('guests')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'guests'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>DS Khách & Gửi Thiệp</span>
          </button>

          <button
            onClick={() => setCurrentView('canva')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'canva'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>Canva Editor</span>
          </button>

          <button
            onClick={() => setCurrentView('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'preview'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Xem Thử Thiệp Khách</span>
          </button>

          <button
            onClick={() => setCurrentView('wishes')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
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
        <div className="flex items-center gap-2.5">
          {/* SQLite Status */}
          {isDbConnected && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SQLite WAL Active
            </div>
          )}

          {/* Quick Guest Switcher (nếu có danh sách khách) */}
          {guests.length > 0 && onSelectGuest && (
            <div className="hidden sm:flex items-center gap-1 bg-sky-50/70 border border-sky-100 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Khách:</span>
              <select
                value={currentGuest?.id || ''}
                onChange={(e) => {
                  const target = guests.find((g) => g.id === e.target.value);
                  if (target) onSelectGuest(target);
                }}
                className="bg-transparent text-sky-800 font-bold focus:outline-none cursor-pointer max-w-[130px] truncate font-genz text-xs"
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
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer font-genz"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Ảnh (2K)</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer active:scale-95"
              title="Đăng xuất khỏi trang Quản Trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Đăng Xuất</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Tab Switcher Strip */}
      <div className="md:hidden border-t border-sky-100 px-4 py-2 bg-sky-50/50 flex items-center justify-between gap-1 overflow-x-auto text-xs font-bold font-genz">
        <button
          onClick={() => setCurrentView('studio')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentView === 'studio' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
        >
          Studio
        </button>
        <button
          onClick={() => setCurrentView('guests')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentView === 'guests' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
        >
          DS Khách
        </button>
        <button
          onClick={() => setCurrentView('canva')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentView === 'canva' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
        >
          Canva
        </button>
        <button
          onClick={() => setCurrentView('preview')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentView === 'preview' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
        >
          Xem Thử
        </button>
        <button
          onClick={() => setCurrentView('wishes')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentView === 'wishes' ? 'bg-sky-500 text-white' : 'text-slate-600'}`}
        >
          Lưu Bút
        </button>
      </div>
    </header>
  );
}
