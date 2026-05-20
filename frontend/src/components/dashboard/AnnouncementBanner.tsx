import { useState, useEffect } from 'react';
import { Info, BookOpen, Clock, Award, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Announcement {
  id: string;
  text: string;
  type: 'info' | 'new_course' | 'deadline' | 'achievement' | 'update';
  action_url?: string;
  action_text?: string;
}



export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements/');
        if (!res.ok) throw new Error('Failed to fetch announcements');
        const data: Announcement[] = await res.json();
        
        // Filter out locally dismissed ones
        const active = data.filter(a => !localStorage.getItem(`dismissed_announcement_${a.id}`));
        setAnnouncements(active);
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const handleDismiss = (id: string) => {
    localStorage.setItem(`dismissed_announcement_${id}`, 'true');
    const newAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(newAnnouncements);
    if (currentIndex >= newAnnouncements.length) {
      setCurrentIndex(Math.max(0, newAnnouncements.length - 1));
    }
  };

  const current = announcements[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info size={16} className="text-white" />;
      case 'new_course': return <BookOpen size={16} className="text-white" />;
      case 'deadline': return <Clock size={16} className="text-white" />;
      case 'achievement': return <Award size={16} className="text-white" />;
      case 'update': return <RefreshCw size={16} className="text-white" />;
      default: return <Info size={16} className="text-white" />;
    }
  };

  return (
    <div className="w-full h-[40px] bg-gradient-to-r from-accent-sage to-[#8FB0B9] flex items-center px-4 relative z-30 flex-shrink-0">
      <div className="flex-1 flex justify-center items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            {getIcon(current.type)}
            <span className="text-white font-sans text-[14px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {current.text}
              {current.action_text && (
                <a href={current.action_url} className="ml-2 underline hover:text-white/80 transition-colors cursor-pointer">
                  {current.action_text}
                </a>
              )}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {announcements.length > 1 && (
          <div className="flex gap-1">
            {announcements.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
        <button 
          onClick={() => handleDismiss(current.id)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
