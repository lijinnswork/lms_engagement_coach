import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithAuth } from '../../stores/authStore';

export const CoachTake = ({ courseId, data }: { courseId: string, data: any }) => {
  const [coachText, setCoachText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachTake = async () => {
      try {
        const res = await fetchWithAuth(`/api/courses/${courseId}/coach-take`);
        if (res.ok) {
          const json = await res.json();
          setCoachText(json.text);
        } else {
          setCoachText("Keep going — you're making progress! 💪");
        }
      } catch (err) {
        setCoachText("Keep going — you're making progress! 💪");
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchCoachTake();
    }
  }, [courseId]);

  return (
    <div className="bg-[#FAF7F2] dark:bg-[#2A2621] border border-[#E8E1D5] dark:border-[#3D3830] rounded-2xl p-6 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2 text-accent-peach dark:text-[#E8A88B]">
        <Sparkles size={16} />
        <span className="font-serif text-[15px] font-medium">Your Coach</span>
      </div>
      
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 pt-2"
          >
            <div className="h-4 bg-black/5 dark:bg-white/5 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-black/5 dark:bg-white/5 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-black/5 dark:bg-white/5 rounded animate-pulse w-4/6"></div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-serif italic text-[15px] leading-relaxed text-text-primary dark:text-text-darkPri pl-1"
          >
            "{coachText}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
