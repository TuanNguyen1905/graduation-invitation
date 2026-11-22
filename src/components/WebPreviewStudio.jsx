import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  Maximize2,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  Download,
  Check,
  Copy,
  Users,
  Palette,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Save
} from 'lucide-react';
import InteractiveWebInvite from './InteractiveWebInvite';
import { getGuestInvitationUrl } from '../utils/inviteHelper';
import { updateGuestInApi } from '../services/api';

export default function WebPreviewStudio({
  invitation,
  setInvitation,
  currentGuest,
  setCurrentGuest,
  theme,
  setTheme,
  allThemes = [],
  onOpenExportModal,
  onUpdateGuestRsvp,
  onAddWish
}) {
  // Device Mode: 'mobile' (390px), 'tablet' (768px), 'desktop' (100%), 'custom'
  const [deviceMode, setDeviceMode] = useState('mobile');
  const [customWidth, setCustomWidth] = useState(390);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showBezel, setShowBezel] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavingGuestTheme, setIsSavingGuestTheme] = useState(false);
  const [savedGuestThemeSuccess, setSavedGuestThemeSuccess] = useState(false);

  const handleSaveGuestTheme = async () => {
    if (!currentGuest) return;
    setIsSavingGuestTheme(true);
    try {
      const nextThemeId = theme?.id || currentGuest.themeId || 'neon-cyber';
      const nextMode = theme?.mode || currentGuest.themeMode || 'dark';
      const nextCustomTheme = theme?.isCustom
        ? {
            id: theme.id,
            name: theme.name,
            bgGradient: theme.bgGradient,
            accentColor: theme.accentColor,
            textAccent: theme.textAccent,
            fontTitle: theme.fontTitle,
            cardBg: theme.cardBg,
            mode: nextMode,
            isCustom: true
          }
        : null;

      await updateGuestInApi({
        id: currentGuest.id,
        themeId: nextThemeId,
        themeMode: nextMode,
        customTheme: nextCustomTheme
      });

      const updatedGuest = {
        ...currentGuest,
        themeId: nextThemeId,
        themeMode: nextMode,
        customTheme: nextCustomTheme
      };
      if (setCurrentGuest) setCurrentGuest(updatedGuest);
      if (setInvitation) {
        setInvitation((prev) => ({
          ...prev,
          guests: (prev.guests || []).map((g) => (g.id === currentGuest.id ? updatedGuest : g))
        }));
      }
      setSavedGuestThemeSuccess(true);
      setTimeout(() => setSavedGuestThemeSuccess(false), 2200);
    } catch (err) {
      alert(`Không thể lưu giao diện cho thiệp này: ${err.message}`);
    } finally {
      setIsSavingGuestTheme(false);
    }
  };

  // Derive active dimensions
  const getFrameDimensions = () => {
    if (deviceMode === 'desktop') {
      return { width: '100%', maxWidth: '100%', height: '100%' };
    }

    let baseW = 390;
    let baseH = 844;

    if (deviceMode === 'tablet') {
      baseW = 768;
      baseH = 960;
    } else if (deviceMode === 'custom') {
      baseW = customWidth;
      baseH = 800;
    }

    const finalW = isLandscape ? baseH : baseW;
    const finalH = isLandscape ? baseW : baseH;

    return {
      width: `${finalW}px`,
      maxWidth: `${finalW}px`,
      height: `${finalH}px`
    };
  };

  const frameDims = getFrameDimensions();
  const guestUrl = currentGuest ? getGuestInvitationUrl(currentGuest) : '';

  const handleCopyLink = () => {
    if (!guestUrl) return;
    navigator.clipboard.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    if (!guestUrl) return;
    window.open(guestUrl, '_blank');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900/95 flex flex-col font-sans select-none">
      
      {/* ── TOP PREVIEW CONTROL TOOLBAR ────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-sky-100 px-4 sm:px-6 py-2.5 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: Device Preset Buttons */}
          <div className="flex items-center gap-1 bg-sky-50 p-1 rounded-2xl border border-sky-100 font-genz">
            <button
              onClick={() => {
                setDeviceMode('mobile');
                setCustomWidth(390);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
              title="Khung điện thoại di động (Mobile 390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (390px)</span>
            </button>

            <button
              onClick={() => {
                setDeviceMode('tablet');
                setCustomWidth(768);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                deviceMode === 'tablet'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
              title="Khung máy tính bảng (Tablet 768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet (768px)</span>
            </button>

            <button
              onClick={() => {
                setDeviceMode('desktop');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
              title="Khung máy tính để bàn (Toàn màn hình)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Toàn Màn Hình</span>
            </button>
          </div>

          {/* Middle: Width Slider & Orientation Controls */}
          <div className="hidden lg:flex items-center gap-4 bg-sky-50/60 px-3.5 py-1 rounded-2xl border border-sky-100">
            {/* Slider */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-slate-500 text-[11px] font-bold">Chiều rộng:</span>
              <input
                type="range"
                min="360"
                max="1200"
                step="10"
                value={deviceMode === 'desktop' ? 1200 : customWidth}
                onChange={(e) => {
                  setDeviceMode('custom');
                  setCustomWidth(Number(e.target.value));
                }}
                className="w-28 sm:w-36 accent-sky-500 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-sky-700 font-black w-14">
                {deviceMode === 'desktop' ? '100%' : `${deviceMode === 'custom' ? customWidth : frameDims.width}`}
              </span>
            </div>

            {/* Rotate Orientation (only for mobile/tablet) */}
            {deviceMode !== 'desktop' && (
              <button
                onClick={() => setIsLandscape(!isLandscape)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                  isLandscape
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-50'
                }`}
                title="Xoay dọc / Xoay ngang màn hình"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isLandscape ? 'Ngang' : 'Dọc'}</span>
              </button>
            )}

            {/* Bezel Frame Toggle */}
            {deviceMode !== 'desktop' && (
              <button
                onClick={() => setShowBezel(!showBezel)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  showBezel
                    ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
                title="Bật/Tắt viền mô phỏng điện thoại thật"
              >
                {showBezel ? 'Viền Mockup: Bật' : 'Viền Mockup: Tắt'}
              </button>
            )}
          </div>

          {/* Right: Guest & Quick Link Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Quick Guest Selector */}
            {setCurrentGuest && (invitation.guests || []).length > 0 && (
              <div className="flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 text-xs shadow-2xs">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-slate-500 font-medium hidden sm:inline text-[11px]">Xem của:</span>
                <select
                  value={currentGuest?.id || ''}
                  onChange={(e) => {
                    const found = (invitation.guests || []).find((g) => g.id === e.target.value);
                    if (found) {
                      setCurrentGuest(found);
                      if (setTheme) {
                        const matchedTheme = allThemes.find((t) => t.id === found.themeId) || theme;
                        if (matchedTheme || found.customTheme) {
                          setTheme({
                            ...(matchedTheme || {}),
                            ...(found.customTheme || {}),
                            mode: found.themeMode || found.customTheme?.mode || matchedTheme?.mode || 'dark'
                          });
                        }
                      }
                    }
                  }}
                  className="bg-transparent text-sky-800 font-bold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate font-genz text-xs"
                >
                  {(invitation.guests || []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.themeMode === 'light' ? '☀️ Sáng' : '🌙 Tối'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Template Selector */}
            {setTheme && allThemes.length > 0 && (
              <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-sky-200 text-xs shadow-2xs">
                <Palette className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <select
                  value={theme?.id || ''}
                  onChange={(e) => {
                    const picked = allThemes.find((t) => t.id === e.target.value);
                    if (picked) {
                      setTheme({
                        ...picked,
                        mode: theme?.mode || picked.mode || 'dark',
                        isCustom: false
                      });
                    }
                  }}
                  className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[140px] truncate text-xs"
                  title="Đổi mẫu giao diện nhanh"
                >
                  {allThemes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  {theme?.isCustom && !allThemes.some((t) => t.id === theme.id) && (
                    <option value={theme.id}>{theme.name || 'Màu tùy chỉnh'}</option>
                  )}
                </select>
              </div>
            )}

            {/* Quick Sáng / Tối Preview Switch */}
            {setTheme && (
              <button
                type="button"
                onClick={() => {
                  const nextMode = theme?.mode === 'light' ? 'dark' : 'light';
                  setTheme((prev) => ({ ...prev, mode: nextMode }));
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                  theme?.mode === 'light'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                    : 'bg-slate-900 border-slate-700 text-sky-300 hover:bg-slate-800'
                }`}
                title={theme?.mode === 'light' ? 'Đang xem chế độ Sáng (Click để đổi sang Tối)' : 'Đang xem chế độ Tối (Click để đổi sang Sáng)'}
              >
                {theme?.mode === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="hidden sm:inline">Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                    <span className="hidden sm:inline">Tối</span>
                  </>
                )}
              </button>
            )}

            {/* Save Theme & Mode directly for current sent guest */}
            {currentGuest && (
              <button
                type="button"
                onClick={handleSaveGuestTheme}
                disabled={isSavingGuestTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-sm font-genz ${
                  savedGuestThemeSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20'
                }`}
                title={`Lưu mẫu & chế độ ${theme?.mode === 'light' ? 'Sáng' : 'Tối'} hiện tại vào thiệp đã gửi của ${currentGuest.name}`}
              >
                {savedGuestThemeSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isSavingGuestTheme ? 'Đang lưu...' : savedGuestThemeSuccess ? 'Đã cập nhật thiệp!' : 'Lưu cho thiệp này'}
                </span>
              </button>
            )}

            {/* Copy Guest Link */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-bold border border-sky-200 flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
              title="Sao chép link thiệp mời của khách này"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-sky-500" />}
              <span className="hidden md:inline">{copiedLink ? 'Đã chép!' : 'Chép Link'}</span>
            </button>

            {/* Open in New Tab */}
            <button
              onClick={handleOpenExternal}
              className="p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-bold border border-sky-200 flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
              title="Mở thiệp mời trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">Mở Tab Mới</span>
            </button>

            {/* Export Card Button */}
            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-white font-black text-xs shadow-md shadow-sky-500/20 cursor-pointer transition-all flex items-center gap-1.5 font-genz"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất Ảnh</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── PREVIEW CANVAS WORKSPACE ───────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-8 flex items-center justify-center overflow-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {deviceMode === 'desktop' ? (
          /* Desktop / Full Width View */
          <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 min-h-[85vh]">
            <InteractiveWebInvite
              invitation={invitation}
              currentGuest={currentGuest}
              theme={theme}
              onOpenExportModal={onOpenExportModal}
              onUpdateGuestRsvp={onUpdateGuestRsvp}
              onAddWish={onAddWish}
              initialOpenedEnvelope={true}
              canViewWishes={true}
            />
          </div>
        ) : showBezel ? (
          /* Device Mockup with Realistic Hardware Bezel */
          <div
            className={`relative rounded-[48px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border-4 border-slate-700/80 transition-all duration-300 ${
              isLandscape ? 'rounded-[36px]' : ''
            }`}
            style={{
              width: frameDims.width,
              maxWidth: '95vw',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 50px rgba(14, 165, 233, 0.15)'
            }}
          >
            {/* Dynamic Camera Notch / Dynamic Island */}
            {!isLandscape ? (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30 shadow-inner flex items-center justify-end pr-3">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
              </div>
            ) : (
              <div className="absolute top-1/2 left-6 -translate-y-1/2 w-4 h-24 bg-slate-950 rounded-full z-30 shadow-inner"></div>
            )}

            {/* Inner Phone Screen */}
            <div
              className={`relative w-full rounded-[36px] overflow-y-auto bg-slate-950 scrollbar-thin scrollbar-thumb-sky-500/20`}
              style={{ height: frameDims.height }}
            >
              <InteractiveWebInvite
                invitation={invitation}
                currentGuest={currentGuest}
                theme={theme}
                onOpenExportModal={onOpenExportModal}
                onUpdateGuestRsvp={onUpdateGuestRsvp}
                onAddWish={onAddWish}
                initialOpenedEnvelope={true}
                canViewWishes={true}
              />
            </div>
          </div>
        ) : (
          /* Flat Borderless Resizable Card Frame */
          <div
            className="rounded-3xl overflow-hidden shadow-2xl border border-sky-500/30 bg-slate-950 transition-all duration-300"
            style={{
              width: frameDims.width,
              maxWidth: '95vw',
              height: frameDims.height
            }}
          >
            <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-sky-500/20">
              <InteractiveWebInvite
                invitation={invitation}
                currentGuest={currentGuest}
                theme={theme}
                onOpenExportModal={onOpenExportModal}
                onUpdateGuestRsvp={onUpdateGuestRsvp}
                onAddWish={onAddWish}
                initialOpenedEnvelope={true}
                canViewWishes={true}
              />
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

