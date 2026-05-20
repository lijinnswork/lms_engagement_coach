import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GentleButton } from '../components/Common/GentleButton';
import { SoftCard } from '../components/Common/SoftCard';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Register user
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
          full_name: name
        })
      });

      if (!signupRes.ok) {
        const errorData = await signupRes.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      // 2. Automatically log in to get access token
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password
        })
      });

      if (!loginRes.ok) {
        throw new Error('Signup succeeded but auto-login failed. Please log in manually.');
      }

      const { access_token } = await loginRes.json();

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

      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Signup failed. Please try again.');
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
          <h1 className="text-3xl font-serif text-[var(--accent-primary)] mb-2">Create your account</h1>
          <p className="text-[var(--text-secondary)]">A supportive space for your learning journey.</p>
        </div>
        
        <SoftCard>
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">What should I call you?</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name is fine"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                required
              />
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
                  <span>Creating Account...</span>
                </>
              ) : (
                'Continue'
              )}
            </GentleButton>
          </form>
        </SoftCard>
        
        <div className="text-center mt-6">
          <GentleButton variant="text" onClick={() => navigate('/login')}>
            Already have an account? Sign in
          </GentleButton>
        </div>
      </div>
    </motion.div>
  );
};
