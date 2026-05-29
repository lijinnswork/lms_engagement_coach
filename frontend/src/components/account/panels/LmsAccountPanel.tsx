import { useState, useEffect } from 'react';
import { useAuthStore, fetchWithAuth } from '../../../stores/authStore';
import { ArrowLeft, CheckCircle, RefreshCw, AlertCircle, Unlink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboardStore } from '../../../store/dashboardStore';

export const LmsAccountPanel = ({ onClose }: { onClose: () => void }) => {
  const { token, updateUser } = useAuthStore();
  const { fetchCourses, clearCourses } = useDashboardStore();
  const [status, setStatus] = useState<{ connected: boolean; username: string | null; last_synced: string | null }>({
    connected: false,
    username: null,
    last_synced: null
  });
  const [lmsUsername, setLmsUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/account/openedx/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch Open edX status", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lmsUsername.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetchWithAuth('/api/account/openedx/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lms_username: lmsUsername.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Connection failed');
      }

      const data = await res.json();
      setSuccess(data.message || 'Connected successfully!');
      
      // Update local storage user state via authStore
      updateUser({ lms_username: lmsUsername.trim(), openedx_user_id: lmsUsername.trim() });
      
      await fetchStatus();
      await fetchCourses(true); // Force refresh of global course cache
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Open edX.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetchWithAuth('/api/account/openedx/sync', {
        method: 'POST'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Sync failed');
      }

      setSuccess('Sync completed successfully!');
      await fetchStatus();
      await fetchCourses(true); // Force refresh of global course cache
    } catch (err: any) {
      setError(err.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Open edX account? This will clear your cached course progress.')) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetchWithAuth('/api/account/openedx/disconnect', {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Disconnection failed');
      }

      updateUser({ lms_username: undefined, openedx_user_id: undefined });
      setLmsUsername('');
      setStatus({ connected: false, username: null, last_synced: null });
      clearCourses(); // Clear courses from global cache
      setSuccess('Disconnected successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
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
        <h2 className="font-serif text-[16px] text-text-primary dark:text-text-darkPri">Open edX Connection</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <p className="text-sm text-text-secondary dark:text-text-darkSec">
          Connecting your Open edX account synchronizes your active courses and learning progress with your AI Coach in real time.
        </p>

        {error && (
          <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="text-green-500 text-sm flex items-center gap-2 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {status.connected ? (
          <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] text-text-secondary dark:text-text-darkSec">Connected Username</span>
                <p className="text-[16px] font-medium text-text-primary dark:text-text-darkPri font-mono">{status.username}</p>
              </div>
              <span className="bg-green-500/10 text-green-500 text-xs px-2.5 py-1 rounded-full border border-green-500/20 flex items-center gap-1 font-medium">
                Active
              </span>
            </div>

            <div className="border-t border-border-light dark:border-border-dark pt-3">
              <span className="text-[12px] text-text-secondary dark:text-text-darkSec">Last Synchronized</span>
              <p className="text-sm text-text-primary dark:text-text-darkPri">{formatDate(status.last_synced)}</p>
            </div>

            <div className="flex gap-3 mt-2 border-t border-border-light dark:border-border-dark pt-4">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 bg-accent-sage text-white font-medium py-2.5 rounded-xl hover:bg-accent-sage/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-4 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <Unlink size={16} />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-text-secondary dark:text-text-darkSec ml-1">
                Open edX Username or Email
              </label>
              <input
                value={lmsUsername}
                onChange={(e) => setLmsUsername(e.target.value)}
                placeholder="Enter your Open edX username/email"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-[12px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[14px] text-text-primary dark:text-text-darkPri focus:outline-none focus:border-accent-sage transition-colors disabled:opacity-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !lmsUsername.trim()}
              className="w-full bg-accent-sage text-white font-medium py-3 rounded-[12px] hover:bg-accent-sage/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Connecting & Syncing...</span>
                </>
              ) : (
                'Connect Account'
              )}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};
