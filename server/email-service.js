import nodemailer from 'nodemailer';

/**
 * Default configuration for Alibaba Cloud Enterprise Mail (qiye.aliyun.com)
 * Standard SMTP Settings:
 * - Host: smtp.qiye.aliyun.com
 * - Port: 465 (SSL/TLS) or 587 (STARTTLS)
 * - Secure: true (for port 465)
 */
export function createAliyunTransporter(customConfig = {}) {
  const host = customConfig.host || process.env.ALIYUN_SMTP_HOST || 'smtp.qiye.aliyun.com';
  const port = Number(customConfig.port || process.env.ALIYUN_SMTP_PORT || 465);
  const secure = port === 465; // Port 465 uses SSL

  const user = customConfig.user || process.env.ALIYUN_MAIL_USER;
  const pass = customConfig.pass || process.env.ALIYUN_MAIL_PASS;

  if (!user || !pass) {
    throw new Error('Chưa cung cấp tài khoản (user) hoặc mật khẩu (pass) hòm thư qiye.aliyun');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Aliyun Enterprise Mail specific settings
    tls: {
      rejectUnauthorized: false, // Helps avoid local self-signed cert issues
    },
  });
}

/**
 * Generate responsive, modern Gen Z & Elegant HTML graduation invitation email
 */
export function generateGraduationEmailHtml({
  guestName = 'Quý Khách',
  salutation = 'Trân trọng kính mời',
  relationship = 'Khách quý',
  customNote = '',
  invitationUrl = '',
  graduate = {},
  ceremony = {},
}) {
  const graduateName = graduate.fullName || 'Nguyễn Đình Tuấn';
  const graduateTitle = graduate.degree || 'Cử Nhân Công Nghệ Thông Tin';
  const school = graduate.school || 'Đại Học Bách Khoa';
  const faculty = graduate.faculty || '';
  const venue = ceremony.venueName || 'Hội Trường A5';
  const address = ceremony.address || 'Khuôn viên trường';
  const date = ceremony.date || '2026-11-28';
  const time = ceremony.time || '07:30';
  const dressCode = ceremony.dressCode || 'Lịch sự / Tươi sáng';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thư Mời Lễ Tốt Nghiệp - ${graduateName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f7ff; padding: 24px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.08); border: 1px solid #e0f2fe;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e3a8a 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 12px;">🎓</div>
              <div style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: 800; color: #bae6fd; margin-bottom: 8px;">
                GRADUATION INVITATION 2026
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.3; color: #ffffff;">
                LỄ TỐT NGHIỆP CỬ NHÂN
              </h1>
              <div style="font-size: 15px; color: #e0f2fe; margin-top: 8px; font-weight: 600;">
                ${graduateName}
              </div>
              <div style="display: inline-block; margin-top: 10px; padding: 4px 14px; background: rgba(255, 255, 255, 0.18); border-radius: 999px; font-size: 12px; color: #f0f9ff; font-weight: 600;">
                ${graduateTitle} · ${school}
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px;">
              
              <!-- Salutation Card -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0284c7; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #0369a1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                  ${salutation}
                </div>
                <div style="font-size: 20px; font-weight: 800; color: #0c4a6e;">
                  ${guestName} ✨
                </div>
                ${relationship ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">(${relationship})</div>` : ''}
              </div>

              <!-- Main Invitation Message -->
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0; margin-bottom: 16px;">
                Sau chặng đường 4 năm đại học với biết bao nỗ lực và kỷ niệm đẹp, thời khắc nhận tấm bằng cử nhân đã chính thức đến. Sự đồng hành, ủng hộ và tình cảm của <strong>${guestName}</strong> luôn là niềm động viên vô cùng to lớn đối với mình.
              </p>

              ${customNote ? `
              <!-- Custom Personalized Note -->
              <div style="background: #fffbeb; border: 1px dashed #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">
                  💌 Lời nhắn gửi riêng đến bạn:
                </div>
                <div style="font-size: 14px; font-style: italic; color: #78350f; line-height: 1.5;">
                  "${customNote}"
                </div>
              </div>
              ` : ''}

              <!-- Ceremony Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="30" valign="top" style="font-size: 18px;">⏰</td>
                        <td>
                          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Thời gian cử hành</div>
                          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                            ${time} — Ngày ${date}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="30" valign="top" style="font-size: 18px;">📍</td>
                        <td>
                          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Địa điểm tổ chức</div>
                          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                            ${venue}
                          </div>
                          <div style="font-size: 13px; color: #475569; margin-top: 2px;">
                            ${address}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="30" valign="top" style="font-size: 18px;">👔</td>
                        <td>
                          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Trang phục gợi ý (Dress Code)</div>
                          <div style="font-size: 14px; font-weight: 700; color: #0284c7; margin-top: 2px;">
                            ${dressCode}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Big Primary CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 360px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 24px; border-radius: 999px; text-align: center; box-shadow: 0 8px 20px rgba(2, 132, 199, 0.35); letter-spacing: 0.5px;">
                      💌 MỞ THIỆP MỜI TƯƠNG TÁC
                    </a>
                  </td>
                </tr>
              </table>

              <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 0 0 24px 0;">
                (Bấm nút trên để mở hiệu ứng phong bì niêm phong sáp, nghe nhạc nền và gửi lời chúc mừng trực tiếp)
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 24px 0;">

              <!-- Footer Signature -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left">
                    <div style="font-size: 12px; color: #64748b;">Rất mong được đón tiếp bạn trong ngày vui!</div>
                    <div style="font-size: 16px; font-weight: 900; color: #0284c7; margin-top: 4px;">
                      ${graduateName}
                    </div>
                  </td>
                  <td align="right" valign="bottom">
                    <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">#Graduation2026</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              Email được gửi tự động từ hệ thống GradInvite qua máy chủ Aliyun Enterprise Mail (qiye.aliyun.com).
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

