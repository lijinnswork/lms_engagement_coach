import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings as SettingsIcon, 
  Plus, 
  RotateCcw, 
  Save, 
  Eye, 
  Check, 
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  Compass,
  AlertCircle
} from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';
import { useAuthStore } from '../../stores/authStore';

interface NudgeRangeConfig {
  id: string;
  range_name: string;
  from_pct: number;
  to_pct: number;
  tone: string;
  is_enabled: boolean;
  message_template: string | null;
  stuck_trigger_days: number;
  max_repeats: number;
  display_order: number;
}

interface NudgeGlobalSettings {
  id: number;
  inactivity_threshold_days: number;
  goal_behind_threshold_pct: number;
  max_active_nudges: number;
  nudge_expiry_days: number;
  email_nudges_enabled: boolean;
  respect_student_email_setting: boolean;
}

interface NudgeAnalytics {
  total_nudges_sent: number;
  open_rate: number;
  dismiss_rate: number;
  remind_later_rate: number;
  by_type: Record<string, number>;
  by_range: Array<{
    range_config_id: string;
    range_name: string;
    sent_count: number;
    open_rate: number;
  }>;
}

export const NudgeSettings: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  // State
  const [ranges, setRanges] = useState<NudgeRangeConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<NudgeGlobalSettings | null>(null);
  const [analytics, setAnalytics] = useState<NudgeAnalytics | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<NudgeRangeConfig | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Editor Form Fields
  const [rangeName, setRangeName] = useState('');
  const [fromPct, setFromPct] = useState(0);
  const [toPct, setToPct] = useState(10);
  const [tone, setTone] = useState('motivational');
  const [isEnabled, setIsEnabled] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [stuckTriggerDays, setStuckTriggerDays] = useState(7);
  const [maxRepeats, setMaxRepeats] = useState(3);
  const [displayOrder, setDisplayOrder] = useState(1);

  // Load Ranges, Settings, and Analytics
  const loadData = async () => {
    try {
      setLoading(true);
      const rangesRes = await fetchWithAuth('/api/nudges/admin/ranges');
      if (rangesRes.ok) {
        const data = await rangesRes.json();
        setRanges(data);
      }

      const settingsRes = await fetchWithAuth('/api/nudges/admin/settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setGlobalSettings(data);
      }

      const analyticsRes = await fetchWithAuth(`/api/nudges/admin/analytics?period=${period}`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Failed to load nudge admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  // Handle Enable/Disable Toggle inline
  const handleToggleEnable = async (range: NudgeRangeConfig) => {
    try {
      const res = await fetchWithAuth(`/api/nudges/admin/ranges/${range.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !range.is_enabled }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRanges((prev) => prev.map((r) => (r.id === range.id ? updated : r)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Range Editor
  const handleOpenEditor = (range: NudgeRangeConfig | null) => {
    setSelectedRange(range);
    setPreviewText(null);
    if (range) {
      setRangeName(range.range_name);
      setFromPct(range.from_pct);
      setToPct(range.to_pct);
      setTone(range.tone);
      setIsEnabled(range.is_enabled);
      setMessageTemplate(range.message_template || '');
      setStuckTriggerDays(range.stuck_trigger_days);
      setMaxRepeats(range.max_repeats);
      setDisplayOrder(range.display_order);
    } else {
      setRangeName('');
      setFromPct(0);
      setToPct(10);
      setTone('motivational');
      setIsEnabled(true);
      setMessageTemplate('');
      setStuckTriggerDays(7);
      setMaxRepeats(3);
      setDisplayOrder(ranges.length + 1);
    }
    setIsEditorOpen(true);
  };

  // Save Range Config (Create / Update)
  const handleSaveRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      range_name: rangeName,
      from_pct: Number(fromPct),
      to_pct: Number(toPct),
      tone,
      is_enabled: isEnabled,
      message_template: messageTemplate || null,
      stuck_trigger_days: Number(stuckTriggerDays),
      max_repeats: Number(maxRepeats),
      display_order: Number(displayOrder),
    };

    try {
      let res;
      if (selectedRange) {
        // Update
        res = await fetchWithAuth(`/api/nudges/admin/ranges/${selectedRange.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetchWithAuth('/api/nudges/admin/ranges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsEditorOpen(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to save range configuration.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Custom Range
  const handleDeleteRange = async (rangeId: string) => {
    if (!confirm('Are you sure you want to delete this range configuration?')) return;
    try {
      const res = await fetchWithAuth(`/api/nudges/admin/ranges/${rangeId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsEditorOpen(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to delete range.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Ranges to Defaults
  const handleResetDefaults = async () => {
    if (!confirm('Warning: This will clear all custom configurations and reset to the 7 defaults. Proceed?')) return;
    try {
      const res = await fetchWithAuth('/api/nudges/admin/ranges/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Global Settings
  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSettings) return;
    try {
      const res = await fetchWithAuth('/api/nudges/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings),
      });
      if (res.ok) {
        alert('Global Nudge Settings saved successfully!');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Preview Nudge message via Gemini API
  const handlePreviewNudge = async () => {
    setPreviewLoading(true);
    setPreviewText(null);
    try {
      const res = await fetchWithAuth('/api/nudges/admin/ranges/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_name: 'Introduction to Python',
          progress_pct: Math.floor((fromPct + toPct) / 2),
          range_name: rangeName,
          from_pct: Number(fromPct),
          to_pct: Number(toPct),
          tone,
          message_template: messageTemplate || null,
          nudge_type: 'range_entry',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewText(data.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-4 text-left select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C2128] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white font-serif flex items-center gap-2">
            <Bell size={24} className="text-[#E8A87C]" />
            Nudge Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">Configure automated course range, inactivity, and pace-stuck nudge alerts.</p>
        </div>
        
        {isSuperAdmin && (
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
        )}
      </div>

      {/* Analytics Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-white font-serif">Nudge Analytics</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-2.5 py-1 text-xs outline-none focus:border-[#7B9EA8] cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-400 mb-1 font-medium">Total Sent</div>
            <div className="text-2xl font-mono text-white tracking-tight">{analytics?.total_nudges_sent ?? 0}</div>
          </div>
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-4 shadow-sm border-l-3 border-l-[#7B9EA8]">
            <div className="text-xs text-gray-400 mb-1 font-medium">Open Rate</div>
            <div className="text-2xl font-mono text-[#7B9EA8] tracking-tight">{analytics?.open_rate ?? 0.0}%</div>
          </div>
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-4 shadow-sm border-l-3 border-l-[#E8A87C]">
            <div className="text-xs text-gray-400 mb-1 font-medium">Dismiss Rate</div>
            <div className="text-2xl font-mono text-[#E8A87C] tracking-tight">{analytics?.dismiss_rate ?? 0.0}%</div>
          </div>
          <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-4 shadow-sm border-l-3 border-l-[#8B949E]">
            <div className="text-xs text-gray-400 mb-1 font-medium">Remind Later Rate</div>
            <div className="text-2xl font-mono text-gray-400 tracking-tight">{analytics?.remind_later_rate ?? 0.0}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main: Range Config */}
        <div className="lg:col-span-2 bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#3A3F4D] pb-3">
            <h2 className="text-md font-medium text-white font-serif">Progress Range Configurations</h2>
            <button
              onClick={() => handleOpenEditor(null)}
              className="flex items-center gap-1 bg-[#7B9EA8] hover:bg-[#7B9EA8]/90 text-white rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer"
            >
              <Plus size={14} />
              Add Range
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-[#3A3F4D]">
                <tr>
                  <th className="py-3 px-2">Display Order</th>
                  <th className="py-3 px-2">Range Name</th>
                  <th className="py-3 px-2">Span (%)</th>
                  <th className="py-3 px-2">Tone</th>
                  <th className="py-3 px-2 text-center">Enabled</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2128]">
                {ranges.map((r) => (
                  <tr 
                    key={r.id}
                    className="hover:bg-[#1C2128]/50 transition-colors"
                  >
                    <td className="py-3 px-2 font-mono">{r.display_order}</td>
                    <td className="py-3 px-2 font-medium text-white">{r.range_name}</td>
                    <td className="py-3 px-2 font-mono text-xs">{r.from_pct}% – {r.to_pct}%</td>
                    <td className="py-3 px-2 capitalize">{r.tone.replace('-', ' ')}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleToggleEnable(r)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                          r.is_enabled ? 'bg-[#7B9EA8]' : 'bg-[#1C2128] border border-[#3A3F4D]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            r.is_enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleOpenEditor(r)}
                        className="text-[#7B9EA8] hover:text-[#7B9EA8]/80 text-xs font-semibold flex items-center gap-0.5 justify-end ml-auto cursor-pointer"
                      >
                        Edit
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Global Nudge Settings */}
        <div className="bg-[#242834] border border-[#3A3F4D] rounded-xl p-5 shadow-sm flex flex-col h-fit">
          <h2 className="text-md font-medium text-white font-serif border-b border-[#3A3F4D] pb-3 flex items-center gap-1.5">
            <SettingsIcon size={16} className="text-gray-400" />
            Global Nudge Settings
          </h2>

          {globalSettings && (
            <form onSubmit={handleSaveGlobalSettings} className="space-y-4 pt-4 text-xs font-sans text-gray-300">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inactivity Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={globalSettings.inactivity_threshold_days}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, inactivity_threshold_days: Number(e.target.value) })}
                    className="w-20 bg-[#1C2128] border border-[#3A3F4D] text-white rounded px-2 py-1 outline-none text-right font-mono"
                  />
                  <span>days of no logins/clicks</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Goal Pace Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={globalSettings.goal_behind_threshold_pct}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, goal_behind_threshold_pct: Number(e.target.value) })}
                    className="w-20 bg-[#1C2128] border border-[#3A3F4D] text-white rounded px-2 py-1 outline-none text-right font-mono"
                  />
                  <span>% behind pace boundary</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Max Active Nudges</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={globalSettings.max_active_nudges}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, max_active_nudges: Number(e.target.value) })}
                    className="w-20 bg-[#1C2128] border border-[#3A3F4D] text-white rounded px-2 py-1 outline-none text-right font-mono"
                  />
                  <span>pending cards limit</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Expiry duration</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={globalSettings.nudge_expiry_days}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, nudge_expiry_days: Number(e.target.value) })}
                    className="w-20 bg-[#1C2128] border border-[#3A3F4D] text-white rounded px-2 py-1 outline-none text-right font-mono"
                  />
                  <span>days until auto-expired</span>
                </div>
              </div>

              <div className="h-px bg-[#1C2128] my-4" />

              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="font-medium text-white text-[13px]">Email Nudges</span>
                  <span className="text-[11px] text-gray-500">Deliver nudges via SMTP email</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGlobalSettings({ ...globalSettings, email_nudges_enabled: !globalSettings.email_nudges_enabled })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                    globalSettings.email_nudges_enabled ? 'bg-[#7B9EA8]' : 'bg-[#1C2128] border border-[#3A3F4D]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      globalSettings.email_nudges_enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="font-medium text-white text-[13px]">Respect user setting</span>
                  <span className="text-[11px] text-gray-500">Skip if user disabled email alerts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGlobalSettings({ ...globalSettings, respect_student_email_setting: !globalSettings.respect_student_email_setting })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                    globalSettings.respect_student_email_setting ? 'bg-[#7B9EA8]' : 'bg-[#1C2128] border border-[#3A3F4D]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      globalSettings.respect_student_email_setting ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-[#3A3F4D]">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-[#7B9EA8] hover:bg-[#7B9EA8]/90 text-white rounded-lg py-2 font-semibold text-sm transition-colors cursor-pointer"
                >
                  <Save size={16} />
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Range Editor Overlay */}
      {isEditorOpen && (
        <>
          <div
            onClick={() => setIsEditorOpen(false)}
            className="fixed inset-0 bg-black/60 z-[250] backdrop-blur-sm"
          />
          <div className="fixed top-0 right-0 w-[420px] max-w-[90vw] h-screen bg-[#242834] z-[300] border-l border-[#3A3F4D] shadow-2xl flex flex-col overflow-hidden text-gray-300">
            <div className="h-[60px] border-b border-[#3A3F4D] flex items-center justify-between px-6 bg-[#1C2128] shrink-0">
              <h2 className="text-md font-bold font-sans text-white uppercase tracking-wider">
                {selectedRange ? 'Edit Range Config' : 'Create Range Config'}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRange} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Range Name</label>
                <input
                  type="text"
                  required
                  value={rangeName}
                  onChange={(e) => setRangeName(e.target.value)}
                  className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8]"
                  placeholder="e.g. Just Started"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">From Progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={fromPct}
                    onChange={(e) => setFromPct(Number(e.target.value))}
                    className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">To Progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={toPct}
                    onChange={(e) => setToPct(Number(e.target.value))}
                    className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Primary Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] cursor-pointer capitalize"
                >
                  <option value="motivational">Motivational</option>
                  <option value="celebratory">Celebratory</option>
                  <option value="momentum-building">Momentum Building</option>
                  <option value="gentle">Gentle</option>
                  <option value="final push">Final Push</option>
                  <option value="celebration">Celebration</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-[13px]">Enabled</span>
                  <span className="text-[11px] text-gray-500">Enable this range watcher checks</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                    isEnabled ? 'bg-[#7B9EA8]' : 'bg-[#1C2128] border border-[#3A3F4D]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message Template</label>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] resize-none h-24 font-sans leading-normal"
                  placeholder="Leave blank to let AI generate automatically. Use {course_name} and {progress} as placeholders."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stuck Trigger (days)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={stuckTriggerDays}
                    onChange={(e) => setStuckTriggerDays(Number(e.target.value))}
                    className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Max Repeats</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={maxRepeats}
                    onChange={(e) => setMaxRepeats(Number(e.target.value))}
                    className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Display Order</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="bg-[#1C2128] border border-[#3A3F4D] text-white rounded-md px-3 py-2 text-sm outline-none focus:border-[#7B9EA8] font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#3A3F4D] flex flex-col gap-3 shrink-0">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#7B9EA8] hover:bg-[#7B9EA8]/90 text-white rounded-lg py-2 font-semibold text-sm cursor-pointer"
                  >
                    <Save size={16} />
                    Save Range
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewNudge}
                    disabled={previewLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-black/10 hover:bg-black/20 text-[#7B9EA8] border border-[#7B9EA8]/30 rounded-lg py-2 font-semibold text-sm cursor-pointer disabled:opacity-50"
                  >
                    <Eye size={16} />
                    {previewLoading ? 'Generating...' : 'Preview Nudge'}
                  </button>
                </div>

                {selectedRange && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRange(selectedRange.id)}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg py-2 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Delete Range Configuration
                  </button>
                )}
              </div>

              {/* Preview Box */}
              {previewText && (
                <div className="bg-[#1C2128] border border-l-3 border-[#E8A87C] border-[#3A3F4D] p-4 rounded-xl flex flex-col gap-2 relative">
                  <span className="text-[10px] font-bold font-sans text-gray-500 uppercase tracking-wider select-none">AI Nudge Preview Mock</span>
                  <div className="text-[9px] font-bold font-sans px-1.5 py-0.5 rounded-full text-white bg-[#7B9EA8] w-fit">
                    📈 Progress
                  </div>
                  <p className="text-[13px] font-sans text-gray-200 leading-normal italic">
                    "{previewText}"
                  </p>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
};
