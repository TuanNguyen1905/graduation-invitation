export const DEFAULT_LAYOUT = {
  avatarStyle: 'circle', // 'circle' | 'polaroid' | 'banner'
  cardRoundness: 'rounded-3xl', // 'rounded-xl' | 'rounded-3xl' | 'rounded-none'
  alignment: 'center', // 'center' | 'left'
  sections: [
    { id: 'music', label: 'Trình phát nhạc Spotify', enabled: true, iconName: 'Headphones', desc: 'Thanh phát nhạc & sóng equalizer' },
    { id: 'school', label: 'Huy hiệu Trường & Khoa', enabled: true, iconName: 'GraduationCap', desc: 'Tên trường, khoa và niên khóa' },
    { id: 'hero', label: 'Lời mời & Chân dung Cử nhân', enabled: true, iconName: 'User', desc: 'Ảnh chân dung, lời nhắn gửi đích danh' },
    { id: 'reactions', label: 'Thanh thả cảm xúc Gen Z', enabled: true, iconName: 'Heart', desc: 'Nút thả tim, thả lửa, bắn pháo hoa' },
    { id: 'countdown', label: 'Đồng hồ đếm ngược', enabled: true, iconName: 'Clock', desc: 'Bộ đếm thời gian tới giờ làm lễ' },
    { id: 'venue', label: 'Thời gian & Địa điểm (Maps)', enabled: true, iconName: 'MapPin', desc: 'Thông tin địa điểm, bản đồ & thêm lịch' },
    { id: 'timeline', label: 'Lịch trình chi tiết', enabled: true, iconName: 'Calendar', desc: 'Từng mốc giờ đón khách & nhận bằng' },
    { id: 'gallery', label: 'Kỷ niệm thanh xuân (Album ảnh)', enabled: true, iconName: 'Camera', desc: 'Bộ sưu tập ảnh kỷ yếu & lightbox' },
    { id: 'rsvp', label: 'Xác nhận tham dự (RSVP)', enabled: true, iconName: 'CheckCircle2', desc: 'Form xác nhận tham dự & số người' },
    { id: 'guestbook', label: 'Sổ lưu bút & Lời chúc', enabled: true, iconName: 'MessageSquare', desc: 'Bức tường lời chúc từ bạn bè' },
  ]
};

export const DEFAULT_INVITATION = {
  layout: DEFAULT_LAYOUT,
  graduate: {
    fullName: "NGUYỄN HOÀNG MINH",
    nickname: "Minh Minzy",
    degree: "Cử Nhân Công Nghệ Thông Tin",
    honor: "Tốt Nghiệp Thủ Khoa Xuất Sắc 🏆",
    school: "TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐHQG TP.HCM",
    faculty: "Khoa Khoa Học & Kỹ Thuật Máy Tính",
    classBatch: "K22 • 2022 - 2026",
    avatarUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop",
    quote: "Chính thức hết thất học rồi quý dzị ơi! 4 năm cày deadline rực rỡ đã khép lại. Ghé nhận hoa và chụp với tui vài bô ảnh cháy máy nhé! ✨🎓",
    spotifySong: "Thanh Xuân (Graduation Anthem) • Da LAB",
    vibeStickers: ["✨ FINALLY GRADUATED", "🎓 100% UNLOCKED", "💅 LEVEL UP", "🔥 CHÁY MÁY NHÉ"]
  },
  ceremony: {
    date: "2026-11-20",
    time: "08:00",
    endExpected: "11:30",
    venueName: "Hội Trường Lớn A5 (Tầng 2)",
    address: "268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh",
    mapQuery: "268 Lý Thường Kiệt, Phường 14, Quận 10, TP Hồ Chí Minh",
    dressCode: "Tone-sur-tone: Trắng, Pastel, Denim hoặc Outfit Cháy Phố ✨",
    timeline: [
      { time: "07:30", title: "Check-in & Chụp ảnh sống ảo", desc: "Nhận hoa, bắt đền thanh xuân và chụp ảnh cháy máy cùng tân cử nhân." },
      { time: "08:30", title: "Khai mạc Lễ Trao Bằng", desc: "Nghi thức vinh danh chính thức, lắng nghe diễn văn và nhận bằng." },
      { time: "09:30", title: "Khoảnh khắc Lên Bục Vinh Danh", desc: "Thời khắc nhận bằng cử nhân và bắt tay thầy Hiệu trưởng." },
      { time: "11:00", title: "Ném mũ tốt nghiệp & After Party", desc: "Ném mũ cử nhân tại sân trường & tụ tập ăn mừng xả láng." },
    ]
  },
  theme: {
    id: "genz-holographic",
    name: "Y2K Holo Dream",
    mode: "dark", // 'dark' | 'light'
    badge: "✨ Y2K Holo Dream (Trending Gen Z)",
    background: "from-slate-950 via-purple-950 to-pink-950",
    cardBg: "bg-slate-900/90 text-purple-100 border-pink-500/40 shadow-2xl",
    accentColor: "#ec4899",
    secondaryColor: "#a855f7",
    borderClass: "border-pink-500/40 ring-1 ring-purple-500/30",
    textHeading: "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 font-genz font-black",
    badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    primaryButton: "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:brightness-125 text-white font-extrabold shadow-lg shadow-pink-500/25",
    envelopeColor: "#1e1135",
    sealColor: "#ec4899",
    styleType: "genz-holo"
  },
  guests: [
    {
      id: "guest-3",
      inviteCode: "INV-HOIBAN-9A21",
      name: "Hội Bạn Thân 'Dev Bất Ổn'",
      salutation: "Hú le anh em",
      gender: "unisex",
      persona: "funny",
      themeId: "genz-holographic",
      relationship: "Bạn bè chí cốt",
      customNote: "Nhất định phải có mặt đủ quân số nhé, mang hoa to vào và chuẩn bị tinh thần chụp ảnh cháy máy! 🔥",
      rsvpStatus: "confirmed",
      guestCount: 4,
      phone: "0987654321",
      email: "teamquang@gmail.com"
    },
    {
      id: "guest-female-1",
      inviteCode: "INV-MAILINH-4B7C",
      name: "Mai Linh & Thảo Nhi",
      salutation: "Thân gửi 2 bạn yêu",
      gender: "female",
      persona: "gentle",
      themeId: "genz-pastel-pink",
      relationship: "Bạn thân",
      customNote: "Nhớ mặc outfit pastel thật xinh đến chụp hình cùng tui nha! 🌸",
      rsvpStatus: "confirmed",
      guestCount: 2,
      phone: "0933112233",
      email: "mailinh.thaonhi@gmail.com"
    },
    {
      id: "guest-male-1",
      inviteCode: "INV-TUANANH-8E3F",
      name: "Tuấn Anh (Bro cạ cứng)",
      salutation: "Bro ơi",
      gender: "male",
      persona: "energetic",
      themeId: "genz-ocean-blue",
      relationship: "Bạn bè",
      customNote: "Đến đúng giờ ném mũ với làm vài pô ảnh cool ngầu nhé ông bạn! 🌊",
      rsvpStatus: "confirmed",
      guestCount: 1,
      phone: "0918273645",
      email: "tuananh.dev@gmail.com"
    },
    {
      id: "guest-1",
      inviteCode: "INV-CHUBAY-2D1A",
      name: "Gia Đình Chú Bảy",
      salutation: "Kính gửi",
      gender: "unisex",
      persona: "formal",
      themeId: "royal-gold",
      relationship: "Gia đình",
      customNote: "Cháu rất mong được đón tiếp Chú Bảy và đại gia đình đến chung vui ngày cháu nhận bằng cử nhân!",
      rsvpStatus: "confirmed",
      guestCount: 3,
      phone: "0901234567",
      email: "chubay.family@gmail.com"
    },
    {
      id: "guest-2",
      inviteCode: "INV-THAYQUAN-5F4B",
      name: "Thầy GS.TS Lê Hải Quân",
      salutation: "Kính mời",
      gender: "male",
      persona: "formal",
      themeId: "royal-gold",
      relationship: "Thầy cô",
      customNote: "Em xin chân thành cảm ơn Thầy đã dìu dắt và định hướng cho em trong suốt thời gian học tập & làm đồ án tốt nghiệp.",
      rsvpStatus: "confirmed",
      guestCount: 1,
      phone: "0912345678",
      email: "quan.lehai@university.edu.vn"
    },
    {
      id: "guest-4",
      inviteCode: "INV-HOANG-7C8D",
      name: "Anh Hoàng (Team Leader)",
      salutation: "Kính mời",
      gender: "male",
      persona: "formal",
      themeId: "genz-ocean-blue",
      relationship: "Đồng nghiệp",
      customNote: "Cảm ơn anh và team đã tạo điều kiện tối đa cho em hoàn thành kỳ bảo vệ tốt nghiệp vừa qua!",
      rsvpStatus: "declined",
      guestCount: 0,
      phone: "0977889900",
      email: "hoang.lead@company.vn"
    }
  ],
  wishes: [
    {
      id: "wish-1",
      guestName: "Trần Mai Anh",
      relationship: "Bạn cùng khóa",
      message: "Chúc mừng tân thủ khoa! 4 năm nỗ lực không ngừng nghỉ cuối cùng đã hái quả ngọt. Tự hào về cậu lắm!",
      time: "10 phút trước",
      emoji: "🎓",
    },
    {
      id: "wish-2",
      guestName: "Chú Bảy & Cô Út",
      relationship: "Gia đình",
      message: "Cả nhà tự hào về cháu rất nhiều. Chúc cháu vững bước trên con đường tương lai và luôn thành công!",
      time: "1 giờ trước",
      emoji: "💐",
    },
    {
      id: "wish-3",
      guestName: "Lâm Nhật Huy",
      relationship: "Đồng nghiệp",
      message: "Chào đón chính thức gia nhập hội Full-time Developer! Chúc bạn sự nghiệp rực rỡ và sớm thăng tiến!",
      time: "3 giờ trước",
      emoji: "🥂",
    }
  ],
  gallery: [
    {
      id: "pic-1",
      title: "Chân dung tốt nghiệp",
      url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "pic-2",
      title: "Khoảnh khắc ném mũ cử nhân",
      url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "pic-3",
      title: "Kỷ yếu cùng bạn bè đại học",
      url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "pic-4",
      title: "Bảo vệ khóa luận tốt nghiệp",
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop"
    }
  ]
};

export const THEMES = [
  {
    id: "genz-ocean-blue",
    name: "🌊 Ocean Sky Blue",
    badge: "Nam tính • Tươi sáng & Năng động",
    personaTag: "Phù hợp: Bạn nam / Đồng nghiệp trẻ",
    background: "from-sky-950 via-slate-900 to-blue-950",
    cardBg: "bg-slate-900/90 text-sky-100 border-sky-400/40 shadow-2xl backdrop-blur-2xl",
    accentColor: "#38bdf8",
    borderClass: "border-sky-400/40 ring-1 ring-sky-400/30",
    textHeading: "text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 font-genz font-black",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold",
    primaryButton: "bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black shadow-lg shadow-sky-500/25",
    envelopeColor: "#082f49",
    sealColor: "#0284c7",
    styleType: "genz-ocean",
  },
  {
    id: "genz-pastel-pink",
    name: "🌸 Pastel Peach & Blossom",
    badge: "Nữ tính • Ngọt ngào & Thơ mộng",
    personaTag: "Phù hợp: Bạn nữ / Dịu dàng / Cute",
    background: "from-rose-950 via-purple-950 to-pink-950",
    cardBg: "bg-stone-900/90 text-rose-100 border-rose-400/40 shadow-2xl backdrop-blur-2xl",
    accentColor: "#f472b6",
    borderClass: "border-rose-400/40 ring-1 ring-rose-400/30",
    textHeading: "text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200 font-genz font-black",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-400/40 font-bold",
    primaryButton: "bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-500 hover:brightness-110 text-slate-950 font-black shadow-lg shadow-rose-500/25",
    envelopeColor: "#4c0519",
    sealColor: "#e11d48",
    styleType: "genz-pink",
  },
  {
    id: "genz-holographic",
    name: "✨ Y2K Holo Dream",
    badge: "Cá tính mạnh • Hội bạn quậy",
    personaTag: "Phù hợp: Cạ cứng / Cháy hết mình",
    background: "from-slate-950 via-purple-950 to-pink-950",
    cardBg: "bg-slate-900/90 text-purple-100 border-pink-500/40 shadow-2xl backdrop-blur-2xl",
    accentColor: "#ec4899",
    borderClass: "border-pink-500/40 ring-1 ring-purple-500/30",
    textHeading: "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 font-genz font-black",
    badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/40 font-bold",
    primaryButton: "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:brightness-125 text-white font-extrabold shadow-lg shadow-pink-500/25",
    envelopeColor: "#1e1135",
    sealColor: "#ec4899",
    styleType: "genz-holo",
  },
  {
    id: "genz-matcha",
    name: "🥑 Matcha & Cream",
    badge: "Cute & Aesthetic Pastel",
    background: "from-stone-900 via-emerald-950 to-teal-950",
    cardBg: "bg-stone-900/90 text-emerald-100 border-emerald-400/40 shadow-2xl backdrop-blur-2xl",
    accentColor: "#34d399",
    borderClass: "border-emerald-400/40 ring-1 ring-emerald-400/20",
    textHeading: "text-emerald-300 font-genz font-extrabold",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    primaryButton: "bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-bold shadow-md",
    envelopeColor: "#064e3b",
    sealColor: "#10b981",
    styleType: "genz-matcha",
  },
  {
    id: "genz-boarding-pass",
    name: "🎫 Boarding Pass 2026",
    badge: "Vé Chuyến Bay Tương Lai",
    background: "from-slate-950 via-zinc-950 to-blue-950",
    cardBg: "bg-zinc-900/95 text-slate-100 border-cyan-400/40 shadow-2xl",
    accentColor: "#22d3ee",
    borderClass: "border-cyan-400/40",
    textHeading: "text-cyan-300 font-tech font-black tracking-wider uppercase",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30 font-mono",
    primaryButton: "bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-slate-950 font-black shadow-lg",
    envelopeColor: "#082f49",
    sealColor: "#06b6d4",
    styleType: "genz-ticket",
  },
  {
    id: "genz-retro-film",
    name: "📸 Retro Polaroid Cam",
    badge: "Ảnh Film & Kỷ Niệm Gen Z",
    background: "from-stone-900 via-amber-950 to-stone-950",
    cardBg: "bg-amber-50/95 text-stone-900 border-amber-300 shadow-2xl",
    accentColor: "#d97706",
    borderClass: "border-amber-400/50",
    textHeading: "text-stone-900 font-editorial font-black",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 font-mono",
    primaryButton: "bg-stone-900 hover:bg-stone-800 text-white font-bold",
    envelopeColor: "#292524",
    sealColor: "#f59e0b",
    styleType: "genz-polaroid",
  },
  {
    id: "royal-gold",
    name: "🏛️ Royal Navy & Gold",
    badge: "Trang Trọng Dành Cho Thầy Cô & Gia Đình",
    background: "from-slate-950 via-blue-950 to-slate-900",
    cardBg: "bg-slate-900/90 text-amber-50 border-amber-500/30",
    accentColor: "#f5d061",
    borderClass: "border-amber-400/40",
    textHeading: "text-amber-300 font-serif-luxury",
    badgeClass: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    primaryButton: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold",
    envelopeColor: "#0f172a",
    sealColor: "#d97706",
    styleType: "classic-royal",
  }
];

export const DYNAMIC_COLOR_PRESETS = [
  {
    id: "preset-ocean-blue",
    name: "Xanh Bách Khoa",
    icon: "🌊",
    primary: "#0284c7",
    secondary: "#38bdf8",
    envelope: "#082f49",
    seal: "#0284c7",
    desc: "Năng động, tươi sáng, công nghệ"
  },
  {
    id: "preset-royal-gold",
    name: "Hoàng Gia Vàng Gold",
    icon: "🏛️",
    primary: "#f59e0b",
    secondary: "#eab308",
    envelope: "#1e293b",
    seal: "#d97706",
    desc: "Sang trọng, trang nghiêm, quý phái"
  },
  {
    id: "preset-peach-pink",
    name: "Hồng Pastel Gen Z",
    icon: "🌸",
    primary: "#ec4899",
    secondary: "#fb7185",
    envelope: "#4c0519",
    seal: "#e11d48",
    desc: "Dịu ngọt, đáng yêu, thơ mộng"
  },
  {
    id: "preset-emerald-matcha",
    name: "Xanh Matcha Trẻ Trung",
    icon: "🌿",
    primary: "#10b981",
    secondary: "#34d399",
    envelope: "#064e3b",
    seal: "#059669",
    desc: "Thanh xuân tươi mới, dịu mắt"
  },
  {
    id: "preset-cyber-purple",
    name: "Tím Neon Cyber Holo",
    icon: "🌌",
    primary: "#a855f7",
    secondary: "#06b6d4",
    envelope: "#1e1135",
    seal: "#9333ea",
    desc: "Cá tính mạnh, bứt phá giới hạn"
  },
  {
    id: "preset-ruby-red",
    name: "Đỏ Rực Rỡ Vinh Quang",
    icon: "🔴",
    primary: "#dc2626",
    secondary: "#f97316",
    envelope: "#450a0a",
    seal: "#b91c1c",
    desc: "Nhiệt huyết, thắng lợi, vinh danh"
  },
  {
    id: "preset-slate-minimal",
    name: "Tối Giản Đen Bạc",
    icon: "🖤",
    primary: "#475569",
    secondary: "#94a3b8",
    envelope: "#0f172a",
    seal: "#334155",
    desc: "Hiện đại, thanh lịch, tinh tế"
  }
];

/**
 * Tạo theme động tùy chỉnh từ bảng màu và chế độ Dark/Light
 */
export function createDynamicTheme({
  name = "Tùy Biến Cá Nhân",
  mode = "dark",
  primary = "#0284c7",
  secondary = "#38bdf8",
  envelope = "#082f49",
  seal = "#0284c7"
}) {
  const isLight = mode === 'light';

  return {
    id: "custom-dynamic",
    name: name || (isLight ? "Tùy Biến (Sáng)" : "Tùy Biến (Tối)"),
    mode,
    badge: isLight ? "☀️ Chế độ Sáng • Tùy biến màu" : "🌙 Chế độ Tối • Tùy biến màu",
    background: isLight
      ? "from-slate-50 via-sky-50/50 to-slate-100"
      : "from-slate-950 via-slate-900 to-slate-950",
    cardBg: isLight
      ? "bg-white/95 text-slate-800 border-slate-200 shadow-xl shadow-sky-500/5 backdrop-blur-xl"
      : "bg-slate-900/90 text-slate-100 border-white/10 shadow-2xl backdrop-blur-xl",
    accentColor: primary,
    secondaryColor: secondary,
    borderClass: isLight ? "border-slate-200" : "border-white/10",
    textHeading: isLight
      ? "text-slate-900 font-genz font-black"
      : "text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-white font-genz font-black",
    badgeClass: isLight
      ? "bg-sky-50 text-sky-700 border-sky-200 font-bold"
      : "bg-white/10 text-sky-300 border-white/15 font-bold",
    primaryButton: "text-white font-black shadow-lg",
    envelopeColor: envelope,
    sealColor: seal,
    styleType: "custom-dynamic",
    isCustom: true
  };
}

