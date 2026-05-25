import { useState } from 'react';
import { useAuthStore, fetchWithAuth } from '../../../stores/authStore';
import { ArrowLeft, Key } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChangePasswordPanel = ({ onClose }: { onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = async () => {
    // API call to /api/account/password
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    try {
      const res = await fetchWithAuth('/api/account/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      if (res.ok) {
        alert("Password updated");
        onClose();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to update password");
      }
    } catch (e) {
      alert("Error updating password");
    }
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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Change Password</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary dark:text-text-darkSec ml-1">Current password</label>
            <input 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              className="w-full px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[14px] text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-sage transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary dark:text-text-darkSec ml-1">New password</label>
            <input 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              className="w-full px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[14px] text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-sage transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-secondary dark:text-text-darkSec ml-1">Confirm new password</label>
            <input 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
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
          Update Password
        </button>
      </div>
    </motion.div>
  );
};
