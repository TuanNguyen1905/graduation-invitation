import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Eye,
  Download,
  Trash2,
  Share2,
  Sparkles,
  Link as LinkIcon,
  Search,
  FileSpreadsheet,
  Palette,
  Heart,
  Smile,
  Shield,
  Filter,
  Mail,
  Sun,
  Moon,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { THEMES, ROMANTIC_SPECIAL_TEMPLATE_ID } from '../data/mockData';
import ShareModal from './ShareModal';
import SpecialGuestEditor from './SpecialGuestEditor';
import { generateUniqueInviteCode, getGuestInvitationUrl } from '../utils/inviteHelper';
import {
  createGuestInApi,
  createBulkGuestsInApi,
  updateGuestModeInApi,
  applyModeToAllGuestsInApi,
  updateGuestInApi,
  regenerateGuestCodeInApi,
  deleteGuestFromApi
} from '../services/api';

export default function GuestManager({
  invitation,
  setInvitation,
  currentGuest,
  setCurrentGuest,
  allThemes = THEMES,
  onOpenExportModal,
  onSwitchToGuestView,
  onOpenGuestPortal
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkThemeId, setBulkThemeId] = useState(allThemes[0]?.id || 'genz-ocean-blue');
  const [bulkThemeMode, setBulkThemeMode] = useState('dark');
  const [bulkSalutation, setBulkSalutation] = useState('Thân mời');
  const [bulkRelationship, setBulkRelationship] = useState('Bạn bè');
  const [bulkCustomNote, setBulkCustomNote] = useState('Ghé chụp ảnh và chung vui ngày nhận bằng cùng mình nhé! ✨');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [shareTargetGuest, setShareTargetGuest] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'confirmed', 'pending', 'declined'
  const [filterGender, setFilterGender] = useState('all'); // 'all', 'male', 'female', 'unisex'

  // Export full guest list to UTF-8 BOM CSV (Excel Compatible)
  const handleExportCsv = () => {
    if (!invitation?.guests || invitation.guests.length === 0) {
      alert('Chưa có khách mời nào để xuất.');
      return;
    }
    const headers = [
      'Mã ID Thiệp Duy Nhất',
      'Họ và tên',
      'Email',
      'Xưng hô',
      'Mối quan hệ',
      'Giới tính',
      'Tính cách',
      'Tone màu template',
      'Chế độ giao diện',
      'Trạng thái RSVP',
      'Số người tham dự',
      'Lời nhắn riêng',
      'Đường link xem thiệp riêng'
    ];

    const rows = invitation.guests.map((g) => {
      const guestUrl = getGuestInvitationUrl(g);
      const matchedTheme = THEMES.find((t) => t.id === g.themeId);
      const themeName = matchedTheme?.name || g.themeId || 'Mặc định';
      const modeText = g.themeMode === 'light' ? 'Sáng (Light)' : 'Tối (Dark)';
      const statusText =
        g.rsvpStatus === 'confirmed'
          ? 'Tham dự'
          : g.rsvpStatus === 'declined'
          ? 'Báo vắng'
          : 'Chờ phản hồi';

      return [
        `"${g.inviteCode || g.id}"`,
        `"${g.name.replace(/"/g, '""')}"`,
        `"${(g.email || '').replace(/"/g, '""')}"`,
        `"${(g.salutation || '').replace(/"/g, '""')}"`,
        `"${(g.relationship || '').replace(/"/g, '""')}"`,
        `"${g.gender === 'male' ? 'Nam' : g.gender === 'female' ? 'Nữ' : 'Khác'}"`,
        `"${g.persona || 'Bình thường'}"`,
        `"${themeName}"`,
        `"${modeText}"`,
        `"${statusText}"`,
        `"${g.guestCount || 1}"`,
        `"${(g.customNote || '').replace(/"/g, '""')}"`,
        `"${guestUrl}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_khach_tot_nghiep_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // New guest state with Gender, Persona, Theme & ThemeMode
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSalutation, setNewSalutation] = useState('Kính mời');
  const [newRelationship, setNewRelationship] = useState('Bạn bè');
  const [newGender, setNewGender] = useState('unisex'); // 'male', 'female', 'unisex'
  const [newPersona, setNewPersona] = useState('energetic'); // 'energetic', 'gentle', 'funny', 'formal'
  const [newThemeId, setNewThemeId] = useState('genz-ocean-blue');
  const [newThemeMode, setNewThemeMode] = useState('dark'); // 'dark' | 'light'
  const [newCustomNote, setNewCustomNote] = useState('');

  const { guests } = invitation;

  // Auto-suggest template & salutation based on gender / relationship
  const handleGenderSelect = (gender) => {
    setNewGender(gender);
    if (gender === 'female') {
      setNewPersona('gentle');
      setNewThemeId('genz-pastel-pink');
      if (newSalutation === 'Bro ơi' || newSalutation === 'Kính mời') setNewSalutation('Thân gửi bạn yêu');
    } else if (gender === 'male') {
      setNewPersona('energetic');
      setNewThemeId('genz-ocean-blue');
      if (newSalutation === 'Thân gửi bạn yêu') setNewSalutation('Bro ơi');
    } else {
      setNewPersona('funny');
      setNewThemeId('genz-holographic');
    }
  };

  const handleRelationshipSelect = (rel) => {
    setNewRelationship(rel);
    if (rel === 'Thầy cô' || rel === 'Gia đình') {
      setNewPersona('formal');
      setNewThemeId('royal-gold');
      setNewSalutation(rel === 'Thầy cô' ? 'Kính mời Thầy/Cô' : 'Kính gửi');
    } else if (rel === 'Bạn bè') {
      if (newGender === 'female') setNewThemeId('genz-pastel-pink');
      else if (newGender === 'male') setNewThemeId('genz-ocean-blue');
      else setNewThemeId('genz-holographic');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setIsBulkSaving(true);
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const newGuestList = lines.map((line, idx) => {
      // Hỗ trợ định dạng: "Tên khách" hoặc "Tên khách, email@domain.com"
      const parts = line.split(',').map((p) => p.trim());
      const gName = parts[0];
      const gEmail = parts[1] && parts[1].includes('@') ? parts[1] : '';
      const inviteCode = generateUniqueInviteCode(gName);

      return {
        id: `guest-bulk-${Date.now()}-${idx}`,
        inviteCode,
        name: gName,
        email: gEmail,
        salutation: bulkSalutation || 'Thân mời',
        relationship: bulkRelationship || 'Bạn bè',
        gender: 'unisex',
        persona: 'energetic',
        themeId: bulkThemeId || 'genz-ocean-blue',
        themeMode: bulkThemeMode || 'dark',
        customNote: bulkCustomNote || 'Ghé chụp ảnh và chung vui ngày nhận bằng cùng mình nhé! ✨',
        rsvpStatus: 'pending',
        guestCount: 1,
      };
    });

    // 1. Optimistic UI update
    setInvitation((prev) => ({
      ...prev,
      guests: [...newGuestList, ...prev.guests]
    }));

    // 2. Lưu từng dòng thiệp mời vào SQLite Database
    await createBulkGuestsInApi({
      invitationId: 'minh-dhbk-2026',
      guestsList: newGuestList,
      templateId: bulkThemeId,
      themeMode: bulkThemeMode,
      salutation: bulkSalutation,
      relationship: bulkRelationship,
      customNote: bulkCustomNote
    });

    setIsBulkSaving(false);
    setBulkText('');
    setShowBulkModal(false);
    alert(`Đã tự động tạo thành công ${newGuestList.length} thiệp mời cá nhân (cùng Template & chế độ ${bulkThemeMode === 'light' ? 'Sáng' : 'Tối'} đã chọn) và lưu vào Cơ sở dữ liệu!`);
  };

  // Change individual guest's theme directly from table (lưu thẳng vào SQLite)
  const handleGuestThemeChange = async (guestId, themeId) => {
    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => (g.id === guestId ? { ...g, themeId, customTheme: null } : g))
    }));
    if (currentGuest?.id === guestId) {
      setCurrentGuest((prev) => ({ ...prev, themeId, customTheme: null }));
    }
    await updateGuestInApi({ id: guestId, themeId, customTheme: null });
  };

  // Toggle individual guest's theme mode (Light / Dark) directly from table
  const handleToggleGuestMode = async (guestId, nextMode) => {
    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => (g.id === guestId ? { ...g, themeMode: nextMode } : g))
    }));
    if (currentGuest?.id === guestId) {
      setCurrentGuest((prev) => ({ ...prev, themeMode: nextMode }));
    }
    await updateGuestModeInApi(guestId, nextMode);
  };

  // Quick Action: Apply Light / Dark mode to all guests
  const handleApplyAllThemeMode = async (targetMode) => {
    const confirmMsg = targetMode === 'light'
      ? 'Bạn có chắc chắn muốn chuyển TOÀN BỘ danh sách khách mời sang chế độ Sáng (Light Mode)?'
      : 'Bạn có chắc chắn muốn chuyển TOÀN BỘ danh sách khách mời sang chế độ Tối (Dark Mode)?';
    if (!window.confirm(confirmMsg)) return;

    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => ({ ...g, themeMode: targetMode }))
    }));
    if (currentGuest) {
      setCurrentGuest((prev) => ({ ...prev, themeMode: targetMode }));
    }
    await applyModeToAllGuestsInApi(targetMode, 'minh-dhbk-2026');
  };

  const filteredGuests = guests.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || g.rsvpStatus === filterStatus;
    const matchesGender = filterGender === 'all' || (g.gender || 'unisex') === filterGender;
    return matchesSearch && matchesStatus && matchesGender;
  });

  const confirmedCount = guests.filter((g) => g.rsvpStatus === 'confirmed').reduce((acc, curr) => acc + (curr.guestCount || 1), 0);
  const declinedCount = guests.filter((g) => g.rsvpStatus === 'declined').length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === 'pending').length;

  const handleCopyLink = (guest) => {
    const shareUrl = getGuestInvitationUrl(guest);
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const inviteCode = generateUniqueInviteCode(newName.trim());
    const newGuestObj = {
      id: `guest-${Date.now()}`,
      inviteCode,
      name: newName.trim(),
      email: newEmail.trim(),
      salutation: newSalutation,
      relationship: newRelationship,
      gender: newGender,
      persona: newPersona,
      themeId: newThemeId,
      themeMode: newThemeMode,
      customNote: newCustomNote.trim(),
      rsvpStatus: 'pending',
      guestCount: 1,
    };

    setInvitation((prev) => ({
      ...prev,
      guests: [newGuestObj, ...prev.guests]
    }));

    // Lưu dòng thiệp mời vào SQLite Database
    await createGuestInApi({
      invitationId: 'minh-dhbk-2026',
      ...newGuestObj
    });

    setCurrentGuest(newGuestObj);
    setNewName('');
    setNewEmail('');
    setNewCustomNote('');
    setShowAddForm(false);
  };

  const handleSaveEditGuest = async (e) => {
    e.preventDefault();
    if (!editingGuest || !editingGuest.name?.trim()) return;

    setIsSavingEdit(true);
    const updatedGuest = {
      ...editingGuest,
      name: editingGuest.name.trim(),
      email: (editingGuest.email || '').trim(),
      customNote: (editingGuest.customNote || '').trim(),
      // Nếu đổi templateId khác với lúc mở modal thì xóa customTheme override cũ
      customTheme: editingGuest.keepCustomTheme ? editingGuest.customTheme : null,
    };
    delete updatedGuest.keepCustomTheme;

    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.map((g) => (g.id === updatedGuest.id ? updatedGuest : g))
    }));
    if (currentGuest?.id === updatedGuest.id) {
      setCurrentGuest(updatedGuest);
    }

    await updateGuestInApi(updatedGuest);
    setIsSavingEdit(false);
    setEditingGuest(null);
  };

  const handleRegenerateCode = async (guestId) => {
    if (!window.confirm('Cấp mã thiệp mới (>=8 ký tự ngẫu nhiên) và vô hiệu hóa mã cũ ngay lập tức?')) {
      return;
    }
    const res = await regenerateGuestCodeInApi(guestId);
    if (res?.success && res.inviteCode) {
      setInvitation((prev) => ({
        ...prev,
        guests: prev.guests.map((g) => (g.id === guestId ? { ...g, inviteCode: res.inviteCode } : g))
      }));
      if (currentGuest?.id === guestId) {
        setCurrentGuest((prev) => (prev ? { ...prev, inviteCode: res.inviteCode } : prev));
      }
      setEditingGuest((prev) => (prev && prev.id === guestId ? { ...prev, inviteCode: res.inviteCode } : prev));
    } else {
      alert(res?.error || 'Không thể cấp mã mới.');
    }
  };

  const handleDeleteGuest = async (id) => {
    if (guests.length <= 1) {
      alert('Cần giữ ít nhất 1 khách mời mẫu.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách mời này?')) return;
    setInvitation((prev) => ({
      ...prev,
      guests: prev.guests.filter((g) => g.id !== id)
    }));
    if (currentGuest?.id === id) {
      const remaining = guests.filter((g) => g.id !== id);
      setCurrentGuest(remaining[0]);
    }
    await deleteGuestFromApi(id);
  };

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 font-genz">
              <Users className="w-6 h-6 text-sky-500" />
              Quản Lý Khách Mời & Cá Nhân Hóa Tone Màu Riêng
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gán template, màu sắc và thông điệp riêng theo từng giới tính & tính cách của mỗi người ✨
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-sm transition-all cursor-pointer font-genz"
              title="Tải toàn bộ danh sách khách dạng bảng tính Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Xuất CSV (Excel)
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200 shadow-sm transition-all cursor-pointer font-genz"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
              Nhập nhanh danh sách
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:brightness-105 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 transition-all cursor-pointer font-genz"
            >
              <UserPlus className="w-4 h-4" />
              {showAddForm ? 'Đóng' : '+ Thêm Khách Mới'}
            </button>
          </div>
        </div>

        {/* Stats Grid - Light Ocean Blue Aesthetic */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-sm">
            <div className="text-xs text-slate-400 uppercase font-semibold">Tổng Khách Mời</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-mono">
              {guests.length}
            </div>
            <div className="text-[11px] text-sky-600 mt-0.5">Danh sách thiệp riêng biệt</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm">
            <div className="text-xs text-emerald-600 uppercase font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sẽ Tham Dự
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 font-mono">
              {confirmedCount} <span className="text-sm font-normal text-slate-500">người</span>
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Đã xác nhận có mặt</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-sm">
            <div className="text-xs text-amber-600 uppercase font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Chờ Phản Hồi
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 font-mono">
              {pendingCount}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Chưa gửi phản hồi</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-sm">
            <div className="text-xs text-rose-500 uppercase font-semibold flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Báo Vắng Mặt
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 mt-1 font-mono">
              {declinedCount}
            </div>
            <div className="text-[11px] text-rose-500/80 mt-0.5">Gửi lời chúc từ xa</div>
          </div>
        </div>

        {/* Add Guest Modal/Form Drawer - White & Light Sky Blue */}
        {showAddForm && (
          <form onSubmit={handleAddGuest} className="p-6 rounded-3xl bg-white border border-sky-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h3 className="text-sm font-black text-sky-900 uppercase tracking-wider flex items-center gap-2 font-genz">
                <Sparkles className="w-4 h-4 text-sky-500" />
                Thêm Khách Mời & Chọn Tone Màu / Template Riêng
              </h3>
              <span className="text-xs text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full font-semibold">
                Cá nhân hóa theo giới tính & tính cách
              </span>
            </div>

            {/* Step 1: Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên khách mời: <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="VD: Mai Linh, Tuấn Anh, Thầy Quân..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                />
                {newName.trim() && (
                  <div className="text-[10px] text-sky-600 font-mono mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    <span>Mã ID duy nhất: <strong>INV-{newName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GUEST'}-AUTO</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email nhận thiệp (Gửi qua Aliyun):</label>
                <input
                  type="email"
                  placeholder="VD: khachmoi@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mối quan hệ:</label>
                <select
                  value={newRelationship}
                  onChange={(e) => handleRelationshipSelect(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="Bạn bè">Bạn bè thân thiết</option>
                  <option value="Thầy cô">Thầy cô & Giảng viên</option>
                  <option value="Gia đình">Gia đình & Người thân</option>
                  <option value="Đồng nghiệp">Đồng nghiệp / Cơ quan</option>
                  <option value="Khách quý">Khách quý danh dự</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cách xưng hô:</label>
                <input
                  type="text"
                  value={newSalutation}
                  onChange={(e) => setNewSalutation(e.target.value)}
                  placeholder="VD: Hú le bạn yêu, Kính mời..."
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>
            </div>

            {/* Step 2: Gender, Personality & Theme Selection */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Gender */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">1. Giới tính:</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'male', label: '👨 Nam' },
                      { id: 'female', label: '👩 Nữ' },
                      { id: 'unisex', label: '👥 Nhóm / Chung' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleGenderSelect(g.id)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          newGender === g.id
                            ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                            : 'bg-white text-slate-600 border-sky-200 hover:bg-sky-50'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Persona */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">2. Tính cách / Phong cách:</label>
                  <select
                    value={newPersona}
                    onChange={(e) => setNewPersona(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                  >
                    <option value="energetic">🔥 Năng động, cool ngầu</option>
                    <option value="gentle">🌸 Dịu dàng, nữ tính, cute</option>
                    <option value="funny">⚡ Quậy, vui nhộn, hài hước</option>
                    <option value="formal">🏛️ Trang trọng, cung kính</option>
                  </select>
                </div>

                {/* Chosen Theme */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">3. Tone màu / Template:</label>
                  <select
                    value={newThemeId}
                    onChange={(e) => setNewThemeId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-900 font-bold focus:outline-none focus:border-sky-500 ring-1 ring-sky-200"
                  >
                    {allThemes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.isSavedTemplate ? `📌 [Đã lưu] ${t.name}` : `${t.name} (${t.badge})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Theme Mode: Light or Dark */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">4. Chế độ Sáng / Tối:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewThemeMode('light')}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        newThemeMode === 'light'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-1 ring-amber-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Sáng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewThemeMode('dark')}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        newThemeMode === 'dark'
                          ? 'bg-slate-900 border-sky-500 text-sky-300 shadow-sm ring-1 ring-sky-400'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                      <span>Tối</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">
                Lời nhắn nhủ riêng (Hiển thị nổi bật trên đầu thiệp của khách này):
              </label>
              <textarea
                rows={2}
                placeholder="VD: Nhớ mặc outfit xinh pastel đến chụp với tui vài bô ảnh cháy máy nhé!"
                value={newCustomNote}
                onChange={(e) => setNewCustomNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-500 resize-none font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 cursor-pointer"
              >
                Lưu Khách Mời & Gán Tone Màu
              </button>
            </div>
          </form>
        )}

        {/* Bulk Import & Same-Template Generator Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl bg-white border border-sky-200 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
              <div className="border-b border-sky-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 font-genz">
                  <FileSpreadsheet className="w-5 h-5 text-sky-500" />
                  Tạo & Gửi Hàng Loạt Thiệp Mời Theo Cùng Template
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nhập danh sách tên (hoặc <code className="bg-sky-50 px-1 rounded text-sky-700">Tên, email@domain.com</code>). Hệ thống sẽ tạo từng dòng thiệp mời trong Database kèm Mã ID duy nhất và gán chung Template đã chọn!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. Chọn Template áp dụng chung:
                  </label>
                  <select
                    value={bulkThemeId}
                    onChange={(e) => setBulkThemeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sky-50/60 border border-sky-300 text-sky-900 font-bold focus:outline-none focus:border-sky-500"
                  >
                    {allThemes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.isSavedTemplate ? `📌 [Mẫu đã tạo] ${t.name}` : t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Chế độ giao diện chung:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBulkThemeMode('light')}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        bulkThemeMode === 'light'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-1 ring-amber-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Sáng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkThemeMode('dark')}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        bulkThemeMode === 'dark'
                          ? 'bg-slate-900 border-sky-500 text-sky-300 shadow-sm ring-1 ring-sky-400'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                      <span>Tối</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Xưng hô chung:</label>
                    <input
                      type="text"
                      value={bulkSalutation}
                      onChange={(e) => setBulkSalutation(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mối quan hệ:</label>
                    <select
                      value={bulkRelationship}
                      onChange={(e) => setBulkRelationship(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-semibold"
                    >
                      <option value="Bạn bè">Bạn bè</option>
                      <option value="Thầy cô">Thầy cô</option>
                      <option value="Gia đình">Gia đình</option>
                      <option value="Đồng nghiệp">Đồng nghiệp</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">
                  2. Lời nhắn chung hiển thị trên thiệp của nhóm này:
                </label>
                <input
                  type="text"
                  value={bulkCustomNote}
                  onChange={(e) => setBulkCustomNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    3. Danh sách tên người nhận (Mỗi người 1 dòng):
                  </label>
                  <span className="text-[11px] text-sky-600 font-bold">
                    {bulkText.split('\n').map(l => l.trim()).filter(Boolean).length} người
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"Nguyễn Văn An, an.nv@gmail.com\nTrần Mai Hoa, maihoa@gmail.com\nLê Hoàng Long\nNhóm Bạn Cấp 3"}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-sky-50/50 border border-sky-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={isBulkSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 font-genz"
                >
                  {isBulkSaving ? 'Đang tạo & lưu DB...' : '⚡ Tạo Hàng Loạt & Lưu Vào DB'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar - White & Light Sky Blue */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-sky-100 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách mời..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          {/* Gender Filter Pills */}
          <div className="flex items-center gap-1 text-xs font-bold font-genz overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Lọc:
            </span>
            <button
              onClick={() => setFilterGender('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterGender === 'all' ? 'bg-sky-500 text-white font-black shadow-sm' : 'bg-sky-50 text-slate-600 hover:bg-sky-100'
              }`}
            >
              Tất cả giới tính
            </button>
            <button
              onClick={() => setFilterGender('male')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterGender === 'male' ? 'bg-sky-500 text-white font-black shadow-sm' : 'bg-sky-50 text-slate-600 hover:bg-sky-100'
              }`}
            >
              👨 Nam
            </button>
            <button
              onClick={() => setFilterGender('female')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterGender === 'female' ? 'bg-pink-500 text-white font-black shadow-sm' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
              }`}
            >
              👩 Nữ
            </button>
          </div>

          {/* RSVP Status Pills */}
          <div className="flex items-center gap-1 text-xs font-bold font-genz overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({guests.length})
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Tham dự
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'pending' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => setFilterStatus('declined')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'declined' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Vắng
            </button>
          </div>
        </div>

        {/* Guest List Table - Crisp White & Light Sky Blue Accent */}
        <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3 bg-sky-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-genz flex items-center gap-2">
                Danh Sách Khách & Tone Màu Đã Gán ({filteredGuests.length})
              </h3>
              <span className="text-xs text-slate-500">
                Tùy chỉnh Template & Chế độ Sáng / Tối riêng cho từng khách hoặc toàn bộ danh sách
              </span>
            </div>

            {/* Quick Action: Apply all Light / Dark */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Chế độ chung:</span>
              <button
                type="button"
                onClick={() => handleApplyAllThemeMode('light')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                title="Đổi toàn bộ khách mời sang chế độ Sáng (Light Mode)"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>☀️ Đặt tất cả Sáng</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyAllThemeMode('dark')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                title="Đổi toàn bộ khách mời sang chế độ Tối (Dark Mode)"
              >
                <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                <span>🌙 Đặt tất cả Tối</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-sky-100">
            {filteredGuests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Không tìm thấy khách mời nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredGuests.map((guest) => {
                const isSelected = currentGuest?.id === guest.id;
                const guestUrl = getGuestInvitationUrl(guest);
                const guestTheme = allThemes.find((t) => t.id === guest.themeId) || allThemes[0];
                const displayId = guest.inviteCode || guest.id;

                return (
                  <div
                    key={guest.id}
                    className={`p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all ${
                      isSelected ? 'bg-sky-50/80 border-l-4 border-sky-500' : 'hover:bg-sky-50/40'
                    }`}
                  >
                    {/* Left Guest Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Unique Invitation ID Badge */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-sky-100/90 text-sky-800 font-mono text-[11px] font-black border border-sky-200 shadow-xs">
                          {displayId}
                        </span>

                        <span className="text-xs text-slate-500 font-medium">
                          {guest.salutation}
                        </span>
                        <span className="text-base font-black text-slate-900 font-genz">
                          {guest.name}
                        </span>
                        
                        {/* Gender Badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          guest.gender === 'female'
                            ? 'bg-pink-100 text-pink-700'
                            : guest.gender === 'male'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {guest.gender === 'female' ? '👩 Nữ' : guest.gender === 'male' ? '👨 Nam' : '👥 Nhóm'}
                        </span>

                        {/* Relationship Badge */}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {guest.relationship}
                        </span>

                        {/* Email Badge if present */}
                        {guest.email && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono border border-sky-100 flex items-center gap-1 break-all">
                            <Mail className="w-3 h-3 text-sky-500 shrink-0" />
                            {guest.email}
                          </span>
                        )}
                      </div>

                      {guest.customNote && (
                        <p className="text-xs italic text-slate-600 max-w-xl">
                          "{guest.customNote}"
                        </p>
                      )}

                      {/* Guest URL */}
                      <div className="text-xs text-sky-600 font-mono truncate max-w-full sm:max-w-md">
                        {guestUrl}
                      </div>
                    </div>

                    {/* Middle: Tone / Template Selector & Theme Mode Toggle */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <div className="flex items-center gap-1.5 bg-white px-3 min-h-[44px] rounded-xl border border-sky-200 text-xs shadow-sm max-w-full">
                        <Palette className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="text-slate-500 text-xs shrink-0">Template:</span>
                        <select
                          value={guest.themeId || allThemes[0].id}
                          onChange={(e) => handleGuestThemeChange(guest.id, e.target.value)}
                          className="bg-transparent text-sky-700 font-bold focus:outline-none cursor-pointer text-xs min-h-[40px] max-w-[160px] truncate"
                        >
                          {guest.themeId === ROMANTIC_SPECIAL_TEMPLATE_ID && (
                            <option value={ROMANTIC_SPECIAL_TEMPLATE_ID} className="text-rose-700">
                              💌 Thiệp Riêng Lãng Mạn (Bespoke)
                            </option>
                          )}
                          {allThemes.map((t) => (
                            <option key={t.id} value={t.id} className="text-slate-900">
                              {t.isCustom ? `★ ${t.name}` : t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Theme Mode Toggle for this guest */}
                      <button
                        type="button"
                        onClick={() => handleToggleGuestMode(guest.id, guest.themeMode === 'light' ? 'dark' : 'light')}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                          guest.themeMode === 'light'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                            : 'bg-slate-900 border-slate-700 text-sky-300 hover:bg-slate-800'
                        }`}
                        title={guest.themeMode === 'light' ? 'Giao diện Sáng (Bấm để đổi sang Tối)' : 'Giao diện Tối (Bấm để đổi sang Sáng)'}
                      >
                        {guest.themeMode === 'light' ? (
                          <>
                            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Sáng</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                            <span>Tối</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right: Status Badge & Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      
                      {/* RSVP Status */}
                      <div className="mr-1">
                        {guest.rsvpStatus === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Tham dự ({guest.guestCount || 1} người)
                          </span>
                        )}
                        {guest.rsvpStatus === 'declined' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Báo vắng
                          </span>
                        )}
                        {guest.rsvpStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Chờ phản hồi
                          </span>
                        )}
                      </div>

                      {/* Copy Link Button */}
                      <button
                        onClick={() => handleCopyLink(guest)}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 text-xs font-bold border border-sky-200 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        title="Sao chép link gửi cho khách"
                      >
                        {copiedId === guest.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 text-xs">Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-sky-500" />
                            <span className="text-xs">Chép link</span>
                          </>
                        )}
                      </button>

                      {/* Share & QR Modal Trigger */}
                      <button
                        onClick={() => setShareTargetGuest(guest)}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        title="Chia sẻ Zalo/Mess & gửi Email qua Aliyun"
                      >
                        <Mail className="w-4 h-4 text-amber-300" />
                        <span className="text-xs">Gửi Mail / QR</span>
                      </button>

                      {/* View Invite as this guest (Dedicated Public Portal) */}
                      <button
                        onClick={() => {
                          if (onOpenGuestPortal) {
                            onOpenGuestPortal(guest);
                          } else {
                            setCurrentGuest(guest);
                            onSwitchToGuestView();
                          }
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all font-genz"
                        title="Mở giao diện mà chính người được mời sẽ nhìn thấy khi truy cập link của họ"
                      >
                        <Eye className="w-4 h-4 text-sky-200" />
                        <span className="text-xs">Xem Giao Diện Khách</span>
                      </button>

                      {/* Edit Sent Guest Card Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingGuest({
                            ...guest,
                            keepCustomTheme: !!guest.customTheme,
                          })
                        }
                        className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                        title="Điều chỉnh thông tin, lời nhắn & giao diện của thiệp đã gửi"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="text-xs">Sửa thiệp</span>
                      </button>

                      {/* Export Card for this guest */}
                      <button
                        onClick={() => {
                          setCurrentGuest(guest);
                          onOpenExportModal();
                        }}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-semibold border border-sky-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
                        title="Xuất ảnh thiệp mời cho khách này"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center cursor-pointer transition-all"
                        title="Xóa khách"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Edit Sent Invitation Modal */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveEditGuest}
            className="relative w-full max-w-2xl bg-white border border-sky-200 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-2 border-b border-sky-100 pb-3">
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 font-genz">
                  <Edit3 className="w-5 h-5 text-sky-500 shrink-0" />
                  <span>Điều Chỉnh Thiệp Đã Tạo / Đã Gửi</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                  <span>
                    Mã thiệp: <span className="font-mono font-bold text-sky-700 break-all">{editingGuest.inviteCode || editingGuest.id}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRegenerateCode(editingGuest.id)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold cursor-pointer"
                  >
                    Cấp mã mới (≥8 ký tự)
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên khách mời hiển thị *</label>
                <input
                  type="text"
                  required
                  value={editingGuest.name || ''}
                  onChange={(e) => setEditingGuest((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Xưng hô / Lời chào</label>
                <input
                  type="text"
                  value={editingGuest.salutation || ''}
                  onChange={(e) => setEditingGuest((prev) => ({ ...prev, salutation: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mối quan hệ</label>
                <select
                  value={editingGuest.relationship || 'Bạn bè'}
                  onChange={(e) => setEditingGuest((prev) => ({ ...prev, relationship: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="Bạn bè">Bạn bè</option>
                  <option value="Người yêu">Người yêu</option>
                  <option value="Thầy cô">Thầy cô</option>
                  <option value="Gia đình">Gia đình</option>
                  <option value="Đồng nghiệp">Đồng nghiệp</option>
                  <option value="Khách quý">Khách quý</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingGuest.email || ''}
                  onChange={(e) => setEditingGuest((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@domain.com"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Template giao diện</label>
                <select
                  value={editingGuest.themeId || allThemes[0]?.id}
                  onChange={(e) =>
                    setEditingGuest((prev) => ({
                      ...prev,
                      themeId: e.target.value,
                      keepCustomTheme: false,
                    }))
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-sky-300 text-sky-900 font-bold focus:outline-none focus:border-sky-500"
                >
                  <option value={ROMANTIC_SPECIAL_TEMPLATE_ID}>
                    💌 Thiệp Riêng Lãng Mạn (Bespoke 3D)
                  </option>
                  {allThemes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.isSavedTemplate ? `📌 [Đã lưu] ${t.name}` : t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chế độ Sáng / Tối</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingGuest((prev) => ({ ...prev, themeMode: 'light' }))}
                    className={`min-h-[44px] py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      editingGuest.themeMode === 'light'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-300'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Sáng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingGuest((prev) => ({ ...prev, themeMode: 'dark' }))}
                    className={`min-h-[44px] py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      editingGuest.themeMode !== 'light'
                        ? 'bg-slate-900 border-sky-500 text-sky-300 ring-1 ring-sky-400'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                    <span>Tối</span>
                  </button>
                </div>
              </div>
            </div>

            {editingGuest.themeId === ROMANTIC_SPECIAL_TEMPLATE_ID && (
              <SpecialGuestEditor
                guestId={editingGuest.id}
                config={editingGuest.specialConfig}
                onChange={(nextSpecialConfig) =>
                  setEditingGuest((prev) => ({ ...prev, specialConfig: nextSpecialConfig }))
                }
              />
            )}

            {editingGuest.keepCustomTheme && editingGuest.customTheme && (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex items-center justify-between">
                <span>🎨 Thiệp này đang dùng bộ màu tùy biến riêng từ Studio.</span>
                <button
                  type="button"
                  onClick={() => setEditingGuest((prev) => ({ ...prev, keepCustomTheme: false }))}
                  className="underline font-bold cursor-pointer hover:text-indigo-950 min-h-[40px] px-2"
                >
                  Dùng lại Template chuẩn
                </button>
              </div>
            )}

            <div className="text-xs sm:text-sm">
              <label className="block font-bold text-slate-700 mb-1">Lời nhắn riêng hiển thị trên thiệp</label>
              <textarea
                rows={3}
                value={editingGuest.customNote || ''}
                onChange={(e) => setEditingGuest((prev) => ({ ...prev, customNote: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 font-medium focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-genz"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi Thiệp'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Personalized Share & QR Code Modal */}
      <ShareModal
        isOpen={!!shareTargetGuest}
        onClose={() => setShareTargetGuest(null)}
        guest={shareTargetGuest}
        graduate={invitation.graduate}
        ceremony={invitation.ceremony}
      />
    </div>
  );
}
