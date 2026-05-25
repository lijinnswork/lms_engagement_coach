import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '../../stores/authStore';

interface RhythmData {
  weekly_pattern: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
    insight: string;
  };
  recent_14_days: Array<{
    date: string;
    weekday: string;
    active: boolean;
  }>;
  summary: {
    active_count: number;
    total_days: number;
    message: string;
  };
}

export const LearningRhythm: React.FC = () => {
  const [data, setData] = useState<RhythmData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Provide an empty/fallback state so it always renders beautifully
      const fallbackData: RhythmData = {
        weekly_pattern: {
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
          insight: "No activity data available — ready when you are"
        },
        recent_14_days: Array.from({ length: 14 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return {
            date: d.toISOString(),
            weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
            active: false
          };
        }),
        summary: {
          active_count: 0,
          total_days: 14,
          message: "No activity in the last 2 weeks — start anytime"
        }
      };

      try {
        const res = await fetchWithAuth('/api/dashboard/rhythm');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData(fallbackData);
        }
      } catch (e) {
        console.error("Failed to fetch learning rhythm data", e);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) return null; // Don't show skeleton to keep it lightweight, just pop in or stay hidden if err

  const weekKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const today = new Date();
  // Normalizing to local day for highlighting "Today"
  const todayWeekdayIndex = (today.getDay() + 6) % 7; // JS getDay: 0=Sun, 1=Mon. We want 0=Mon, 6=Sun

  // We have 14 days, from oldest to newest (index 0 is oldest, index 13 is today typically based on backend ordering if we reverse it... wait!
  // Backend returns: from index 0 (13 days ago) to index 13 (today), because the loop is `for i in range(13, -1, -1)`.
  // So the last item is today.

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard rounded-xl border border-border-light dark:border-border-dark p-5 w-full flex flex-col">
      <h2 className="text-[12px] uppercase tracking-wider text-text-secondary dark:text-text-darkSec font-bold mb-5">
        Your Learning Rhythm
      </h2>

      {/* Part 1: Weekly Pattern */}
      <div className="flex flex-col mb-4">
        <h3 className="text-[14px] font-sans text-text-primary dark:text-text-darkPri mb-4">Your typical active days</h3>
        
        <div className="flex justify-between items-end h-[60px] mb-2 px-1">
          {weekKeys.map((key, i) => {
            const val = data.weekly_pattern[key as keyof typeof data.weekly_pattern] as number;
            // Max is 4 (4 weeks)
            const percentage = val / 4;
            const h = Math.max(percentage * 60, 2); // At least 2px stub
            
            return (
              <div key={key} className="flex flex-col items-center gap-2">
                <div className="h-[60px] flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: h }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
                    className="w-[24px] sm:w-[32px] bg-accent-primary rounded-t-sm rounded-b-none"
                    style={{ 
                      backgroundColor: val === 0 ? 'var(--border-light)' : 'var(--accent-primary)',
                      opacity: val === 0 ? 0.5 : 1
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Baseline & Labels */}
        <div className="border-t border-border-light dark:border-border-dark flex justify-between px-1 pt-2">
          {weekKeys.map((key, i) => (
            <div 
              key={key} 
              className={`text-[12px] font-sans w-[24px] sm:w-[32px] text-center ${i === todayWeekdayIndex ? 'font-bold text-text-primary dark:text-text-darkPri' : 'text-text-secondary dark:text-text-darkSec'}`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
          ))}
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-[13px] font-sans text-text-secondary dark:text-text-darkSec mt-3"
        >
          {data.weekly_pattern.insight}
        </motion.p>
      </div>

      <div className="w-full border-t border-dashed border-border-light dark:border-border-dark my-4"></div>

      {/* Part 2: Recent Activity */}
      <div className="flex flex-col">
        <h3 className="text-[14px] font-sans text-text-primary dark:text-text-darkPri mb-4">Recent activity</h3>
        
        <div className="flex justify-between items-center w-full overflow-x-hidden">
          {data.recent_14_days.map((day, i) => {
            const isToday = i === data.recent_14_days.length - 1;
            const dateObj = new Date(day.date);
            const dayNum = dateObj.getDate();

            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5 min-w-[20px]">
                <div className={`text-[11px] font-mono ${isToday ? 'font-bold text-text-primary dark:text-text-darkPri' : 'text-text-secondary dark:text-text-darkSec'}`}>
                  {dayNum}
                </div>
                
                <div className={`relative flex items-center justify-center w-[16px] h-[16px]`}>
                  {isToday && (
                    <div className="absolute inset-0 rounded-full border-2 border-accent-warm opacity-40"></div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.2, ease: "easeOut" }}
                    className={`w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-full ${
                      day.active 
                        ? 'bg-accent-primary border-none' 
                        : 'bg-transparent border-2 border-border-light dark:border-border-dark'
                    }`}
                  />
                </div>
                
                <div className="text-[10px] font-sans text-text-secondary dark:text-text-darkSec mt-0.5">
                  {day.weekday.substring(0, 3)}
                </div>
              </div>
            );
          })}
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="text-[13px] font-sans text-text-secondary dark:text-text-darkSec mt-4"
        >
          {data.summary.message}
        </motion.p>
      </div>
    </div>
  );
};
