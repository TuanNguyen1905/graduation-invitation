import React, { useState } from 'react';
import { MessageSquare, Lock, Search, Trash2, Heart, Sparkles } from 'lucide-react';
import { deleteWishFromApi } from '../services/api';

/**
 * Trang quản lý Sổ Lưu Bút dành riêng cho Admin.
 * Hiển thị toàn bộ lời chúc đã gửi từ Landing Page & Thiệp mời cá nhân.
 */
export default function WishManager({ invitation, setInvitation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const wishes = invitation?.wishes || [];

  const filteredWishes = wishes.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      (w.guestName || '').toLowerCase().includes(q) ||
      (w.message || '').toLowerCase().includes(q) ||
      (w.relationship || '').toLowerCase().includes(q)
    );
  });

  const handleDeleteWish = async (wishId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lời chúc này khỏi Sổ Lưu Bút?')) return;
    setInvitation((prev) => ({
      ...prev,
      wishes: (prev.wishes || []).filter((w) => w.id !== wishId),
    }));
    await deleteWishFromApi(wishId);
  };

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 font-genz">
              <MessageSquare className="w-6 h-6 text-amber-500" />
              Sổ Lưu Bút & Lời Chúc Riêng Tư
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              Chỉ Admin đã đăng nhập mới nhìn thấy nội dung lời chúc của các khách mời.
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white border border-sky-100 shadow-2xs text-xs font-bold text-slate-700 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Tổng cộng:</span>
            <span className="text-sky-600 font-black font-genz text-sm">{wishes.length}</span>
            <span>lời chúc</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 rounded-2xl bg-white border border-sky-100 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên người gửi hoặc nội dung lời chúc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-sky-50/50 border border-sky-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>
        </div>

        {/* Wishes Grid */}
        {filteredWishes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-sky-100 shadow-sm space-y-2">
            <Sparkles className="w-8 h-8 text-sky-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700 font-genz">
              {wishes.length === 0
                ? 'Chưa có lời chúc nào được gửi'
                : 'Không tìm thấy lời chúc phù hợp'}
            </div>
            <p className="text-xs text-slate-400">
              Khi khách mời viết lưu bút từ trang chủ hoặc thiệp mời cá nhân, lời chúc sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWishes.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white border border-sky-100 shadow-sm hover:border-sky-200 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-xl shrink-0">
                        {item.emoji || '🎓'}
                      </span>
                      <div>
                        <div className="text-sm font-black text-slate-900 font-genz">
                          {item.guestName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.relationship && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-bold">
                              {item.relationship}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.time || 'Vừa xong'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteWish(item.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 cursor-pointer transition-all"
                      title="Xóa lời chúc này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-sky-50/40 border border-sky-100/70 rounded-2xl p-3.5 italic">
                    "{item.message}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
