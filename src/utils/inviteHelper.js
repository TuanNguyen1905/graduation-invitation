/**
 * Helper to generate unique invitation IDs and format invitation URLs
 */

// Chuyển tiếng Việt có dấu thành không dấu để làm mã ID đẹp
export function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

/**
 * Sinh mã ID duy nhất cho từng khách mời
 * Ví dụ: "Trần Tuấn Anh" -> "INV-TUANANH-7K2D"
 */
export function generateUniqueInviteCode(guestName = 'KHACH') {
  const cleanName = removeVietnameseTones(guestName)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'GUEST';

  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${cleanName}-${randomHex}`;
}

/**
 * Tạo đường link xem chi tiết thiệp mời dành riêng cho người được mời
 * Đảm bảo loại bỏ tiền tố /admin để link gửi đi luôn dẫn thẳng tới giao diện thiệp công khai
 */
export function getGuestInvitationUrl(guest) {
  const code = guest?.inviteCode || guest?.id || 'default';
  let path = window.location.pathname.replace(/\/admin\/?.*$/, '');
  if (!path.endsWith('/')) {
    path = path + '/';
  }
  return `${window.location.origin}${path}?invite=${encodeURIComponent(code)}`;
}

