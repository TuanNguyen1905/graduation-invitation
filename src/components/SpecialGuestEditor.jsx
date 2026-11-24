import React, { useRef, useState } from 'react';
import {
  Heart,
  Image as ImageIcon,
  Plus,
  Trash2,
  Music,
  Lock,
  PenTool,
  RotateCcw,
  Sparkles,
  Upload
} from 'lucide-react';
import { ROMANTIC_PALETTES } from '../data/mockData';
import { uploadImageToApi } from '../services/api';

/**
 * Nén ảnh thành WebP/JPEG kích thước tối ưu cho di động (<1200px) trước khi upload bảo mật (C5)
 */
function compressPrivateImage(file, maxDim = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const rawUrl = ev.target.result;
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
        const webp = canvas.toDataURL('image/webp', quality);
        if (webp.startsWith('data:image/webp')) return resolve(webp);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

function readAudioAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

/**
 * Khung vẽ chữ ký tay của Tuấn trong Admin (C4)
 */
function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.strokeStyle = '#7c1d30';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const moveDraw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-rose-200 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={420}
          height={120}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          className="w-full h-24 touch-none cursor-crosshair"
        />
        {!value && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Vẽ chữ ký tay vào khung này
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {value ? (
          <img src={value} alt="Chữ ký hiện tại" className="h-10 object-contain border border-slate-200 rounded px-2 bg-white" />
        ) : (
          <span className="text-xs text-slate-500">Chưa có chữ ký tay</span>
        )}
        <button
          type="button"
          onClick={clearPad}
          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 inline-flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xóa chữ ký</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Form cho Tuấn tự điền toàn bộ nội dung thiệp riêng của Nguyễn Thị Như Thùy (C4)
 */
export default function SpecialGuestEditor({ guestId, config, onChange }) {
  const safe = config || {};
  const gate = safe.unlockGate || {};
  const milestones = Array.isArray(safe.milestones) ? safe.milestones : [];
  const photos = Array.isArray(safe.photos) ? safe.photos : [];
  const [uploadingKey, setUploadingKey] = useState(null);

  const updateField = (key, val) => {
    onChange({ ...safe, [key]: val });
  };

  const updateGate = (patch) => {
    onChange({
      ...safe,
      unlockGate: { ...gate, ...patch }
    });
  };

  const handlePrivateUpload = async (file, keyTag, onSuccessUrl) => {
    if (!file) return;
    setUploadingKey(keyTag);
    try {
      const dataUrl = await compressPrivateImage(file);
      const res = await uploadImageToApi(dataUrl, file.name, {
        privateMedia: true,
        guestId
      });
      if (res?.success && res?.url) {
        onSuccessUrl(res.url);
      } else {
        alert(res?.error || 'Không thể tải ảnh bảo mật. Hãy chọn ảnh nhẹ hơn (< 650KB sau nén).');
      }
    } finally {
      setUploadingKey(null);
    }
  };

  const handleAudioUpload = async (file) => {
    if (!file) return;
    setUploadingKey('music');
    try {
      const dataUrl = await readAudioAsDataUrl(file);
      const res = await uploadImageToApi(dataUrl, file.name, {
        privateMedia: true,
        guestId
      });
      if (res?.success && res?.url) {
        updateField('musicUrl', res.url);
        if (!safe.musicTitle) {
          updateField('musicTitle', file.name.replace(/\.[^.]+$/, ''));
        }
      } else {
        alert(res?.error || 'File nhạc vượt quá 650KB. Bạn hãy dán link MP3 trực tiếp thay vì upload file.');
      }
    } finally {
      setUploadingKey(null);
    }
  };

  const addMilestone = () => {
    updateField('milestones', [
      ...milestones,
      { id: `ms-${Date.now()}`, date: '', title: '', description: '', photoUrl: '' }
    ]);
  };

  const updateMilestone = (idx, patch) => {
    const next = milestones.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    updateField('milestones', next);
  };

  const removeMilestone = (idx) => {
    updateField('milestones', milestones.filter((_, i) => i !== idx));
  };

  const addPhoto = () => {
    updateField('photos', [
      ...photos,
      { id: `ph-${Date.now()}`, caption: '', url: '' }
    ]);
  };

  const updatePhoto = (idx, patch) => {
    const next = photos.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    updateField('photos', next);
  };

  const removePhoto = (idx) => {
    updateField('photos', photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 sm:p-5 space-y-5 text-xs">
      <div className="flex items-center gap-2 border-b border-rose-200/80 pb-2.5">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        <h4 className="font-bold text-rose-900 text-sm">
          Nội Dung Riêng Thiệp Lãng Mạn (Tuấn tự điền)
        </h4>
      </div>

      {/* 1. Bộ màu gợi ý */}
      <div className="space-y-2">
        <label className="block font-bold text-slate-700">Bộ màu chủ đạo (gợi ý sẵn 3 bộ)</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROMANTIC_PALETTES.map((pal) => {
            const active = (safe.paletteId || 'blush-rose') === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => updateField('paletteId', pal.id)}
                className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  active
                    ? 'bg-white border-rose-500 ring-2 ring-rose-300 shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full shrink-0 border border-white shadow-xs"
                  style={{ background: `linear-gradient(135deg, ${pal.accent}, ${pal.secondary})` }}
                />
                <span className="min-w-0">
                  <span className="block font-bold text-slate-900 truncate">{pal.name}</span>
                  <span className="block text-xs text-slate-500 truncate">{pal.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tên thân mật & Dấu sáp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Tên gọi thân mật</label>
          <input
            type="text"
            value={safe.petName || ''}
            onChange={(e) => updateField('petName', e.target.value)}
            placeholder="VD: Em bé của anh..."
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-none focus:border-rose-400"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Chữ cái trên con dấu sáp</label>
          <input
            type="text"
            value={safe.coupleInitials || ''}
            onChange={(e) => updateField('coupleInitials', e.target.value)}
            placeholder="VD: T & T"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-none focus:border-rose-400"
          />
        </div>
      </div>

      {/* 3. Lời nhắn mở đầu & Câu nút RSVP */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Lời nhắn mở đầu (mỗi dòng sẽ hiện dần nhẹ nhàng)
        </label>
        <textarea
          rows={3}
          value={safe.openingMessage || ''}
          onChange={(e) => updateField('openingMessage', e.target.value)}
          placeholder="Nhập những dòng nhắn nhủ riêng của Tuấn dành cho Thùy..."
          className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-none focus:border-rose-400"
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Câu chữ trên nút xác nhận RSVP</label>
        <input
          type="text"
          value={safe.rsvpButtonLabel || ''}
          onChange={(e) => updateField('rsvpButtonLabel', e.target.value)}
          placeholder="VD: Em đồng ý đến bên anh ngày tốt nghiệp"
          className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-none focus:border-rose-400"
        />
      </div>

      {/* 4. Dòng thời gian hai người (Mốc kỷ niệm) */}
      <div className="space-y-2.5 pt-1 border-t border-rose-200/70">
        <div className="flex items-center justify-between gap-2">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Mốc kỷ niệm hai người ({milestones.length})</span>
          </label>
          <button
            type="button"
            onClick={addMilestone}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mốc</span>
          </button>
        </div>

        {milestones.map((m, idx) => (
          <div key={m.id || idx} className="p-3 rounded-xl bg-white border border-rose-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-rose-700">Mốc #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeMilestone(idx)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                title="Xóa mốc này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Ngày (VD: 20/10/2023)"
                value={m.date || ''}
                onChange={(e) => updateMilestone(idx, { date: e.target.value })}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
              />
              <input
                type="text"
                placeholder="Tiêu đề mốc kỷ niệm"
                value={m.title || ''}
                onChange={(e) => updateMilestone(idx, { title: e.target.value })}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Mô tả ngắn kỷ niệm..."
              value={m.description || ''}
              onChange={(e) => updateMilestone(idx, { description: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="min-h-[40px] px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingKey === `ms-${idx}` ? 'Đang tải...' : 'Tải ảnh riêng tư'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handlePrivateUpload(e.target.files?.[0], `ms-${idx}`, (url) =>
                      updateMilestone(idx, { photoUrl: url })
                    )
                  }
                />
              </label>
              {m.photoUrl && (
                <span className="text-xs text-emerald-700 font-medium">Đã gắn ảnh bảo mật ✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Thư viện ảnh chung (Polaroid) */}
      <div className="space-y-2.5 pt-1 border-t border-rose-200/70">
        <div className="flex items-center justify-between gap-2">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span>Thư viện ảnh chung ({photos.length})</span>
          </label>
          <button
            type="button"
            onClick={addPhoto}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ảnh</span>
          </button>
        </div>

        {photos.map((p, idx) => (
          <div key={p.id || idx} className="p-3 rounded-xl bg-white border border-rose-200 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="min-h-[40px] px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingKey === `ph-${idx}` ? 'Đang tải...' : p.url ? 'Đổi ảnh' : 'Chọn ảnh'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handlePrivateUpload(e.target.files?.[0], `ph-${idx}`, (url) =>
                    updatePhoto(idx, { url })
                  )
                }
              />
            </label>
            <input
              type="text"
              placeholder="Chú thích ảnh..."
              value={p.caption || ''}
              onChange={(e) => updatePhoto(idx, { caption: e.target.value })}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
            />
            {p.url && <span className="text-xs text-emerald-700 font-medium shrink-0">Đã lưu ✓</span>}
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0"
              title="Xóa ảnh"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 6. Nhạc nền (tùy chọn) */}
      <div className="space-y-2 pt-1 border-t border-rose-200/70">
        <label className="font-bold text-slate-800 flex items-center gap-1.5">
          <Music className="w-4 h-4 text-rose-500" />
          <span>Nhạc nền (để trống nếu không dùng)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Tên bài hát hiển thị"
            value={safe.musicTitle || ''}
            onChange={(e) => updateField('musicTitle', e.target.value)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-900"
          />
          <input
            type="text"
            placeholder="Link MP3 trực tiếp (hoặc tải file <600KB)"
            value={safe.musicUrl || ''}
            onChange={(e) => updateField('musicUrl', e.target.value)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-h-[40px] px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploadingKey === 'music' ? 'Đang tải...' : 'Tải file nhạc (<600KB)'}</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleAudioUpload(e.target.files?.[0])}
            />
          </label>
          {safe.musicUrl && (
            <button
              type="button"
              onClick={() => {
                updateField('musicUrl', '');
                updateField('musicTitle', '');
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold cursor-pointer"
            >
              Bỏ nhạc nền
            </button>
          )}
        </div>
      </div>

      {/* 7. Lời chúc cuối & Chữ ký tay */}
      <div className="space-y-3 pt-1 border-t border-rose-200/70">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Lời chúc / kết thư cuối thiệp</label>
          <textarea
            rows={2}
            value={safe.closingWish || ''}
            onChange={(e) => updateField('closingWish', e.target.value)}
            placeholder="Lời nhắn cuối thư dành cho Thùy..."
            className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-none focus:border-rose-400"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <PenTool className="w-4 h-4 text-rose-500" />
            <span>Chữ ký tay của Tuấn</span>
          </label>
          <SignaturePad
            value={safe.signatureDataUrl || ''}
            onChange={(dataUrl) => updateField('signatureDataUrl', dataUrl)}
          />
        </div>
      </div>

      {/* 8. Mở khóa thiệp (C3) */}
      <div className="space-y-2.5 p-3.5 rounded-xl bg-white border border-rose-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Lock className="w-4 h-4 text-rose-500" />
            <span>Khóa câu hỏi trước khi mở phong bì (C3)</span>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-rose-700">
            <input
              type="checkbox"
              checked={Boolean(gate.enabled)}
              onChange={(e) => updateGate({ enabled: e.target.checked })}
              className="w-4 h-4 accent-rose-600"
            />
            <span>{gate.enabled ? 'Đang bật' : 'Đang tắt'}</span>
          </label>
        </div>

        <input
          type="text"
          placeholder="Câu hỏi bí mật (VD: Ngày đầu tiên mình gặp nhau là ngày nào?)"
          value={gate.question || ''}
          onChange={(e) => updateGate({ question: e.target.value })}
          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder={
              gate.hasAnswer
                ? 'Đã có đáp án (nhập nếu muốn đổi đáp án mới)'
                : 'Đáp án đúng (server mã hóa, không gửi xuống trình duyệt)'
            }
            value={gate.newAnswer || ''}
            onChange={(e) => updateGate({ newAnswer: e.target.value, clearAnswer: false })}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
          />
          <input
            type="text"
            placeholder="Gợi ý nhỏ (tùy chọn)"
            value={gate.answerHint || ''}
            onChange={(e) => updateGate({ answerHint: e.target.value })}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900"
          />
        </div>
      </div>
    </div>
  );
}
