import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import {
  Type,
  Image as ImageIcon,
  Smile,
  Palette,
  LayoutTemplate,
  Trash2,
  Copy,
  RotateCw,
  Download,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Check,
  Plus,
  Sparkles,
  Smartphone,
  Square,
  FileText,
  Sliders,
  Layers,
  GraduationCap
} from 'lucide-react';

const FONT_OPTIONS = [
  { name: 'Outfit (Gen Z)', value: 'Outfit' },
  { name: 'Cinzel (Hoàng Gia)', value: 'Cinzel' },
  { name: 'Playfair Display (Báo Chí)', value: 'Playfair Display' },
  { name: 'Plus Jakarta Sans (Hiện Đại)', value: 'Plus Jakarta Sans' },
  { name: 'Great Vibes (Viết Tay Cổ Điển)', value: 'Great Vibes' },
  { name: 'Alex Brush (Chữ Ký Nghệ Thuật)', value: 'Alex Brush' },
  { name: 'Space Grotesk (Công Nghệ)', value: 'Space Grotesk' },
];

const COLOR_SWATCHES = [
  '#ffffff', '#000000', '#f5d061', '#e6af2e', '#38bdf8', '#0284c7',
  '#ec4899', '#f43f5e', '#a855f7', '#10b981', '#1e293b', '#f8fafc'
];

const GRADUATION_STICKERS = [
  { label: 'Mũ Cử Nhân 1', icon: '🎓' },
  { label: 'Bằng Cuộn Nơ', icon: '📜' },
  { label: 'Bó Hoa Hướng Dương', icon: '🌻' },
  { label: 'Bó Hoa Kỷ Niệm', icon: '💐' },
  { label: 'Lấp Lánh Vàng', icon: '✨' },
  { label: 'Cúp Vinh Danh', icon: '🏆' },
  { label: 'Pháo Hoa Giấy', icon: '🎉' },
  { label: 'Nâng Ly Chúc Mừng', icon: '🥂' },
  { label: 'Trái Tim Yêu Thương', icon: '💖' },
  { label: 'Ngọn Lửa Cháy Hết Mình', icon: '🔥' },
  { label: 'Ngôi Sao Tỏa Sáng', icon: '⭐' },
  { label: 'Huy Hiệu 100%', icon: '💯' },
];

export default function CanvaEditor({
  invitation,
  currentGuest,
  onSaveDesign
}) {
  const canvasRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState('story'); // 'story' | 'square' | 'classic'
  const [activeSidebarTab, setActiveSidebarTab] = useState('templates'); // 'templates', 'text', 'stickers', 'photos', 'background'
  const [selectedId, setSelectedId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasBg, setCanvasBg] = useState('linear-gradient(145deg, #090e17 0%, #152238 50%, #0c1524 100%)');
  const [dragState, setDragState] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const { graduate, ceremony } = invitation;

  // Generate QR code for this guest
  useEffect(() => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?guest=${encodeURIComponent(currentGuest?.name || '')}`;
    QRCode.toDataURL(shareUrl, {
      width: 250,
      margin: 1,
      color: { dark: '#0284c7', light: '#ffffff' }
    }).then(setQrCodeUrl).catch(console.error);
  }, [currentGuest]);

  // Initial Elements on the canvas
  const [elements, setElements] = useState([
    {
      id: 'badge-school',
      type: 'text',
      content: graduate.school.toUpperCase(),
      x: 50,
      y: 8,
      fontSize: 11,
      fontFamily: 'Outfit',
      color: '#38bdf8',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'title-heading',
      type: 'text',
      content: 'THƯ MỜI LỄ TỐT NGHIỆP',
      x: 50,
      y: 13,
      fontSize: 18,
      fontFamily: 'Cinzel',
      color: '#f5d061',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'guest-salutation',
      type: 'text',
      content: `${currentGuest?.salutation || 'Trân trọng kính mời'}: ${currentGuest?.name || 'Quý Khách'}`,
      x: 50,
      y: 19,
      fontSize: 14,
      fontFamily: 'Outfit',
      color: '#ffffff',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'graduate-avatar',
      type: 'image',
      content: graduate.avatarUrl,
      x: 50,
      y: 35,
      width: 140,
      height: 140,
      borderRadius: '50%',
      border: '4px solid #38bdf8',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'graduate-name',
      type: 'text',
      content: graduate.fullName,
      x: 50,
      y: 50,
      fontSize: 22,
      fontFamily: 'Outfit',
      color: '#ffffff',
      fontWeight: 'black',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'graduate-degree',
      type: 'text',
      content: `${graduate.degree} • ${graduate.honor || 'Tốt nghiệp Xuất sắc'}`,
      x: 50,
      y: 55,
      fontSize: 12,
      fontFamily: 'Outfit',
      color: '#38bdf8',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'ceremony-info',
      type: 'text',
      content: `⏰ ${ceremony.time} - ${ceremony.date}\n📍 ${ceremony.venueName}`,
      x: 50,
      y: 65,
      fontSize: 12,
      fontFamily: 'Outfit',
      color: '#cbd5e1',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    },
    {
      id: 'sticker-cap',
      type: 'sticker',
      content: '🎓',
      x: 82,
      y: 28,
      fontSize: 36,
      rotation: 15,
      opacity: 1
    },
    {
      id: 'sticker-sparkle',
      type: 'sticker',
      content: '✨',
      x: 18,
      y: 28,
      fontSize: 32,
      rotation: -12,
      opacity: 1
    },
    {
      id: 'qr-code',
      type: 'qr',
      content: '',
      x: 50,
      y: 84,
      width: 75,
      height: 75,
      rotation: 0,
      opacity: 1
    },
    {
      id: 'qr-note',
      type: 'text',
      content: 'Quét mã để xem bản đồ & gửi lời chúc',
      x: 50,
      y: 94,
      fontSize: 9,
      fontFamily: 'Outfit',
      color: '#94a3b8',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    }
  ]);

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Update selected element property
  const updateSelected = (key, value) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, [key]: value } : el))
    );
  };

  // Add new text element
  const handleAddText = (type = 'heading') => {
    const newEl = {
      id: `text-${Date.now()}`,
      type: 'text',
      content:
        type === 'heading'
          ? 'Tiêu Đề Mới'
          : type === 'subheading'
          ? 'Lời Nhắn Nhủ Mới'
          : 'Ghé chụp ảnh cùng mình nhé!',
      x: 50,
      y: 45,
      fontSize: type === 'heading' ? 24 : type === 'subheading' ? 16 : 12,
      fontFamily: type === 'heading' ? 'Outfit' : 'Great Vibes',
      color: '#ffffff',
      fontWeight: type === 'heading' ? 'bold' : 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      rotation: 0,
      opacity: 1
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  // Add new sticker
  const handleAddSticker = (emoji) => {
    const newEl = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      content: emoji,
      x: 50,
      y: 40,
      fontSize: 40,
      rotation: 0,
      opacity: 1
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  // Add new photo from user file upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl = {
          id: `image-${Date.now()}`,
          type: 'image',
          content: event.target.result,
          x: 50,
          y: 40,
          width: 120,
          height: 120,
          borderRadius: '16px',
          border: '3px solid #38bdf8',
          rotation: 0,
          opacity: 1
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  // Duplicate selected element
  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const duplicated = {
      ...selectedElement,
      id: `${selectedElement.type}-${Date.now()}`,
      x: Math.min(selectedElement.x + 4, 85),
      y: Math.min(selectedElement.y + 4, 85)
    };
    setElements((prev) => [...prev, duplicated]);
    setSelectedId(duplicated.id);
  };

  // Export Canva Design as High-Res PNG
  const handleExportCanvaImage = async () => {
    if (!canvasRef.current) return;
    setSelectedId(null); // Unselect to hide bounding box outline
    setIsExporting(true);

    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 0.98
      });

      const filename = `Canva-Thiep-Tot-Nghiep-${graduate.fullName.replace(/\s+/g, '-')}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi xuất ảnh Canva:', err);
      alert('Không thể tạo ảnh, vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  // Preset Template Styles
  const applyPresetTemplate = (templateId) => {
    if (templateId === 'ocean') {
      setCanvasBg('linear-gradient(145deg, #090e17 0%, #0d2847 50%, #061628 100%)');
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === 'badge-school') return { ...el, color: '#38bdf8', fontFamily: 'Outfit' };
          if (el.id === 'title-heading') return { ...el, color: '#e0f2fe', fontFamily: 'Outfit' };
          if (el.id === 'graduate-avatar') return { ...el, border: '4px solid #38bdf8' };
          if (el.id === 'graduate-degree') return { ...el, color: '#38bdf8' };
          return el;
        })
      );
    } else if (templateId === 'pink') {
      setCanvasBg('linear-gradient(145deg, #240a1b 0%, #3d1430 50%, #1a0614 100%)');
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === 'badge-school') return { ...el, color: '#f472b6', fontFamily: 'Outfit' };
          if (el.id === 'title-heading') return { ...el, color: '#fbcfe8', fontFamily: 'Great Vibes', fontSize: 26 };
          if (el.id === 'graduate-avatar') return { ...el, border: '4px solid #f472b6' };
          if (el.id === 'graduate-degree') return { ...el, color: '#f472b6' };
          return el;
        })
      );
    } else if (templateId === 'gold') {
      setCanvasBg('linear-gradient(145deg, #0a0f1d 0%, #131c33 50%, #080d1a 100%)');
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === 'badge-school') return { ...el, color: '#f5d061', fontFamily: 'Cinzel' };
          if (el.id === 'title-heading') return { ...el, color: '#fce881', fontFamily: 'Cinzel' };
          if (el.id === 'graduate-avatar') return { ...el, border: '4px solid #f5d061' };
          if (el.id === 'graduate-degree') return { ...el, color: '#f5d061' };
          return el;
        })
      );
    }
  };

  // Dragging mechanics
  const handlePointerDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      canvasWidth: canvasBounds.width,
      canvasHeight: canvasBounds.height,
      origX: elements.find((el) => el.id === id).x,
      origY: elements.find((el) => el.id === id).y
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    const deltaX = ((e.clientX - dragState.startX) / dragState.canvasWidth) * 100;
    const deltaY = ((e.clientY - dragState.startY) / dragState.canvasHeight) * 100;

    const newX = Math.max(5, Math.min(95, dragState.origX + deltaX));
    const newY = Math.max(5, Math.min(95, dragState.origY + deltaY));

    setElements((prev) =>
      prev.map((el) => (el.id === dragState.id ? { ...el, x: newX, y: newY } : el))
    );
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  return (
    <div
      className="min-h-screen bg-sky-50/40 text-slate-800 flex flex-col font-sans select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      
      {/* Top Property Inspector Bar (Giống Canva Top Bar) */}
      <div className="bg-white border-b border-sky-100 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm z-30">
        
        {/* Left: Element formatting tools */}
        {selectedElement ? (
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Font Family (if text) */}
            {selectedElement.type === 'text' && (
              <select
                value={selectedElement.fontFamily}
                onChange={(e) => updateSelected('fontFamily', e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-900 focus:outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            {/* Font Size (+ / -) */}
            {(selectedElement.type === 'text' || selectedElement.type === 'sticker') && (
              <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl px-1">
                <button
                  type="button"
                  onClick={() => updateSelected('fontSize', Math.max(8, (selectedElement.fontSize || 16) - 2))}
                  className="px-2 py-1 text-slate-600 hover:text-sky-700 font-black cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold px-2 text-sky-900">
                  {selectedElement.fontSize}
                </span>
                <button
                  type="button"
                  onClick={() => updateSelected('fontSize', (selectedElement.fontSize || 16) + 2)}
                  className="px-2 py-1 text-slate-600 hover:text-sky-700 font-black cursor-pointer"
                >
                  +
                </button>
              </div>
            )}

            {/* Color Swatches (if text) */}
            {selectedElement.type === 'text' && (
              <div className="flex items-center gap-1 bg-sky-50 p-1 rounded-xl border border-sky-200">
                {COLOR_SWATCHES.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateSelected('color', c)}
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-sm cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={selectedElement.color || '#ffffff'}
                  onChange={(e) => updateSelected('color', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  title="Màu tùy chọn"
                />
              </div>
            )}

            {/* Text Alignment */}
            {selectedElement.type === 'text' && (
              <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => updateSelected('textAlign', 'left')}
                  className={`p-1.5 rounded-lg ${selectedElement.textAlign === 'left' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateSelected('textAlign', 'center')}
                  className={`p-1.5 rounded-lg ${selectedElement.textAlign === 'center' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => updateSelected('textAlign', 'right')}
                  className={`p-1.5 rounded-lg ${selectedElement.textAlign === 'right' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Rotate */}
            <div className="flex items-center gap-1.5 bg-sky-50 px-2 py-1 rounded-xl border border-sky-200 text-xs">
              <RotateCw className="w-3.5 h-3.5 text-sky-600" />
              <input
                type="range"
                min="-45"
                max="45"
                value={selectedElement.rotation || 0}
                onChange={(e) => updateSelected('rotation', parseInt(e.target.value))}
                className="w-16 h-1.5 accent-sky-500"
              />
              <span className="text-[10px] font-mono text-slate-500">{selectedElement.rotation || 0}°</span>
            </div>

            {/* Duplicate & Delete Actions */}
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer"
              title="Nhân bản (Duplicate)"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
              title="Xóa phần tử"
            >
              <Trash2 className="w-4 h-4" />
            </button>

          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Chạm vào bất kỳ chữ, ảnh hoặc sticker trên thiệp để chỉnh sửa vị trí & thuộc tính</span>
          </div>
        )}

        {/* Right: Aspect ratio & Export Action */}
        <div className="flex items-center gap-2">
          {/* Ratio Switcher */}
          <div className="flex items-center bg-sky-50 p-0.5 rounded-xl border border-sky-200 text-xs font-bold">
            <button
              onClick={() => setAspectRatio('story')}
              className={`px-2.5 py-1 rounded-lg ${aspectRatio === 'story' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
            >
              Story 9:16
            </button>
            <button
              onClick={() => setAspectRatio('square')}
              className={`px-2.5 py-1 rounded-lg ${aspectRatio === 'square' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
            >
              Vuông 1:1
            </button>
            <button
              onClick={() => setAspectRatio('classic')}
              className={`px-2.5 py-1 rounded-lg ${aspectRatio === 'classic' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
            >
              Thiệp 5:7
            </button>
          </div>

          <button
            onClick={handleExportCanvaImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:brightness-105 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-500/20 cursor-pointer font-genz transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang Xuất Ảnh...' : 'Tải Ảnh Canva (2K)'}</span>
          </button>
        </div>

      </div>

      {/* Canva Workspace: Left Toolbar + Center Drag & Drop Canvas */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        
        {/* Left Canva Toolbar */}
        <div className="md:col-span-4 xl:col-span-3 bg-white border-r border-sky-100 flex flex-col overflow-y-auto max-h-[calc(100vh-110px)] shadow-sm">
          
          {/* Toolbar Tabs */}
          <div className="grid grid-cols-4 gap-1 p-2 border-b border-sky-100 text-xs font-bold font-genz bg-sky-50/50">
            <button
              onClick={() => setActiveSidebarTab('templates')}
              className={`py-2 px-1 rounded-xl text-center cursor-pointer transition-all ${
                activeSidebarTab === 'templates' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-100/60'
              }`}
            >
              <LayoutTemplate className="w-4 h-4 mx-auto mb-0.5" />
              Mẫu Phôi
            </button>
            <button
              onClick={() => setActiveSidebarTab('text')}
              className={`py-2 px-1 rounded-xl text-center cursor-pointer transition-all ${
                activeSidebarTab === 'text' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-100/60'
              }`}
            >
              <Type className="w-4 h-4 mx-auto mb-0.5" />
              Văn Bản
            </button>
            <button
              onClick={() => setActiveSidebarTab('stickers')}
              className={`py-2 px-1 rounded-xl text-center cursor-pointer transition-all ${
                activeSidebarTab === 'stickers' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-100/60'
              }`}
            >
              <Smile className="w-4 h-4 mx-auto mb-0.5" />
              Stickers
            </button>
            <button
              onClick={() => setActiveSidebarTab('photos')}
              className={`py-2 px-1 rounded-xl text-center cursor-pointer transition-all ${
                activeSidebarTab === 'photos' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-sky-100/60'
              }`}
            >
              <ImageIcon className="w-4 h-4 mx-auto mb-0.5" />
              Tải Ảnh
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="p-4 space-y-4 text-xs">
            
            {/* TAB: TEMPLATES */}
            {activeSidebarTab === 'templates' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Chọn phôi màu chủ đạo:
                </h4>
                
                <div
                  onClick={() => applyPresetTemplate('ocean')}
                  className="p-3 rounded-2xl border border-sky-200 bg-sky-50 hover:border-sky-400 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-black text-sky-900 font-genz text-sm">🌊 Ocean Sky Blue</div>
                    <div className="text-[11px] text-sky-700">Tươi sáng • Nam tính / Năng động</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-sky-400 border border-white shadow"></div>
                </div>

                <div
                  onClick={() => applyPresetTemplate('pink')}
                  className="p-3 rounded-2xl border border-pink-200 bg-pink-50 hover:border-pink-400 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-black text-pink-900 font-genz text-sm">🌸 Pastel Peach Blossom</div>
                    <div className="text-[11px] text-pink-700">Ngọt ngào • Nữ tính / Cute</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-pink-400 border border-white shadow"></div>
                </div>

                <div
                  onClick={() => applyPresetTemplate('gold')}
                  className="p-3 rounded-2xl border border-amber-200 bg-amber-50 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-black text-amber-900 font-genz text-sm">🏛️ Royal Navy & Gold</div>
                    <div className="text-[11px] text-amber-700">Trang trọng • Thầy cô / Bố mẹ</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-400 border border-white shadow"></div>
                </div>
              </div>
            )}

            {/* TAB: TEXT */}
            {activeSidebarTab === 'text' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Bấm để thêm chữ vào thiệp:
                </h4>

                <button
                  onClick={() => handleAddText('heading')}
                  className="w-full py-3 px-4 rounded-2xl bg-sky-50 border border-sky-200 text-left hover:bg-sky-100/60 cursor-pointer transition-all"
                >
                  <div className="text-base font-black text-slate-900 font-genz">+ Thêm Tiêu Đề Lớn</div>
                  <div className="text-[10px] text-slate-500">Dành cho tên sự kiện, danh hiệu</div>
                </button>

                <button
                  onClick={() => handleAddText('subheading')}
                  className="w-full py-2.5 px-4 rounded-2xl bg-sky-50 border border-sky-200 text-left hover:bg-sky-100/60 cursor-pointer transition-all"
                >
                  <div className="text-sm font-bold text-slate-800 font-genz">+ Thêm Tiêu Đề Phụ</div>
                  <div className="text-[10px] text-slate-500">Dành cho học vị, thời gian, lời mời</div>
                </button>

                <button
                  onClick={() => handleAddText('body')}
                  className="w-full py-2 px-4 rounded-2xl bg-sky-50 border border-sky-200 text-left hover:bg-sky-100/60 cursor-pointer transition-all"
                >
                  <div className="text-xs font-semibold text-slate-700 font-script text-base">+ Thêm Lời Nhắn Nghệ Thuật</div>
                  <div className="text-[10px] text-slate-500">Dành cho trích dẫn viết tay</div>
                </button>

                {/* Direct text editor if text element selected */}
                {selectedElement && selectedElement.type === 'text' && (
                  <div className="pt-3 border-t border-sky-100 space-y-1.5">
                    <label className="font-bold text-slate-700 block">Sửa nội dung chữ:</label>
                    <textarea
                      rows={2}
                      value={selectedElement.content}
                      onChange={(e) => updateSelected('content', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-semibold focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB: STICKERS */}
            {activeSidebarTab === 'stickers' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Chọn sticker tốt nghiệp thả vào thiệp:
                </h4>

                <div className="grid grid-cols-4 gap-2">
                  {GRADUATION_STICKERS.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddSticker(st.icon)}
                      className="p-3 text-2xl rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 cursor-pointer transition-transform hover:scale-110 flex items-center justify-center shadow-sm"
                      title={st.label}
                    >
                      {st.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PHOTOS */}
            {activeSidebarTab === 'photos' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Tải ảnh từ máy tính vào thiệp:
                </h4>

                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100/50 cursor-pointer transition-all text-center">
                  <ImageIcon className="w-8 h-8 text-sky-500 mb-2" />
                  <span className="font-bold text-sky-700 text-xs">Bấm để tải ảnh lên</span>
                  <span className="text-[10px] text-slate-400 mt-1">PNG, JPG sắc nét</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

          </div>

        </div>

        {/* Center Drag & Drop Canvas Area */}
        <div
          className="md:col-span-8 xl:col-span-9 bg-sky-50/60 p-4 sm:p-8 flex items-center justify-center overflow-auto"
          onClick={() => setSelectedId(null)}
        >
          {/* Canvas Wrapper */}
          <div
            ref={canvasRef}
            className={`relative overflow-hidden shadow-2xl transition-all duration-300 ${
              aspectRatio === 'story'
                ? 'w-[360px] h-[640px]'
                : aspectRatio === 'square'
                ? 'w-[450px] h-[450px]'
                : 'w-[400px] h-[560px]'
            }`}
            style={{
              background: canvasBg,
              borderRadius: '24px',
              border: '2px solid rgba(56, 189, 248, 0.4)'
            }}
          >
            {/* Canvas Outer Border Glow Frame */}
            <div className="absolute inset-2 border border-white/15 pointer-events-none rounded-[18px]"></div>

            {/* Dynamic Draggable Canvas Elements */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDown(e, el.id)}
                  className={`absolute cursor-move select-none transition-shadow ${
                    isSelected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-transparent' : 'hover:outline hover:outline-1 hover:outline-sky-400/50'
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                    opacity: el.opacity ?? 1,
                    zIndex: isSelected ? 20 : 10
                  }}
                >
                  {/* Element Type 1: Text */}
                  {el.type === 'text' && (
                    <div
                      style={{
                        fontSize: `${el.fontSize}px`,
                        fontFamily: el.fontFamily,
                        color: el.color,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        textAlign: el.textAlign,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.3
                      }}
                    >
                      {el.content}
                    </div>
                  )}

                  {/* Element Type 2: Sticker Emoji */}
                  {el.type === 'sticker' && (
                    <div
                      style={{
                        fontSize: `${el.fontSize}px`,
                        lineHeight: 1
                      }}
                    >
                      {el.content}
                    </div>
                  )}

                  {/* Element Type 3: Image */}
                  {el.type === 'image' && (
                    <img
                      src={el.content}
                      alt="Element"
                      draggable={false}
                      className="object-cover shadow-lg pointer-events-none"
                      style={{
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        borderRadius: el.borderRadius,
                        border: el.border
                      }}
                    />
                  )}

                  {/* Element Type 4: QR Code */}
                  {el.type === 'qr' && qrCodeUrl && (
                    <div className="p-1.5 bg-white rounded-xl shadow-lg border border-sky-100">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        draggable={false}
                        className="pointer-events-none"
                        style={{ width: `${el.width}px`, height: `${el.height}px` }}
                      />
                    </div>
                  )}

                  {/* Floating Action Badge when Selected */}
                  {isSelected && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none whitespace-nowrap">
                      Đang chọn (Kéo để dời)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

