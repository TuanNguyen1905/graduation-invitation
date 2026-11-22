import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  User,
  School,
  Calendar,
  Clock,
  MapPin,
  Palette,
  Users,
  Image as ImageIcon,
  Smartphone,
  Eye,
  Plus,
  Trash2,
  Download,
  Share2,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  EyeOff,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  Maximize2,
  Sliders,
  CheckCircle2,
  Heart,
  Smile,
  Sun,
  Moon,
  Pipette,
  SlidersHorizontal,
  RefreshCw,
  Save,
  BookmarkCheck,
  Check,
  Tablet,
  Monitor,
  RotateCw
} from 'lucide-react';
import { THEMES, DEFAULT_LAYOUT, DYNAMIC_COLOR_PRESETS, createDynamicTheme } from '../data/mockData';
import InteractiveWebInvite from './InteractiveWebInvite';
import {
  saveCustomTemplateToApi,
  deleteCustomTemplateFromApi,
  updateInvitationToApi,
  uploadImageToApi,
  updateGuestInApi,
  applyThemeToAllGuestsInApi
} from '../services/api';

export default function DesignStudio({
  invitation,
  setInvitation,
  currentGuest,
  setCurrentGuest,
  theme,
  setTheme,
  customTemplates = [],
  setCustomTemplates,
  onOpenExportModal,
  onSwitchToGuestView
}) {
  const [activeTab, setActiveTab] = useState('layout'); // 'layout', 'graduate', 'ceremony', 'theme', 'timeline'

  // Dynamic Color and Mode State
  const [customPrimary, setCustomPrimary] = useState(theme.accentColor || '#0284c7');
  const [customSecondary, setCustomSecondary] = useState(theme.secondaryColor || '#38bdf8');
  const [customEnvelope, setCustomEnvelope] = useState(theme.envelopeColor || '#082f49');
  const [customSeal, setCustomSeal] = useState(theme.sealColor || '#0284c7');

  // Template Builder State
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBadge, setNewTemplateBadge] = useState('Mẫu thiết kế tùy chỉnh ✨');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Preview Frame Controller State
  const [previewWidth, setPreviewWidth] = useState(390); // 360, 390, 430, 560
  const [previewBezel, setPreviewBezel] = useState(true);

  const currentMode = theme.mode || 'dark';

  const handleSaveAsNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Vui lòng nhập tên cho mẫu Template mới!');
      return;
    }

    setIsSavingTemplate(true);
    const tplId = `tpl-custom-${Date.now()}`;
    const newTplObj = {
      ...createDynamicTheme({
        name: newTemplateName.trim(),
        mode: currentMode,
        primary: customPrimary,
        secondary: customSecondary,
        envelope: customEnvelope,
        seal: customSeal
      }),
      id: tplId,
      badge: newTemplateBadge.trim() || 'Mẫu thiết kế đã lưu ✨',
      layoutConfig: invitation.layout || DEFAULT_LAYOUT,
      isSavedTemplate: true
    };

    if (setCustomTemplates) {
      setCustomTemplates((prev) => [newTplObj, ...prev]);
    }
    setTheme(newTplObj);

    // Lưu vào SQLite Database
    await saveCustomTemplateToApi({
      id: tplId,
      name: newTemplateName.trim(),
      badge: newTemplateBadge.trim() || 'Mẫu thiết kế đã lưu ✨',
      mode: currentMode,
      primaryColor: customPrimary,
      secondaryColor: customSecondary,
      envelopeColor: customEnvelope,
      sealColor: customSeal,
      layoutConfig: invitation.layout || DEFAULT_LAYOUT
    });

    setIsSavingTemplate(false);
    setNewTemplateName('');
    alert(`Đã lưu mẫu template "${newTplObj.name}" vào hệ thống!`);
  };

  const handleDeleteTemplate = async (tplId, e) => {
    e.stopPropagation();
    if (setCustomTemplates) {
      setCustomTemplates((prev) => prev.filter((t) => t.id !== tplId));
    }
    await deleteCustomTemplateFromApi(tplId);
  };

  const handleApplyDynamicTheme = (updates = {}) => {
    const primary = updates.primary || customPrimary;
    const secondary = updates.secondary || customSecondary;
    const envelope = updates.envelope || customEnvelope;
    const seal = updates.seal || customSeal;
    const mode = updates.mode || currentMode;

    const dynamicTheme = createDynamicTheme({
      name: "Tùy Biến Cá Nhân",
      mode,
      primary,
      secondary,
      envelope,
      seal
    });

    setTheme(dynamicTheme);
  };

  const handleSelectPreset = (preset) => {
    setCustomPrimary(preset.primary);
    setCustomSecondary(preset.secondary);
    setCustomEnvelope(preset.envelope);
    setCustomSeal(preset.seal);

    handleApplyDynamicTheme({
      primary: preset.primary,
      secondary: preset.secondary,
      envelope: preset.envelope,
      seal: preset.seal
    });
  };

  const handleToggleThemeMode = (newMode) => {
    if (theme.isCustom) {
      handleApplyDynamicTheme({ mode: newMode });
    } else {
      const isLight = newMode === 'light';
      setTheme((prev) => ({
        ...prev,
        mode: newMode,
        background: isLight ? 'from-slate-50 via-sky-50/50 to-slate-100' : (THEMES.find(t => t.id === prev.id)?.background || 'from-slate-950 via-slate-900 to-slate-950'),
        cardBg: isLight ? 'bg-white/95 text-slate-800 border-slate-200 shadow-xl' : (THEMES.find(t => t.id === prev.id)?.cardBg || 'bg-slate-900/90 text-slate-100 border-white/10 shadow-2xl')
      }));
    }
  };

  const { graduate, ceremony, guests } = invitation;
  const layout = invitation.layout || DEFAULT_LAYOUT;
  const sections = layout.sections || DEFAULT_LAYOUT.sections;

  // State quản lý việc lưu dữ liệu vào SQLite
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'uploading' | 'error' | null
  const [saveMessage, setSaveMessage] = useState('');

  // Chuẩn bị payload theme (hỗ trợ cả Template có sẵn lẫn Bộ màu tùy biến riêng)
  const getThemeSyncPayload = () => {
    const customThemePayload = theme.isCustom
      ? {
          name: theme.name || 'Tùy Biến Cá Nhân',
          mode: currentMode,
          primary: customPrimary,
          secondary: customSecondary,
          envelope: customEnvelope,
          seal: customSeal
        }
      : null;
    return {
      themeId: theme.isCustom ? (currentGuest?.themeId || 'genz-ocean-blue') : theme.id,
      themeMode: currentMode,
      customTheme: customThemePayload
    };
  };

  // Áp dụng & lưu giao diện hiện tại cho thiệp đã gửi của khách đang chọn
  const handleApplyThemeToCurrentGuest = async () => {
    if (!currentGuest?.id) return;
    setIsSaving(true);
    const payload = getThemeSyncPayload();

    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => (g.id === currentGuest.id ? { ...g, ...payload } : g))
    }));
    setCurrentGuest((prev) => (prev ? { ...prev, ...payload } : prev));

    const res = await updateGuestInApi({ id: currentGuest.id, ...payload });
    await updateInvitationToApi(invitation);
    setIsSaving(false);

    if (res?.success) {
      setSaveStatus('saved');
      setSaveMessage(`Đã cập nhật giao diện thiệp đã gửi của "${currentGuest.name}"!`);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  // Áp dụng & lưu giao diện hiện tại cho TẤT CẢ thiệp đã tạo/đã gửi
  const handleApplyThemeToAllSent = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn áp dụng giao diện, màu sắc & chế độ Sáng/Tối hiện tại cho TOÀN BỘ thiệp đã gửi không?')) {
      return;
    }
    setIsSaving(true);
    const payload = getThemeSyncPayload();

    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => ({ ...g, ...payload }))
    }));
    if (currentGuest) {
      setCurrentGuest((prev) => ({ ...prev, ...payload }));
    }

    const res = await applyThemeToAllGuestsInApi({
      invitationId: 'minh-dhbk-2026',
      ...payload
    });
    await updateInvitationToApi(invitation);
    setIsSaving(false);

    if (res?.success) {
      setSaveStatus('saved');
      setSaveMessage(`Đã đồng bộ giao diện mới cho tất cả (${res.updatedCount}) thiệp đã gửi!`);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  // Hàm lưu toàn bộ thay đổi (Text, Thời gian, Địa điểm, Ảnh, Bố cục) vào SQLite Database
  const handleSaveAllChanges = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await updateInvitationToApi(invitation);
      if (res?.success) {
        setSaveStatus('saved');
        setSaveMessage('Đã lưu toàn bộ thay đổi text & ảnh vào Database!');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus('error');
        setSaveMessage(res?.error || 'Không thể lưu vào database');
        setTimeout(() => setSaveStatus(null), 3500);
      }
    } catch {
      setSaveStatus('error');
      setSaveMessage('Lỗi kết nối máy chủ SQLite');
      setTimeout(() => setSaveStatus(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Tự động lưu sau 2.5 giây khi người dùng dừng gõ chữ hoặc điều chỉnh bố cục (Debounced Auto-save)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateInvitationToApi(invitation);
    }, 2500);
    return () => clearTimeout(timer);
  }, [invitation]);

  // Compress uploaded image in browser so Data URL stays lightweight for Cloud Firestore
  const compressImageFile = (file, maxDim = 900, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (event) => {
        const rawUrl = event.target.result;
        const img = new Image();
        img.onerror = () => resolve(rawUrl);
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(rawUrl);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });

  // Handle file upload for graduate avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaveStatus('uploading');
      setSaveMessage('Đang xử lý & lưu ảnh...');
      try {
        const base64 = await compressImageFile(file);
        // 1. Cập nhật preview ngay lập tức
        setInvitation((prev) => ({
          ...prev,
          graduate: { ...prev.graduate, avatarUrl: base64 }
        }));

        // 2. Tải ảnh lên server (lưu file ở local hoặc Data URL nén trên Cloud Firestore)
        const uploadRes = await uploadImageToApi(base64, file.name);
        if (uploadRes?.success && uploadRes?.url) {
          setInvitation((prev) => {
            const updated = {
              ...prev,
              graduate: { ...prev.graduate, avatarUrl: uploadRes.url }
            };
            updateInvitationToApi(updated);
            return updated;
          });
          setSaveStatus('saved');
          setSaveMessage('Đã tải ảnh lên & lưu thành công!');
          setTimeout(() => setSaveStatus(null), 3500);
        } else {
          setInvitation((prev) => {
            updateInvitationToApi(prev);
            return prev;
          });
          setSaveStatus('saved');
          setSaveMessage('Đã lưu ảnh đại diện vào Database!');
          setTimeout(() => setSaveStatus(null), 3500);
        }
      } catch {
        setSaveStatus(null);
      }
    }
  };

  const handleUpdateGraduate = (field, val) => {
    setInvitation((prev) => ({
      ...prev,
      graduate: { ...prev.graduate, [field]: val }
    }));
  };

  const handleUpdateCeremony = (field, val) => {
    setInvitation((prev) => ({
      ...prev,
      ceremony: { ...prev.ceremony, [field]: val }
    }));
  };

  const handleTimelineChange = (index, field, val) => {
    const newTimeline = [...ceremony.timeline];
    newTimeline[index] = { ...newTimeline[index], [field]: val };
    handleUpdateCeremony('timeline', newTimeline);
  };

  const handleAddTimelineStep = () => {
    const newTimeline = [
      ...ceremony.timeline,
      { time: '11:30', title: 'Tiệc liên hoan chúc mừng', desc: 'Dùng tiệc trà ấm cúng cùng thầy cô và bạn bè.' }
    ];
    handleUpdateCeremony('timeline', newTimeline);
  };

  const handleRemoveTimelineStep = (index) => {
    const newTimeline = ceremony.timeline.filter((_, i) => i !== index);
    handleUpdateCeremony('timeline', newTimeline);
  };

  /* --- LAYOUT BUILDER ACTIONS --- */

  const handleToggleSection = (sectionId) => {
    const updatedSections = sections.map((sec) =>
      sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
    );
    setInvitation((prev) => ({
      ...prev,
      layout: { ...layout, sections: updatedSections }
    }));
  };

  const handleMoveSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    setInvitation((prev) => ({
      ...prev,
      layout: { ...layout, sections: newSections }
    }));
  };

  const handleUpdateLayoutSetting = (key, val) => {
    setInvitation((prev) => ({
      ...prev,
      layout: { ...layout, [key]: val }
    }));
  };

  const handleResetLayout = () => {
    setInvitation((prev) => ({
      ...prev,
      layout: DEFAULT_LAYOUT
    }));
  };

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-800 flex flex-col font-sans">
      
      {/* Studio Sub-Header - White & Soft Ocean Blue */}
      <div className="bg-white border-b border-sky-100 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 font-genz shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <LayoutGrid className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">Studio Thiết Kế & Bố Cục (Layout)</h2>
            <p className="text-xs text-slate-500">Tùy biến tự do thứ tự các khối, chọn tone màu theo từng đối tượng</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview as which guest */}
          <div className="flex items-center gap-2 bg-sky-50/80 px-3 py-1.5 rounded-xl border border-sky-200 text-xs shadow-sm">
            <span className="text-slate-500 font-medium">Đang xem theo:</span>
            <select
              value={currentGuest?.id || ''}
              onChange={(e) => {
                const found = guests.find((g) => g.id === e.target.value);
                if (found) {
                  setCurrentGuest(found);
                  if (found.themeId) {
                    const matchedTheme = THEMES.find((t) => t.id === found.themeId);
                    if (matchedTheme) setTheme(matchedTheme);
                  }
                }
              }}
              className="bg-transparent text-sky-700 font-bold focus:outline-none cursor-pointer"
            >
              {guests.map((g) => (
                <option key={g.id} value={g.id} className="bg-white text-slate-900">
                  {g.salutation} {g.name} ({g.gender === 'female' ? '👩 Nữ' : g.gender === 'male' ? '👨 Nam' : '👥 Nhóm'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onSwitchToGuestView}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 cursor-pointer shadow-sm transition-all"
          >
            <Eye className="w-4 h-4 text-sky-500" />
            Trang Web Khách Mời
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:brightness-105 text-white text-xs font-black shadow-md shadow-sky-500/20 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            Xuất Ảnh (2K)
          </button>

          {/* Nút Lưu Toàn Bộ Cập Nhật vào SQLite */}
          <button
            onClick={handleSaveAllChanges}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer font-genz active:scale-95 ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-300'
                : saveStatus === 'error'
                ? 'bg-rose-600 shadow-rose-500/25'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 shadow-sky-500/25'
            }`}
            title="Lưu toàn bộ thay đổi thông tin cử nhân, thời gian, địa điểm, timeline, ảnh vào Database"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Đang Lưu...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Đã Lưu Database!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-sky-200" />
                <span>Lưu Thay Đổi 💾</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT COLUMN: White & Light Sky Blue Editor Sidebar */}
        <div className="lg:col-span-5 xl:col-span-5 border-r border-sky-100 bg-white overflow-y-auto max-h-[calc(100vh-120px)] p-4 sm:p-6 space-y-6 shadow-sm">
          
          {/* Notification Alert for Save Status */}
          {saveStatus && (
            <div className={`p-3 rounded-2xl text-xs font-bold border flex items-center justify-between transition-all ${
              saveStatus === 'saved'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : saveStatus === 'uploading'
                ? 'bg-sky-50 text-sky-800 border-sky-200 animate-pulse'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <span className="flex items-center gap-1.5">
                {saveStatus === 'saved' && <Check className="w-4 h-4 text-emerald-600" />}
                {saveStatus === 'uploading' && <span className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />}
                {saveMessage || (saveStatus === 'saved' ? 'Đã lưu thay đổi vào cơ sở dữ liệu SQLite!' : 'Đang xử lý...')}
              </span>
              <span className="text-[10px] font-mono opacity-80 font-normal">SQLite WAL</span>
            </div>
          )}

          {/* Navigation Tabs (5 Tabs with Layout First!) */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-sky-50 border border-sky-100 text-xs font-bold font-genz">
            <button
              onClick={() => setActiveTab('layout')}
              className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'layout' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              Bố Cục ✨
            </button>
            <button
              onClick={() => setActiveTab('graduate')}
              className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'graduate' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              Cử Nhân
            </button>
            <button
              onClick={() => setActiveTab('ceremony')}
              className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'ceremony' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              Lễ Trao Bằng
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'theme' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              Tone Màu
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
                activeTab === 'timeline' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              Lịch Trình
            </button>
          </div>

          {/* TAB: CUSTOM LAYOUT BUILDER */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              
              {/* Top Layout Style Settings */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2 font-genz">
                    <Sliders className="w-4 h-4 text-sky-500" />
                    Tùy Biến Kiểu Dáng Thiệp
                  </h4>
                  <button
                    onClick={handleResetLayout}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                    title="Khôi phục thứ tự và thiết lập ban đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Mặc định
                  </button>
                </div>

                {/* Avatar Style Picker */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-700 font-semibold">Kiểu hiển thị ảnh chân dung:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'circle', label: 'Tròn Neon Glow', desc: 'Gen Z Glow' },
                      { id: 'polaroid', label: 'Khung Polaroid', desc: 'Ảnh film cute' },
                      { id: 'banner', label: 'Toàn cảnh Banner', desc: 'Hiện đại' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleUpdateLayoutSetting('avatarStyle', opt.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          layout.avatarStyle === opt.id
                            ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                            : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        <div className="text-xs">{opt.label}</div>
                        <div className="text-[10px] opacity-80">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment & Roundness */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Căn lề nội dung:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateLayoutSetting('alignment', 'center')}
                        className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                          layout.alignment === 'center'
                            ? 'bg-sky-500 text-white border-sky-500 font-bold'
                            : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                        Căn Giữa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateLayoutSetting('alignment', 'left')}
                        className={`flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                          layout.alignment === 'left'
                            ? 'bg-sky-500 text-white border-sky-500 font-bold'
                            : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        Căn Trái
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Độ bo góc khối thiệp:</label>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'rounded-none', label: 'Vuông' },
                        { id: 'rounded-xl', label: 'Vừa' },
                        { id: 'rounded-3xl', label: 'Tròn' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUpdateLayoutSetting('cardRoundness', item.id)}
                          className={`flex-1 py-2 rounded-xl border text-xs cursor-pointer ${
                            layout.cardRoundness === item.id
                              ? 'bg-sky-500 text-white border-sky-500 font-bold'
                              : 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Section Ordering & Toggle Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-2 font-genz">
                    <LayoutGrid className="w-4 h-4 text-sky-500" />
                    Sắp Xếp & Ẩn / Hiện Các Khối Thiệp ({sections.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Dùng ⬆️ ⬇️ để đổi thứ tự</span>
                </div>

                <div className="space-y-2">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        sec.enabled
                          ? 'bg-white border-sky-200 shadow-sm hover:border-sky-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Left: Move buttons + Name */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, -1)}
                            className="p-1 rounded hover:bg-sky-50 text-slate-400 hover:text-sky-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Di chuyển lên trên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMoveSection(idx, 1)}
                            className="p-1 rounded hover:bg-sky-50 text-slate-400 hover:text-sky-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Di chuyển xuống dưới"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="w-6 text-center font-mono text-xs text-slate-400 font-bold">
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-genz">
                            {sec.label}
                          </div>
                          <div className="text-[10px] text-slate-500">{sec.desc}</div>
                        </div>
                      </div>

                      {/* Right: Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleSection(sec.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-genz flex items-center gap-1.5 ${
                          sec.enabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {sec.enabled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Đang hiện
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Đã ẩn
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: GRADUATE INFORMATION */}
          {activeTab === 'graduate' && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-bold text-sky-800 tracking-wider flex items-center gap-2 font-genz">
                <User className="w-4 h-4 text-sky-500" />
                Thông Tin Tân Cử Nhân
              </h3>

              {/* Photo Upload */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Ảnh Chân Dung Cử Nhân:
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={graduate.avatarUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-sky-400 shadow-md"
                  />
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-xs text-sky-700 font-bold cursor-pointer border border-sky-200 shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                      Tải ảnh từ máy tính
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">Khuyên dùng ảnh chụp kỷ yếu hoặc trang phục cử nhân sắc nét.</p>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Cử Nhân:</label>
                  <input
                    type="text"
                    value={graduate.fullName}
                    onChange={(e) => handleUpdateGraduate('fullName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nickname / Biệt Danh (Gen Z):</label>
                  <input
                    type="text"
                    value={graduate.nickname || ''}
                    onChange={(e) => handleUpdateGraduate('nickname', e.target.value)}
                    placeholder="VD: Minh Minzy, Bảo Bảo..."
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học Vị / Ngành Học:</label>
                  <input
                    type="text"
                    value={graduate.degree}
                    onChange={(e) => handleUpdateGraduate('degree', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh Hiệu Tốt Nghiệp (Nổi bật):</label>
                  <input
                    type="text"
                    value={graduate.honor}
                    onChange={(e) => handleUpdateGraduate('honor', e.target.value)}
                    placeholder="VD: Tốt nghiệp loại Xuất sắc, Thủ khoa..."
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Trường Đại Học / Viện:</label>
                  <input
                    type="text"
                    value={graduate.school}
                    onChange={(e) => handleUpdateGraduate('school', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khoa / Bộ Môn:</label>
                  <input
                    type="text"
                    value={graduate.faculty}
                    onChange={(e) => handleUpdateGraduate('faculty', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bài Hát Spotify Yêu Thích:</label>
                  <input
                    type="text"
                    value={graduate.spotifySong || ''}
                    onChange={(e) => handleUpdateGraduate('spotifySong', e.target.value)}
                    placeholder="VD: Thanh Xuân • Da LAB"
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thông Điệp / Trích Dẫn Tri Ân:</label>
                  <textarea
                    rows={3}
                    value={graduate.quote}
                    onChange={(e) => handleUpdateGraduate('quote', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 resize-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CEREMONY INFORMATION */}
          {activeTab === 'ceremony' && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-bold text-sky-800 tracking-wider flex items-center gap-2 font-genz">
                <Calendar className="w-4 h-4 text-sky-500" />
                Thời Gian & Địa Điểm Tổ Chức
              </h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày Tổ Chức:</label>
                    <input
                      type="date"
                      value={ceremony.date}
                      onChange={(e) => handleUpdateCeremony('date', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Giờ Khai Mạc:</label>
                    <input
                      type="time"
                      value={ceremony.time}
                      onChange={(e) => handleUpdateCeremony('time', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên Hội Trường / Phòng:</label>
                  <input
                    type="text"
                    value={ceremony.venueName}
                    onChange={(e) => handleUpdateCeremony('venueName', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Chi Tiết (Có link Maps):</label>
                  <input
                    type="text"
                    value={ceremony.address}
                    onChange={(e) => handleUpdateCeremony('address', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gợi Ý Trang Phục (Dress code):</label>
                  <input
                    type="text"
                    value={ceremony.dressCode}
                    onChange={(e) => handleUpdateCeremony('dressCode', e.target.value)}
                    placeholder="VD: Lịch sự, Trang trọng, Tông màu Trắng - Xanh..."
                    className="w-full px-3.5 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEMES & DYNAMIC COLORS & DARK/LIGHT MODE */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              
              {/* 1. DARK / LIGHT MODE SWITCHER */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5 font-genz">
                    <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                    Chế Độ Sáng / Tối (Dark & Light Mode)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
                    {currentMode === 'light' ? 'Đang bật Sáng ☀️' : 'Đang bật Tối 🌙'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleThemeMode('light')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                      currentMode === 'light'
                        ? 'bg-white text-sky-900 border-sky-400 shadow-md ring-2 ring-sky-300'
                        : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Chế Độ Sáng (Light)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleThemeMode('dark')}
                    className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                      currentMode === 'dark'
                        ? 'bg-slate-900 text-sky-300 border-sky-500 shadow-md ring-2 ring-sky-400'
                        : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>Chế Độ Tối (Dark)</span>
                  </button>
                </div>
              </div>

              {/* 1B. SYNC & APPLY TO SENT INVITATIONS */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-sky-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 font-genz">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Cập Nhật Giao Diện Đã Gửi
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200 font-bold">
                    Cập nhật link cũ
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Lưu bảng màu, template & chế độ Sáng/Tối hiện tại trực tiếp vào thiệp của khách (khách mở lại đường link cũ sẽ thấy giao diện mới ngay).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                  <button
                    type="button"
                    disabled={!currentGuest || isSaving}
                    onClick={handleApplyThemeToCurrentGuest}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="truncate">Lưu cho: {currentGuest?.name || 'Khách'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleApplyThemeToAllSent}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Áp dụng tất cả thiệp</span>
                  </button>
                </div>
              </div>

              {/* 2. DYNAMIC 1-CLICK COLOR PRESETS */}
              <div className="space-y-2.5">
                <div className="border-b border-sky-100 pb-1.5">
                  <h4 className="text-xs uppercase font-bold text-sky-800 tracking-wider flex items-center gap-1.5 font-genz">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    Bảng Màu Gợi Ý Nhanh (1-Click Presets)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Chọn nhanh các bảng màu trường học & phong cách Gen Z xu hướng
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DYNAMIC_COLOR_PRESETS.map((p) => {
                    const isSelected = theme.accentColor === p.primary && theme.envelopeColor === p.envelope;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-50 border-sky-400 shadow-sm ring-2 ring-sky-300'
                            : 'bg-white border-sky-100 hover:border-sky-200 hover:bg-sky-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 font-genz leading-tight">{p.name}</div>
                            <div className="text-[10px] text-slate-500 leading-tight">{p.desc}</div>
                          </div>
                        </div>

                        <div className="flex items-center -space-x-1 shrink-0">
                          <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.primary }}></span>
                          <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.secondary }}></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. CUSTOM COLOR PICKERS (Tự do chọn bất kỳ màu nào) */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5 font-genz">
                    <Pipette className="w-4 h-4 text-sky-500" />
                    Tự Do Tùy Chỉnh Mã Màu (Custom Color Pickers)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Bấm ô màu để đổi</span>
                </div>

                {/* Color Pickers Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Primary Accent */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                      1. Màu điểm nhấn chính:
                    </label>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-sky-200 shadow-sm">
                      <input
                        type="color"
                        value={customPrimary}
                        onChange={(e) => {
                          setCustomPrimary(e.target.value);
                          handleApplyDynamicTheme({ primary: e.target.value });
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={customPrimary}
                        onChange={(e) => {
                          setCustomPrimary(e.target.value);
                          handleApplyDynamicTheme({ primary: e.target.value });
                        }}
                        className="w-full text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Secondary Gradient */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                      2. Màu dải chuyển phụ:
                    </label>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-sky-200 shadow-sm">
                      <input
                        type="color"
                        value={customSecondary}
                        onChange={(e) => {
                          setCustomSecondary(e.target.value);
                          handleApplyDynamicTheme({ secondary: e.target.value });
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={customSecondary}
                        onChange={(e) => {
                          setCustomSecondary(e.target.value);
                          handleApplyDynamicTheme({ secondary: e.target.value });
                        }}
                        className="w-full text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Envelope Body Color */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                      3. Màu phong bì mở thiệp:
                    </label>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-sky-200 shadow-sm">
                      <input
                        type="color"
                        value={customEnvelope}
                        onChange={(e) => {
                          setCustomEnvelope(e.target.value);
                          handleApplyDynamicTheme({ envelope: e.target.value });
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={customEnvelope}
                        onChange={(e) => {
                          setCustomEnvelope(e.target.value);
                          handleApplyDynamicTheme({ envelope: e.target.value });
                        }}
                        className="w-full text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Wax Seal Color */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                      4. Màu con dấu niêm phong:
                    </label>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-sky-200 shadow-sm">
                      <input
                        type="color"
                        value={customSeal}
                        onChange={(e) => {
                          setCustomSeal(e.target.value);
                          handleApplyDynamicTheme({ seal: e.target.value });
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={customSeal}
                        onChange={(e) => {
                          setCustomSeal(e.target.value);
                          handleApplyDynamicTheme({ seal: e.target.value });
                        }}
                        className="w-full text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Preview Bar */}
                <div className="pt-1">
                  <div className="text-[10px] font-semibold text-slate-500 mb-1">
                    Dải chuyển màu thực tế (Live Gradient Preview):
                  </div>
                  <div
                    className="w-full h-7 rounded-xl shadow-inner flex items-center justify-center text-white text-[10px] font-extrabold tracking-widest font-mono"
                    style={{ background: `linear-gradient(135deg, ${customPrimary}, ${customSecondary})` }}
                  >
                    {customPrimary} ➔ {customSecondary}
                  </div>
                </div>

                {/* SAVE AS NEW CUSTOM TEMPLATE */}
                <div className="pt-3 border-t border-sky-200/80 space-y-2">
                  <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5 font-genz">
                    <Save className="w-3.5 h-3.5 text-sky-600" />
                    <span>Lưu Cấu Hình Này Thành Mẫu Template Mới</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tên mẫu (VD: Mẫu Bạn Thân CNTT)"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Nhãn phụ (VD: Cá tính • Đậm chất IT)"
                      value={newTemplateBadge}
                      onChange={(e) => setNewTemplateBadge(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAsNewTemplate}
                    disabled={isSavingTemplate}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-1.5 font-genz"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    {isSavingTemplate ? 'Đang lưu mẫu...' : '💾 Lưu Vào Kho Template Mẫu'}
                  </button>
                </div>
              </div>

              {/* 3B. USER SAVED CUSTOM TEMPLATES */}
              {customTemplates && customTemplates.length > 0 && (
                <div className="space-y-2.5">
                  <div className="border-b border-sky-100 pb-1.5 flex items-center justify-between">
                    <h4 className="text-xs uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5 font-genz">
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      Kho Template Mẫu Đã Tạo ({customTemplates.length})
                    </h4>
                    <span className="text-[10px] text-emerald-600 font-semibold">Đã lưu trong DB</span>
                  </div>

                  <div className="space-y-2">
                    {customTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setTheme(tpl);
                          setCustomPrimary(tpl.accentColor);
                          setCustomSecondary(tpl.secondaryColor);
                          setCustomEnvelope(tpl.envelopeColor);
                          setCustomSeal(tpl.sealColor);
                          if (tpl.layoutConfig) {
                            setInvitation((prev) => ({ ...prev, layout: tpl.layoutConfig }));
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          theme.id === tpl.id
                            ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-2 ring-emerald-300'
                            : 'bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/30'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 font-genz flex items-center gap-1.5">
                            <span>{tpl.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              {tpl.mode === 'light' ? '☀️ Sáng' : '🌙 Tối'}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold">{tpl.badge}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-1">
                            <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: tpl.accentColor }}></span>
                            <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: tpl.secondaryColor }}></span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Xóa mẫu template này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. CLASSIC TEMPLATES LIST */}
              <div className="space-y-2.5">
                <div className="border-b border-sky-100 pb-1.5">
                  <h4 className="text-xs uppercase font-bold text-sky-800 tracking-wider flex items-center gap-2 font-genz">
                    <Palette className="w-4 h-4 text-sky-500" />
                    Mẫu Thiết Kế Sẵn (Classic Themes)
                  </h4>
                </div>

                <div className="space-y-2">
                  {THEMES.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setTheme({ ...item, mode: currentMode })}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        theme.id === item.id && !theme.isCustom
                          ? 'bg-sky-50 border-sky-400 shadow-sm ring-2 ring-sky-300'
                          : 'bg-white border-sky-100 hover:border-sky-200 hover:bg-sky-50/30'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 font-genz">{item.name}</div>
                        <div className="text-[11px] text-sky-600 font-semibold">{item.badge}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-6 h-6 rounded-full border border-sky-200 shadow-sm"
                          style={{ backgroundColor: item.accentColor }}
                        ></div>
                        <div
                          className="w-6 h-6 rounded-full border border-sky-200 shadow-sm"
                          style={{ backgroundColor: item.envelopeColor }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CEREMONY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold text-sky-800 tracking-wider flex items-center gap-2 font-genz">
                  <Clock className="w-4 h-4 text-sky-500" />
                  Lịch Trình Buổi Lễ
                </h3>
                <button
                  type="button"
                  onClick={handleAddTimelineStep}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-bold cursor-pointer font-genz"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm mốc giờ
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {ceremony.timeline.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={step.time}
                        onChange={(e) => handleTimelineChange(idx, 'time', e.target.value)}
                        className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-sky-200 text-sky-700 font-mono font-bold text-xs"
                      />
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleTimelineChange(idx, 'title', e.target.value)}
                        placeholder="Tên hoạt động..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-slate-900 font-bold text-xs font-genz"
                      />
                      {ceremony.timeline.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimelineStep(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={step.desc}
                      onChange={(e) => handleTimelineChange(idx, 'desc', e.target.value)}
                      placeholder="Mô tả chi tiết..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-slate-600 text-[11px] resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Sticky Save Action Bar */}
          <div className="pt-4 border-t border-sky-100 sticky bottom-0 bg-white/95 backdrop-blur-md py-3 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
            <div className="text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Tự động đồng bộ:</span> Dữ liệu được lưu an toàn vào SQLite.
            </div>
            <button
              type="button"
              onClick={handleSaveAllChanges}
              disabled={isSaving}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer font-genz flex items-center justify-center gap-1.5 active:scale-95 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-300'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 shadow-sky-500/25'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Đã Lưu Database!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-sky-200" />
                  <span>Lưu Thay Đổi (Text & Ảnh) 💾</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Interactive Preview With Frame Controls */}
        <div className="lg:col-span-7 xl:col-span-7 bg-sky-50/50 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto max-h-[calc(100vh-120px)]">
          
          {/* Top Preview Controls Bar */}
          <div className="flex flex-wrap items-center justify-between w-full max-w-lg mb-4 px-2 font-genz gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sky-200 shadow-2xs text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPreviewWidth(390)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  previewWidth === 390 ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
                }`}
                title="iPhone Standard (390px)"
              >
                <Smartphone className="w-3 h-3" />
                <span>390px</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewWidth(430)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  previewWidth === 430 ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
                }`}
                title="Phone Max / Plus (430px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>430px</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewWidth(560)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  previewWidth === 560 ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
                }`}
                title="Tablet Mini (560px)"
              >
                <Tablet className="w-3 h-3" />
                <span>560px</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewBezel(!previewBezel)}
                className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  previewBezel ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {previewBezel ? 'Viền Phone: Bật' : 'Viền: Tắt'}
              </button>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold">
                Live Preview
              </span>
            </div>
          </div>

          {/* Smartphone Frame Wrapper (Responsive based on previewWidth & previewBezel) */}
          <div
            className={`relative w-full rounded-[42px] transition-all duration-300 ${
              previewBezel
                ? 'p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border-4 border-slate-700/80'
                : 'rounded-3xl border border-sky-200 shadow-xl bg-slate-950 p-1.5'
            }`}
            style={{ maxWidth: `${previewWidth}px` }}
          >
            {/* Camera notch */}
            {previewBezel && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30"></div>
            )}

            {/* Inner Phone Screen Content */}
            <div className="relative w-full h-[720px] rounded-[32px] overflow-y-auto bg-slate-950 scrollbar-thin scrollbar-thumb-sky-500/20">
              <InteractiveWebInvite
                invitation={invitation}
                currentGuest={currentGuest}
                theme={theme}
                onOpenExportModal={onOpenExportModal}
                initialOpenedEnvelope={true}
                canViewWishes={true}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
