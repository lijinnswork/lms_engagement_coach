import { useAuthStore } from '../../stores/authStore';
import { Camera } from 'lucide-react';

export const ProfileSummary = ({ onEdit }: { onEdit: () => void }) => {
  const { user } = useAuthStore();
  const fullName = user?.full_name || 'Guest User';
  const email = user?.email || '';
  const avatarUrl = user?.avatar_url || null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-[14px] p-3 mb-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div 
          onClick={onEdit} // In real app, could trigger file picker directly, or just open edit panel
          className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[#86b595] to-[#f4b69d] text-white flex items-center justify-center font-serif text-[16px] cursor-pointer relative group"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            getInitials(fullName)
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={16} className="text-white" />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex flex-col">
          <span className="text-[14px] font-medium text-text-primary dark:text-text-darkPri">{fullName}</span>
          <span className="text-[11px] text-text-secondary dark:text-text-darkSec mt-0.5">{email}</span>
        </div>
      </div>

      <button 
        onClick={onEdit}
        className="px-4 py-1.5 rounded-full border border-border-light dark:border-border-dark text-[12px] font-medium text-text-secondary dark:text-text-darkSec hover:bg-border-light/20 dark:hover:bg-border-dark/40 transition-colors"
      >
        Edit
      </button>
    </div>
  );
};
