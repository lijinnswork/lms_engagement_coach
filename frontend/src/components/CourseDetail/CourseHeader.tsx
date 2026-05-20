import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseHeaderProps {
  courseName: string;
  courseId: string;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({ courseName, courseId }) => {
  const navigate = useNavigate();

  const handleOpenLms = () => {
    const LMS_URL = import.meta.env.VITE_LMS_URL || 'https://iimbx.site';
    window.open(`${LMS_URL}/courses/${courseId}/course/`, '_blank');
  };

  return (
    <div className="sticky top-0 z-20 w-full bg-bg-primary/95 dark:bg-bg-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark flex items-center justify-between h-[60px] px-4 md:px-6">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="hidden sm:inline font-medium text-[14px]">Back</span>
      </button>

      <h1 className="font-serif text-[18px] font-bold text-text-primary dark:text-text-darkPri truncate max-w-[50%]">
        {courseName}
      </h1>

      <button 
        onClick={handleOpenLms}
        className="flex items-center gap-2 border border-accent-primary text-accent-primary hover:bg-accent-primary/10 transition-colors px-3 py-1.5 rounded-lg text-[13px] font-medium"
      >
        <span className="hidden sm:inline">Open in LMS</span>
        <ExternalLink size={16} />
      </button>
    </div>
  );
};
