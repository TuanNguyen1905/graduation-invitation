import React, { useRef, useState, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import QRCode from 'qrcode';
import {
  Download,
  X,
  GraduationCap,
  Calendar,
  MapPin,
  QrCode,
  Share2,
  Check,
  Smartphone,
  Square,
  FileText,
  Sun,
  Moon,
  Heart
} from 'lucide-react';
import { getGuestInvitationUrl, joinCleanParts } from '../utils/inviteHelper';
import { ROMANTIC_PALETTES, ROMANTIC_SPECIAL_TEMPLATE_ID } from '../data/mockData';

function parseSpecialConfig(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function CardExportModal({
  isOpen,
  onClose,
  invitation,
  currentGuest,
  theme
}) {
  const cardRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState('classic'); // 'story' (9:16), 'square' (1:1), 'classic' (5:7)
  const [exportMode, setExportMode] = useState(() =>
    theme?.mode === 'dark' ? 'dark' : 'light'
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { graduate = {}, ceremony = {} } = invitation || {};
  const isRomanticSpecial =
    currentGuest?.themeId === ROMANTIC_SPECIAL_TEMPLATE_ID ||
    currentGuest?.template_id === ROMANTIC_SPECIAL_TEMPLATE_ID;
  const special = parseSpecialConfig(currentGuest?.specialConfig || currentGuest?.special_config);
  const romanticPalette =
    ROMANTIC_PALETTES.find((p) => p.id === special.paletteId) || ROMANTIC_PALETTES[0];

  useEffect(() => {
    setExportMode(theme?.mode === 'dark' ? 'dark' : 'light');
  }, [theme?.mode, currentGuest?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const shareUrl = getGuestInvitationUrl(currentGuest);
    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: isRomanticSpecial ? romanticPalette.seal : '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [isOpen, currentGuest, isRomanticSpecial, romanticPalette.seal]);

  if (!isOpen) return null;

  const buildFilename = (ext) => {
    const guestSlug = (currentGuest?.name || 'thiep-moi')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'khach-moi';
    const gradSlug = (graduate.fullName || 'tot-nghiep').trim().replace(/\s+/g, '-');
    return `Thiep-Tot-Nghiep-${gradSlug}-${guestSlug}.${ext}`;
  };

  const handleDownloadImage = async (format = 'png') => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const options = {
        cacheBust: true,
        pixelRatio: 3,
        quality: 0.96
      };
      const dataUrl =
        format === 'jpeg'
          ? await toJpeg(cardRef.current, options)
          : await toPng(cardRef.current, options);

      const link = document.createElement('a');
      link.download = buildFilename(format === 'jpeg' ? 'jpg' : 'png');
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh thiệp:', err);
      alert('Không thể tạo ảnh, vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = getGuestInvitationUrl(currentGuest);
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formattedDate = ceremony.date
    ? new Date(`${ceremony.date}T12:00:00+07:00`).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    : '';

  const accent = isRomanticSpecial ? romanticPalette.accent : theme?.accentColor || '#1e3a5f';
  const secondary = isRomanticSpecial
    ? romanticPalette.secondary
    : theme?.secondaryColor || accent;
  const isDarkCard = !isRomanticSpecial && exportMode === 'dark';

  const cardSurfaceStyle = isRomanticSpecial
    ? {
        background: romanticPalette.pageBg,
        color: romanticPalette.textPrimary,
        border: `1.5px solid ${romanticPalette.accent}45`
      }
    : isDarkCard
    ? {
        background: `radial-gradient(ellipse at 50% 0%, ${accent}22 0%, transparent 60%), linear-gradient(160deg, #13161f 0%, #0e1017 100%)`,
        color: '#f8fafc',
        border: `1.5px solid ${accent}45`
      }
    : {
        background: `radial-gradient(ellipse at 50% 0%, ${accent}14 0%, transparent 55%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)`,
        color: '#0f172a',
        border: `1.5px solid ${accent}38`
      };

  const cardInnerBorder = isDarkCard ? 'rgba(255,255,255,0.12)' : `${accent}26`;
  const mutedTextColor = isRomanticSpecial
    ? romanticPalette.textMuted
    : isDarkCard
    ? '#cbd5e1'
    : '#475569';
  const subtleBoxStyle = isDarkCard
    ? { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }
    : { backgroundColor: `${accent}0a`, borderColor: `${accent}26` };

  const recipientDisplay = isRomanticSpecial
    ? special.petName?.trim() || currentGuest?.name || 'Người Thương'
    : currentGuest?.name || 'Quý Khách';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto safe-area-x safe-area-bottom font-sans">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/95 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: accent }}
            >
              {isRomanticSpecial ? <Heart className="w-4 h-4 fill-white/30" /> : <Download className="w-4 h-4" />}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate font-editorial">
              Lưu & In Ảnh Thiệp Mời (Ultra HD)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
            aria-label="Đóng cửa sổ xuất ảnh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start overflow-y-auto">
          {/* Left Controls */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Chọn tỉ lệ ảnh thiệp
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'classic', icon: FileText, label: 'Thiệp In', sub: '5:7' },
                  { id: 'story', icon: Smartphone, label: 'Story', sub: '9:16' },
                  { id: 'square', icon: Square, label: 'Vuông', sub: '1:1' }
                ].map((opt) => {
                  const IconComp = opt.icon;
                  const active = aspectRatio === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAspectRatio(opt.id)}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'text-white border-transparent font-bold shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      style={active ? { backgroundColor: accent } : undefined}
                    >
                      <IconComp className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-xs opacity-85">{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!isRomanticSpecial && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Phong cách nền thiệp in
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportMode('light')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      exportMode === 'light'
                        ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Giấy Trắng Sáng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportMode('dark')}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      exportMode === 'dark'
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Nền Tối Sang Trọng</span>
                  </button>
                </div>
              </div>
            )}

            {/* Recipient Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium block text-xs">Đang xuất thiệp cho:</span>
              <div className="font-bold text-slate-900 font-editorial text-base">
                {currentGuest?.salutation || 'Trân trọng kính mời'} {currentGuest?.name || 'Quý Khách'}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mã QR trên ảnh dẫn thẳng tới thiệp mời trực tuyến, bản đồ và lịch trình của khách này.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadImage('png')}
                disabled={isExporting}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: accent }}
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Đang tạo ảnh...' : 'Tải xuống PNG (Nét cao)'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadImage('jpeg')}
                  disabled={isExporting}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải JPG (Nhẹ)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  <span>{isCopied ? 'Đã chép' : 'Chép link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Printable Card Canvas */}
          <div className="lg:col-span-8 flex justify-center items-center bg-[#f1f4f9] p-3 sm:p-6 rounded-2xl border border-slate-200/80 overflow-hidden">
            <div
              ref={cardRef}
              id="graduation-printable-card"
              className={`relative overflow-hidden text-center rounded-2xl shadow-[0_24px_60px_-14px_rgba(15,23,42,0.22)] transition-all duration-300 flex flex-col justify-between ${
                aspectRatio === 'story'
                  ? 'w-full max-w-[360px] min-h-[580px] sm:min-h-[620px]'
                  : aspectRatio === 'square'
                  ? 'w-full max-w-[400px] min-h-[380px] sm:min-h-[400px]'
                  : 'w-full max-w-[380px] min-h-[500px] sm:min-h-[532px]'
              }`}
              style={{
                ...cardSurfaceStyle,
                padding: aspectRatio === 'square' ? '22px 22px' : '28px 24px'
              }}
            >
              {/* Soft top gradient wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${secondary} 70%, transparent 100%)`
                }}
              />

              {/* Fine inner stationery frame */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-2.5 rounded-xl border"
                style={{ borderColor: cardInnerBorder }}
              />

              {/* Masthead */}
              <div className="relative z-10 space-y-1.5">
                <div
                  className="inline-flex items-center justify-center gap-1.5 text-xs tracking-[0.12em] uppercase font-semibold"
                  style={{ color: accent }}
                >
                  {isRomanticSpecial ? (
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>{graduate.school}</span>
                </div>
                {(graduate.faculty || graduate.classBatch) && (
                  <p className="text-xs" style={{ color: mutedTextColor }}>
                    {joinCleanParts([graduate.faculty, graduate.classBatch])}
                  </p>
                )}
                <h4 className="text-sm font-editorial font-bold tracking-[0.1em] uppercase pt-1">
                  Thư Mời Lễ Tốt Nghiệp Cử Nhân
                </h4>
              </div>

              {/* Recipient Salutation */}
              <div
                className="relative z-10 my-2.5 py-2 px-4 rounded-xl border mx-auto max-w-[92%]"
                style={subtleBoxStyle}
              >
                <div
                  className="text-xs uppercase tracking-[0.12em] font-semibold"
                  style={{ color: accent }}
                >
                  {currentGuest?.salutation || 'Trân trọng kính mời'}
                </div>
                <div
                  className={`${
                    isRomanticSpecial ? 'font-handwriting text-2xl mt-0.5' : 'font-editorial text-lg font-bold mt-0.5'
                  } truncate`}
                >
                  {recipientDisplay}
                </div>
              </div>

              {/* Portrait + Graduate Info */}
              <div className="relative z-10 space-y-1.5 my-1">
                {graduate.avatarUrl && (
                  <div
                    className={`mx-auto p-1 rounded-full border ${
                      aspectRatio === 'square' ? 'w-20 h-20' : 'w-24 h-24'
                    }`}
                    style={{ borderColor: `${accent}45`, backgroundColor: '#ffffff' }}
                  >
                    <img
                      src={graduate.avatarUrl}
                      alt={graduate.fullName}
                      className="w-full h-full object-cover rounded-full"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}

                <h2 className="text-lg sm:text-xl font-editorial font-bold uppercase tracking-tight pt-1">
                  {graduate.fullName}
                </h2>
                {(graduate.degree || graduate.honor) && (
                  <div className="text-xs font-semibold" style={{ color: accent }}>
                    {joinCleanParts([graduate.degree, graduate.honor])}
                  </div>
                )}
              </div>

              {/* Event Time & Venue (A4 + A5 uniform) */}
              <div
                className="relative z-10 my-2.5 py-2.5 px-3.5 rounded-xl border text-left space-y-1.5 text-xs"
                style={subtleBoxStyle}
              >
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
                  <span className="font-semibold capitalize leading-snug">
                    {formattedDate} · Có mặt từ {ceremony.time || '07:30'}
                    {ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
                  <span className="leading-snug" style={{ color: mutedTextColor }}>
                    <strong style={{ color: cardSurfaceStyle.color }}>{ceremony.venueName}</strong>
                    {ceremony.address ? ` · ${ceremony.address}` : ''}
                  </span>
                </div>
              </div>

              {/* QR & Closing Footer */}
              <div
                className="relative z-10 pt-2.5 border-t flex items-center justify-between gap-3 text-left"
                style={{ borderColor: cardInnerBorder }}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-bold">
                    {isRomanticSpecial && special.coupleInitials
                      ? `${special.coupleInitials} · Quét mã mở thiệp`
                      : 'Quét mã mở thiệp'}
                  </div>
                  <div className="text-xs leading-snug" style={{ color: mutedTextColor }}>
                    Xem bản đồ, lịch trình & xác nhận tham dự
                  </div>
                </div>

                {qrCodeDataUrl ? (
                  <div className="p-1 bg-white rounded-lg border border-slate-200/80 shadow-xs shrink-0">
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-12 h-12" />
                  </div>
                ) : (
                  <QrCode className="w-11 h-11 shrink-0" style={{ color: accent }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
