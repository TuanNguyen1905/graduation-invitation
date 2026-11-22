import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate, targetTime = "08:00", accentColor = "#f5d061" }) {
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

      if (difference <= 0) {
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
    { label: 'Giây', value: timeLeft.seconds },
  ];

  return (
    <div className="w-full my-6 text-center">
      <div className="inline-flex items-center gap-2 mb-3 text-xs tracking-widest uppercase font-semibold text-amber-400">
        <Clock className="w-4 h-4 animate-spin-slow" />
        Đếm ngược đến giờ làm lễ
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-inner"
          >
            <span
              className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-luxury"
              style={{ color: accentColor }}
            >
              {String(item.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-medium uppercase tracking-wider mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

