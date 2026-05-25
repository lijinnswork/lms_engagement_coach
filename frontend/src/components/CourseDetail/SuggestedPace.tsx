import React, { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '../../stores/authStore';

export const SuggestedPace = ({ courseId }: { courseId: string }) => {
  const [paceData, setPaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPace = async () => {
      try {
        const res = await fetchWithAuth(`/api/courses/${courseId}/pace`);
        if (res.ok) {
          const data = await res.json();
          setPaceData(data);
        }
      } catch (err) {
        console.error("Failed to fetch pace data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseId) {
      fetchPace();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
        <div className="h-5 bg-black/5 dark:bg-white/5 rounded w-1/4"></div>
        <div className="h-4 bg-black/5 dark:bg-white/5 rounded w-3/4"></div>
      </div>
    );
  }

  if (!paceData) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 text-text-primary dark:text-text-darkPri">
        <BarChart2 size={18} />
        <h2 className="font-serif text-[16px] font-medium">Suggested Pace</h2>
      </div>
      
      {paceData.predicted_completion_date ? (
        <div className="text-[14px] text-text-secondary">
          At your current pace, you'll finish this course by approximately <span className="font-mono font-bold text-text-primary dark:text-text-darkPri">{formatDate(paceData.predicted_completion_date)}</span>.
        </div>
      ) : (
        <div className="text-[14px] text-text-secondary">
          Start your first item to see your pace prediction!
        </div>
      )}

      {paceData.goal_date && (
        <div className="mt-2 pt-4 border-t border-border-light dark:border-border-dark flex flex-col gap-1">
          <div className="text-[14px] text-text-secondary">
            To finish by your goal date (<span className="font-mono font-bold text-text-primary dark:text-text-darkPri">{formatDate(paceData.goal_date)}</span>):
          </div>
          {paceData.on_track ? (
            <div className="text-[14px] font-medium text-accent-soft flex items-center gap-1.5">
              You're on track to meet your goal! ✓
            </div>
          ) : paceData.required_items_per_week ? (
            <div className="text-[14px] font-medium text-accent-warm">
              Complete ~{paceData.required_items_per_week} items per week to meet your goal.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
