import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  X,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  Send,
  Smartphone,
  Sparkles,
  Mail,
  Settings,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { sendInvitationEmail, verifySmtpConnection } from '../services/api';
import { getGuestInvitationUrl } from '../utils/inviteHelper';

export default function ShareModal({
  isOpen,
  onClose,
  guest,
  graduate,
  ceremony
}) {
  const [activeTab, setActiveTab] = useState('social'); // 'social' | 'email'

  // Social & QR State
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Email State
  const [targetEmail, setTargetEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null); // { success: boolean, message: string }

  // SMTP Aliyun Configuration State
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.qiye.aliyun.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [isVerifyingSmtp, setIsVerifyingSmtp] = useState(false);
  const [smtpVerifyResult, setSmtpVerifyResult] = useState(null);

  const guestName = guest?.name || 'Quý Khách';
  const salutation = guest?.salutation || 'Trân trọng kính mời';
  const guestUrl = getGuestInvitationUrl(guest);

  // Formatted invitation message for Social
  const hostDisplayName = graduate?.fullName || 'Nguyễn Đình Tuấn';
  const invitationMessage = `THƯ MỜI LỄ TỐT NGHIỆP CỬ NHÂN\n\n${salutation} ${guestName},\n\n${hostDisplayName} trân trọng kính mời bạn/gia đình đến tham dự buổi Lễ Trao Bằng Tốt Nghiệp Cử Nhân:\n\nThời gian: ${ceremony.time}${ceremony.endExpected ? ` – ${ceremony.endExpected}` : ''}, ngày ${ceremony.date}\nĐịa điểm: ${ceremony.venueName} (${ceremony.address})\n\nXem thiệp mời cá nhân hóa, bản đồ chỉ đường và xác nhận tham dự tại:\n${guestUrl}\n\nRất mong được đón tiếp bạn trong ngày vui này.`;

  // Initialize QR & Email target when modal opens
  useEffect(() => {
    if (isOpen && guest) {
      setTargetEmail(guest.email || '');
      setEmailSubject(`Thư Mời Lễ Tốt Nghiệp Cử Nhân - ${graduate?.fullName || 'Nguyễn Đình Tuấn'}`);
      setEmailResult(null);

      // Chỉ tải host/port/user (KHÔNG lưu hoặc đọc mật khẩu SMTP từ localStorage)
      try {
        const saved = localStorage.getItem('grad_aliyun_smtp');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.user) setSmtpUser(parsed.user);
          if (parsed.host) setSmtpHost(parsed.host);
          if (parsed.port) setSmtpPort(parsed.port);
          // Dọn sạch trường pass cũ nếu từng lưu trước đây
          if (parsed.pass) {
            const { pass: _removed, ...safeConfig } = parsed;
            localStorage.setItem('grad_aliyun_smtp', JSON.stringify(safeConfig));
          }
        }
      } catch (err) {
        console.warn('Failed to parse saved SMTP settings:', err);
      }

      // Generate QR Code
      QRCode.toDataURL(guestUrl, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#0284c7',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, guest, guestUrl, graduate]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(invitationMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Thiệp Mời Tốt Nghiệp - ${graduate.fullName}`,
          text: `${salutation} ${guestName} đến tham dự Lễ Tốt Nghiệp cử nhân của ${graduate.fullName}!`,
          url: guestUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  // Test Aliyun SMTP Connection
  const handleVerifySmtp = async () => {
    if (!smtpUser || !smtpPass) {
      alert('Vui lòng nhập đầy đủ Email Aliyun và Mật khẩu!');
      return;
    }
    setIsVerifyingSmtp(true);
    setSmtpVerifyResult(null);

    const config = {
      host: smtpHost,
      port: Number(smtpPort),
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
    };

    const res = await verifySmtpConnection(config);
    setIsVerifyingSmtp(false);
    setSmtpVerifyResult(res);

    if (res.success) {
      // Chỉ lưu thông tin không nhạy cảm (host, port, user), KHÔNG lưu mật khẩu vào localStorage
      localStorage.setItem(
        'grad_aliyun_smtp',
        JSON.stringify({ host: config.host, port: config.port, user: config.user })
      );
    }
  };

  // Send Email via qiye.aliyun
  const handleSendEmail = async () => {
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('Vui lòng nhập địa chỉ email hợp lệ của người nhận!');
      return;
    }

    setIsSendingEmail(true);
    setEmailResult(null);

    const smtpConfig = (smtpUser && smtpPass) ? {
      host: smtpHost,
      port: Number(smtpPort),
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      fromName: `${graduate?.fullName || 'Nguyễn Đình Tuấn'} - Lễ Tốt Nghiệp 2026`
    } : null;

    // Chỉ lưu host/port/user (không lưu mật khẩu)
    if (smtpConfig) {
      localStorage.setItem(
        'grad_aliyun_smtp',
        JSON.stringify({ host: smtpConfig.host, port: smtpConfig.port, user: smtpConfig.user })
      );
    }

    const payload = {
      to: targetEmail.trim(),
      guestName,
      salutation,
      relationship: guest?.relationship || '',
      customNote: guest?.customNote || '',
      invitationUrl: guestUrl,
      graduate,
      ceremony,
      subject: emailSubject,
      smtpConfig
    };

    const res = await sendInvitationEmail(payload);
    setIsSendingEmail(false);
    setEmailResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-xl bg-white border border-sky-100 rounded-3xl shadow-2xl overflow-hidden my-auto space-y-4 transition-all">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-sky-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-genz leading-tight">
                Chia Sẻ Thiệp Mời: {guestName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Gửi qua Zalo, Messenger, mã QR hoặc gửi Email doanh nghiệp Aliyun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-sky-100/60 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-1">
          <div className="flex items-center p-1 bg-sky-50 rounded-2xl border border-sky-100 text-xs font-bold font-genz">
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Zalo, Mess & Mã QR</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              <Mail className="w-4 h-4 text-amber-300" />
              <span>Gửi Mail (qiye.aliyun)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black">
                ALIYUN
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 pb-6 pt-1 space-y-4">
          
          {/* TAB 1: SOCIAL & QR CODE */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* QR Code and Quick Share Pills */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                {qrDataUrl ? (
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-sky-100 shrink-0">
                    <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center border border-sky-100">
                    <QrCode className="w-8 h-8 text-sky-400 animate-pulse" />
                  </div>
                )}

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider bg-sky-100 px-2 py-0.5 rounded-full">
                    Mã QR Đích Danh
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khách dùng Zalo hoặc camera điện thoại quét mã này để mở ngay thiệp mời tương tác có xưng hô đích danh.
                  </p>
                  
                  <div className="pt-1">
                    <button
                      onClick={handleNativeShare}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer shadow-sm shadow-sky-500/20"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Gửi qua điện thoại (Native Share)
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Link Section */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Đường link web thiệp riêng:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={guestUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-800 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Đã chép!' : 'Chép link'}
                  </button>
                </div>
              </div>

              {/* Formatted Message for Zalo / Messenger */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Tin nhắn soạn sẵn gửi Zalo / Messenger:
                  </label>
                  <button
                    onClick={handleCopyMessage}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMessage ? 'Đã chép!' : 'Sao chép tin nhắn'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={invitationMessage}
                  className="w-full px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-700 text-xs leading-relaxed font-sans focus:outline-none resize-none"
                />
              </div>

              {/* Social Share Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://zalo.me/share?url=${encodeURIComponent(guestUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi qua Zalo
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(guestUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Gửi Facebook
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: ALIYUN ENTERPRISE EMAIL */}
          {activeTab === 'email' && (
            <div className="space-y-3.5">
              
              {/* Target Email Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Địa chỉ Email người nhận: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="ví dụ: khachmoi@gmail.com hoặc công ty..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-800 text-xs focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Email Subject Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiêu đề email:
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-800 text-xs focus:outline-none focus:border-sky-500 shadow-sm"
                />
              </div>

              {/* Collapsible Aliyun SMTP Settings */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-sky-800 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-sky-500" />
                    <span>Cấu hình Aliyun Enterprise Mail (smtp.qiye.aliyun.com)</span>
                    {smtpUser && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    )}
                  </div>
                  {showSmtpConfig ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-sky-600" />}
                </button>

                {showSmtpConfig && (
                  <div className="pt-2 space-y-2 border-t border-sky-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          Tài khoản Email Aliyun (User):
                        </label>
                        <input
                          type="email"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="contact@yourdomain.com"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          Mật khẩu hòm thư Aliyun:
                        </label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="Mật khẩu hoặc App Password"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          SMTP Host:
                        </label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                          Port (SSL: 465):
                        </label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleVerifySmtp}
                        disabled={isVerifyingSmtp}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingSmtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Kiểm tra kết nối SMTP
                          </>
                        )}
                      </button>

                      <span className="text-[11px] text-slate-400">
                        *Lưu tự động vào trình duyệt
                      </span>
                    </div>

                    {smtpVerifyResult && (
                      <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                        smtpVerifyResult.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {smtpVerifyResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{smtpVerifyResult.message || smtpVerifyResult.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Message */}
              {emailResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  emailResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {emailResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      {emailResult.success ? 'Đã gửi thành công!' : 'Gửi email không thành công'}
                    </div>
                    <div className="text-[11px] mt-0.5 opacity-90">
                      {emailResult.message || emailResult.error}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Send Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 hover:brightness-105 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 cursor-pointer disabled:opacity-50 transition-all font-genz"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi qua máy chủ Aliyun...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Thư Mời Cho {guestName}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
