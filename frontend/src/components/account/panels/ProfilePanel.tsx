import { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { ArrowLeft, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfilePanel = ({ onClose }: { onClose: () => void }) => {
  const { user, updateUser } = useAuthStore();
  
  const [tempName, setTempName] = useState(user?.full_name || '');
  const [tempEmail, setTempEmail] = useState(user?.email || '');

  const handleSave = () => {
    updateUser({ full_name: tempName, email: tempEmail });
    // Note: if user changes email/password, usually requires API call.
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      variants={{
        hidden:  { x: '100%', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
        exit:    { x: '100%', opacity: 0, transition: { duration: 0.2 } }
      }}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 bg-bg-primary dark:bg-bg-dark z-50 flex flex-col pt-8 lg:pt-10"
    >
      <div className="flex items-center gap-3 px-4 pb-4 border-b border-border-light dark:border-border-dark shrink-0">
        <button onClick={onClose} className="text-text-secondary dark:text-text-darkSec hover:text-text-primary dark:hover:text-text-darkPri">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Edit profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col items-center pt-4">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-accent-sage/20 text-accent-sage flex items-center justify-center font-serif text-[24px] relative group cursor-pointer border-2 border-transparent hover:border-accent-sage transition-colors">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(tempName || 'User')
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <span className="text-[12px] text-text-secondary dark:text-text-darkSec mt-3">Tap to change photo</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary dark:text-text-darkSec ml-1">Full name</label>
            <input 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[14px] text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-sage transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary dark:text-text-darkSec ml-1">Email address</label>
            <input 
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[14px] text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-sage transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <button 
          onClick={handleSave}
          className="w-full bg-accent-sage text-white font-medium py-3 rounded-[12px] hover:bg-accent-sage/90 transition-colors"
        >
          Save changes
        </button>
      </div>
    </motion.div>
  );
};
