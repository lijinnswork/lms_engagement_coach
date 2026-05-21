import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GentleButton } from '../components/Common/GentleButton';
import { SoftCard } from '../components/Common/SoftCard';

import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const checkEmail = email.toLowerCase();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: checkEmail,
          password: password
        })
      });

      if (!response.ok) {
        let errMsg = 'Login failed';
        try {
          const errorData = await response.json();
          errMsg = errorData.detail || errMsg;
        } catch (e) {
          errMsg = `Backend error (status: ${response.status}). The database or server might be initializing. Please wait a moment and try again.`;
        }
        throw new Error(errMsg);
      }

      const { access_token } = await response.json();

      // Fetch user profile details
      const profileRes = await fetch('/api/account/profile', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      if (!profileRes.ok) {
        throw new Error('Failed to retrieve user profile');
      }

      const dbUser = await profileRes.json();

      login(
        { 
          id: dbUser.id, 
          email: dbUser.email, 
          full_name: dbUser.full_name, 
          role: dbUser.role,
          avatar_url: dbUser.avatar_url,
          openedx_user_id: dbUser.openedx_user_id,
          lms_username: dbUser.lms_username
        },
        access_token
      );

      if (dbUser.role === 'super_admin' || dbUser.role === 'support_staff') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Wrong email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-[var(--accent-primary)] mb-2">Welcome back</h1>
          <p className="text-[var(--text-secondary)]">Let's pick up where you left off.</p>
        </div>
        
        <SoftCard>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Password</label>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl pl-4 pr-11 py-3 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <GentleButton 
              type="submit" 
              className="w-full mt-4 flex items-center justify-center gap-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </GentleButton>
          </form>
        </SoftCard>
        
        <div className="text-center mt-6">
          <GentleButton variant="text" onClick={() => navigate('/signup')}>
            Don't have an account? Sign up
          </GentleButton>
        </div>
      </div>
    </motion.div>
  );
};
