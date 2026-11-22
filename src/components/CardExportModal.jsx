import React, { useRef, useState, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import QRCode from 'qrcode';
import {
  Download,
  X,
  Sparkles,
  GraduationCap,
  Calendar,
  MapPin,
  QrCode,
  Share2,
  Check,
  Smartphone,
  Square,
  FileText
} from 'lucide-react';
import { getGuestInvitationUrl } from '../utils/inviteHelper';

export default function CardExportModal({
  isOpen,
  onClose,
  invitation,
  currentGuest,
  theme
}) {
  const cardRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState('story'); // 'story' (9:16), 'square' (1:1), 'classic' (5:7)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { graduate, ceremony } = invitation;

  // Generate dynamic QR Code for the guest's link
  useEffect(() => {
    if (isOpen) {
      const shareUrl = getGuestInvitationUrl(currentGuest);
      QRCode.toDataURL(shareUrl, {
        width: 250,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, currentGuest]);

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      // Use pixelRatio 2 or 3 for crystal clear print quality
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 0.98,
      });

      const guestSlug = (currentGuest?.name || 'thiep-moi')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const filename = `Thiep-Tot-Nghiep-${graduate.fullName.replace(/\s+/g, '-')}-${guestSlug}.png`;

      const link = document.createElement('a');
      link.download = filename;
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

  const formattedDate = new Date(ceremony.date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  const isGenZ = theme.id.startsWith('genz');
  const cardBgStyle = theme.isCustom
    ? (theme.mode === 'light'
        ? `linear-gradient(145deg, #ffffff 0%, ${theme.accentColor}18 50%, #f1f5f9 100%)`
        : `linear-gradient(145deg, #020617 0%, ${theme.accentColor}28 50%, #0f172a 100%)`)
    : theme.id === 'genz-holographic'
    ? 'linear-gradient(145deg, #1a0b2e 0%, #2f1254 50%, #0d1e38 100%)'
    : theme.id === 'genz-matcha'
    ? 'linear-gradient(145deg, #05261b 0%, #0a3d2b 50%, #0e2b1f 100%)'
    : theme.id === 'genz-boarding-pass'
    ? 'linear-gradient(145deg, #090e17 0%, #122033 50%, #08101a 100%)'
    : theme.id === 'genz-retro-film'
    ? 'linear-gradient(145deg, #2c1a11 0%, #3d2314 50%, #1c110b 100%)'
    : 'linear-gradient(145deg, #090d16 0%, #101c36 50%, #0a0f1d 100%)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white border border-sky-100 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header Bar - White & Light Sky Blue */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-sky-50/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-black text-slate-900 font-genz">Xuất Ảnh Thiệp Mời Độ Phân Giải Cao (2K)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-sky-100/60 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Controls & Export Settings */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Chọn Tỉ Lệ Khung Hình:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('story')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aspectRatio === 'story'
                      ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                      : 'bg-sky-50/50 border-sky-200 text-slate-600 hover:bg-sky-100'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs">Story (9:16)</div>
                  <div className="text-[10px] opacity-80">Zalo / Insta</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aspectRatio === 'square'
                      ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                      : 'bg-sky-50/50 border-sky-200 text-slate-600 hover:bg-sky-100'
                  }`}
                >
                  <Square className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs">Vuông (1:1)</div>
                  <div className="text-[10px] opacity-80">Gửi tin nhắn</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('classic')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aspectRatio === 'classic'
                      ? 'bg-sky-500 text-white border-sky-500 font-bold shadow-sm'
                      : 'bg-sky-50/50 border-sky-200 text-slate-600 hover:bg-sky-100'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs">Thiệp In (5:7)</div>
                  <div className="text-[10px] opacity-80">In ấn giấy</div>
                </button>
              </div>
            </div>

            {/* Recipient info badge */}
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1 text-xs">
              <span className="text-slate-500 font-medium">Đang xuất thiệp cho:</span>
              <div className="font-black text-sky-800 text-sm font-genz">
                {currentGuest?.salutation || 'Kính mời'} {currentGuest?.name || 'Quý Khách'}
              </div>
              <p className="text-[11px] text-slate-500">
                Mã QR trên thiệp sẽ tự động dẫn đến trang web thiệp tương tác đích danh của khách này.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:brightness-105 active:scale-98 text-white font-black text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all font-genz"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Đang Render Ảnh Nét Cao...' : 'Tải Xuống Ảnh PNG (Ultra HD)'}
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-bold border border-sky-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-sky-500" />}
                {isCopied ? 'Đã sao chép link!' : 'Sao chép link web thiệp'}
              </button>
            </div>
          </div>

          {/* Right Live Card Canvas to be captured */}
          <div className="lg:col-span-8 flex justify-center items-center bg-slate-950 p-4 sm:p-6 rounded-2xl overflow-hidden border border-slate-800/80">
            <div
              ref={cardRef}
              id="graduation-printable-card"
              className={`relative overflow-hidden text-center shadow-2xl transition-all duration-300 ${
                aspectRatio === 'story'
                  ? 'w-[360px] min-h-[640px]'
                  : aspectRatio === 'square'
                  ? 'w-[420px] min-h-[420px]'
                  : 'w-[380px] min-h-[532px]'
              }`}
              style={{
                background: cardBgStyle,
                color: '#f8fafc',
                padding: '28px 24px',
                border: `2px solid ${theme.accentColor || '#ec4899'}88`,
                boxShadow: `0 0 30px ${theme.accentColor || '#ec4899'}33`
              }}
            >
              {/* Luxury / Gen Z Frame Ornaments */}
              <div className="absolute top-2 left-2 right-2 bottom-2 border border-white/10 pointer-events-none rounded-lg"></div>
              
              {/* Top Banner */}
              <div className="space-y-1 mb-3">
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold"
                  style={{ color: theme.accentColor || '#ec4899' }}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  {graduate.school}
                </div>
                <div className="text-[13px] font-black tracking-widest uppercase font-genz text-white">
                  THƯ MỜI LỄ TỐT NGHIỆP CỬ NHÂN
                </div>
              </div>

              {/* Personalized Recipient Tag */}
              <div className="my-2.5 py-1.5 px-3.5 rounded-xl border inline-block max-w-[90%] shadow-md"
                style={{
                  backgroundColor: `${theme.accentColor}18`,
                  borderColor: `${theme.accentColor}55`
                }}
              >
                <div className="text-[9px] uppercase tracking-wider font-extrabold font-genz"
                  style={{ color: theme.accentColor }}
                >
                  {currentGuest?.salutation || 'Hú le • Kính mời'}
                </div>
                <div className="text-sm font-black text-white truncate font-genz">
                  {currentGuest?.name || 'Quý Khách & Bạn Bè'}
                </div>
              </div>

              {/* Graduate Photo */}
              <div className="my-2">
                <div className="w-24 h-24 rounded-full p-1 shadow-xl mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accentColor}, #a855f7, #06b6d4)`
                  }}
                >
                  <img
                    src={graduate.avatarUrl}
                    alt={graduate.fullName}
                    className="w-full h-full object-cover rounded-full filter brightness-105"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* Graduate Name & Degree */}
              <h2 className="text-lg font-black text-white tracking-wide mt-1 font-genz">
                {graduate.fullName}
              </h2>
              <div className="text-xs font-bold mt-0.5"
                style={{ color: theme.accentColor }}
              >
                {graduate.degree}
              </div>
              {graduate.honor && (
                <div className="inline-block mt-1 text-[9px] font-black px-2.5 py-0.5 rounded-full border shadow-sm"
                  style={{
                    backgroundColor: `${theme.accentColor}25`,
                    borderColor: `${theme.accentColor}66`,
                    color: '#ffffff'
                  }}
                >
                  {graduate.honor}
                </div>
              )}

              {/* Event Time & Venue */}
              <div className="my-3 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-slate-200">
                  <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor }} />
                  <span className="font-bold text-white capitalize">{formattedDate} • {ceremony.time}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor }} />
                  <span className="truncate">{ceremony.venueName}</span>
                </div>
              </div>

              {/* QR Code and Footer */}
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between px-2 text-left">
                <div>
                  <div className="text-[10px] font-black font-genz text-white">Quét mã QR</div>
                  <div className="text-[8px] text-slate-300 leading-tight">
                    Mở thiệp online, xem bản đồ<br />và gửi lời chúc mừng ✨
                  </div>
                </div>

                {qrCodeDataUrl ? (
                  <div className="p-1 bg-white rounded-lg shadow">
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-12 h-12" />
                  </div>
                ) : (
                  <QrCode className="w-10 h-10" style={{ color: theme.accentColor }} />
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

