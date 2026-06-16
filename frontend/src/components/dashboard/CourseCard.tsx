import { motion } from 'framer-motion';
import { Code, Grid, Monitor, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface Course {
  id: string;
  name: string;
  modulesComplete: number;
  modulesTotal: number;
  progress: number;
  color: string;
  iconType: string;
}

export const CourseCard = ({ course }: { course: Course }) => {
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const Icon = course.iconType === 'monitor' ? Monitor : course.iconType === 'grid' ? Grid : Code;
  
  const widthClass = breakpoint === 'mobile' ? 'w-[118px] min-w-[118px]' : 'w-[140px] min-w-[140px]';
  const nameSizeClass = breakpoint === 'mobile' ? 'text-[11px] font-medium' : 'text-[13px] font-medium';

  // Opacity 12% is ~1E in hex. But we can achieve it with an rgba wrapper or CSS variables.
  // Tailwind v3 doesn't natively support arbitrary color hex with opacity dynamically well without specific wrappers,
  // but we can just use style object.

  function hexToRgba(hex: string, opacity: number) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/course/${course.id}`)}
      className={`${widthClass} bg-bg-secondary dark:bg-bg-darkCard rounded-xl p-3 border border-border-light dark:border-border-dark shadow-sm flex flex-col shrink-0 cursor-pointer group hover:border-accent-primary hover:shadow-md transition-all relative overflow-hidden`}
    >
      <div 
        className="w-[28px] h-[28px] rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: hexToRgba(course.color, 0.12), color: course.color }}
      >
        <Icon size={14} />
      </div>
      
      <div className={`${nameSizeClass} font-sans text-text-primary dark:text-text-darkPri mb-1 line-clamp-2 leading-snug group-hover:text-accent-primary transition-colors pr-4`}>
        {course.name}
      </div>
      
      <div className="absolute right-3 top-[50px] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
        <ArrowRight size={14} className="text-accent-primary" />
      </div>
      
      <div className="text-[9px] font-sans text-text-secondary dark:text-text-darkSec mb-3">
        {course.modulesComplete} of {course.modulesTotal} components
      </div>
      
      <div className="w-full h-[3px] bg-border-light dark:bg-border-dark rounded-full mb-1 overflow-hidden">
        <div 
          className="h-full rounded-full" 
          style={{ width: `${course.progress}%`, backgroundColor: course.color }} 
        />
      </div>
      
      <div className="text-[9px] font-sans text-text-secondary dark:text-text-darkSec">
        {course.progress}%
      </div>
    </motion.div>
  );
};
