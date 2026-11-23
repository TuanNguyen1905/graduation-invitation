import React, { useState, useEffect } from 'react';

export default function CountdownTimer({
  targetDate,
  targetTime = '08:00',
  accentColor = '#1e3a5f',
  isDarkMode = false,
  showLabel = false
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(`${targetDate}T${targetTime}:00`);
      const now = new Date();
      const difference = target - now;

      if (Number.isNaN(difference) || difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  const items = [
    { label: 'Ngày', value: timeLeft.days },
    { label: 'Giờ', value: timeLeft.hours },
    { label: 'Phút', value: timeLeft.minutes },
    { label: 'Giây', value: timeLeft.seconds }
  ];

  const dividerClass = isDarkMode ? 'divide-white/10 border-white/10' : 'divide-stone-200 border-stone-200';
  const labelClass = isDarkMode ? 'text-stone-400' : 'text-stone-500';
  const numClass = isDarkMode ? 'text-stone-100' : 'text-stone-900';

  if (timeLeft.isOver) {
    return (
      <div className={`py-3 text-center text-xs uppercase tracking-[0.2em] font-medium ${labelClass}`}>
        Buổi lễ đã chính thức diễn ra
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      {showLabel && (
        <p
          className="mb-4 text-[11px] uppercase tracking-[0.22em] font-semibold"
          style={{ color: accentColor }}
        >
          Đếm ngược đến ngày lễ
        </p>
      )}

      <div className={`grid grid-cols-4 divide-x border-y py-4 max-w-md mx-auto ${dividerClass}`}>
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center justify-center px-2">
            <span
              className={`text-2xl sm:text-3xl font-semibold tracking-tight font-editorial tabular-nums ${numClass}`}
            >
              {String(item.value).padStart(2, '0')}
            </span>
            <span className={`text-[10px] uppercase tracking-[0.18em] mt-1 font-medium ${labelClass}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
