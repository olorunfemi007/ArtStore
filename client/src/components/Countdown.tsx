import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownProps {
  targetDate: Date;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft | null {
  const difference = targetDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return null;
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs md:text-sm tracking-widest text-muted-foreground mt-2">
        {label}
      </div>
    </div>
  );
}

export function Countdown({ targetDate, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);
      
      if (!newTimeLeft && onComplete) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!timeLeft) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center gap-4 md:gap-8"
      data-testid="countdown-timer"
    >
      <TimeUnit value={timeLeft.days} label="DAYS" />
      <div className="text-display text-3xl md:text-5xl font-light text-muted-foreground">:</div>
      <TimeUnit value={timeLeft.hours} label="HOURS" />
      <div className="text-display text-3xl md:text-5xl font-light text-muted-foreground">:</div>
      <TimeUnit value={timeLeft.minutes} label="MINS" />
      <div className="text-display text-3xl md:text-5xl font-light text-muted-foreground">:</div>
      <TimeUnit value={timeLeft.seconds} label="SECS" />
    </motion.div>
  );
}

export function CountdownCompact({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <span>Live now</span>;
  }

  if (timeLeft.days > 0) {
    return (
      <span>
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    );
  }

  return (
    <span>
      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}
