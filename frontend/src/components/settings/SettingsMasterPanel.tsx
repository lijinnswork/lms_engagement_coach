import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { settingsIndex } from '../../data/settingsIndex';
import { SettingsSearch } from './SettingsSearch';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';

// Icons
import {
  User, Image as ImageIcon, Mail, Key, MessageCircle, Target, BellOff,
  Moon, Bell, Hash, Clock, Award, DownloadCloud, Trash2, RefreshCw,
  LayoutTemplate, Type, Maximize, Link as LinkIcon, LogOut, XOctagon, Settings
} from 'lucide-react';

// Panels
import { CoachFrequencyPanel } from './panels/CoachFrequencyPanel';
import { CoachTonePanel } from './panels/CoachTonePanel';
import { QuietHoursPanel } from './panels/QuietHoursPanel';
import { StudyTimePanel } from './panels/StudyTimePanel';
import { GoalStylePanel } from './panels/GoalStylePanel';
import { ThemePanel } from './panels/ThemePanel';
import { FontSizePanel } from './panels/FontSizePanel';

const getIconForLabel = (label: string, id: string) => {
  if (label.includes('photo')) return <ImageIcon size={14} />;
  if (label.includes('Email')) return <Mail size={14} />;
  if (label.includes('password')) return <Key size={14} />;
  switch(id) {
    case 'profile': return <User size={14} />;
    case 'coach-freq': return <Hash size={14} />;
    case 'coach-tone': return <MessageCircle size={14} />;
    case 'goal-proposals': return <Target size={14} />;
    case 'disable-coach': return <BellOff size={14} />;
    case 'quiet-hours': return <Moon size={14} />;
    case 'inapp-notifs': return <Bell size={14} />;
    case 'reset-announcements': return <RefreshCw size={14} />;
    case 'email-summary': return <Mail size={14} />;
    case 'study-time': return <Clock size={14} />;
    case 'goal-style': return <Award size={14} />;
    case 'theme': return <LayoutTemplate size={14} />;
    case 'font-size': return <Type size={14} />;
    case 'reduce-motion': return <Maximize size={14} />;
    default: return <Settings size={14} />;
  }
};

export const SettingsMasterPanel = () => {
  const store = useSettingsStore();
  const { logout } = useAuthStore();
  const [query, setQuery] = useState('');
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const closePanel = () => setActivePanel(null);

  const getResults = () => {
    if (!query) return [];
    const q = query.toLowerCase();
    return settingsIndex.filter(item => 
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    );
  };

  const highlight = (text: string) => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, i)}
        <span className="text-accent-sage font-medium">
          {text.slice(i, i + query.length)}
        </span>
        {text.slice(i + query.length)}
      </>
    );
  };

  const results = getResults();
  const isSearching = query.length > 0;

  // Render logic for values
  const getValue = (id: string) => {
    switch(id) {
      case 'coach-freq': return `${store.coachFrequency} / week`;
      case 'coach-tone': return store.coachTone.charAt(0).toUpperCase() + store.coachTone.slice(1);
      case 'quiet-hours': return `${store.quietStart} - ${store.quietEnd}`;
      case 'study-time': return store.studyTime.charAt(0).toUpperCase() + store.studyTime.slice(1);
      case 'goal-style': return store.goalStyle === 'weekly' ? 'Weekly targets' : store.goalStyle === 'milestone' ? 'Milestone-based' : 'Open-ended';
      case 'theme': return store.theme.charAt(0).toUpperCase() + store.theme.slice(1);
      case 'font-size': return store.fontSize.charAt(0).toUpperCase() + store.fontSize.slice(1);
      default: return undefined;
    }
  };

  const getToggleState = (id: string) => {
    switch(id) {
      case 'goal-proposals': return store.goalProposalsEnabled;
      case 'disable-coach': return store.coachDisabled;
      case 'inapp-notifs': return store.inAppEnabled;
      case 'email-summary': return store.emailSummaryEnabled;
      case 'reduce-motion': return store.reduceMotion;
      default: return false;
    }
  };

  const handleToggle = (id: string, val: boolean) => {
    switch(id) {
      case 'goal-proposals': store.set({ goalProposalsEnabled: val }); break;
      case 'disable-coach': store.set({ coachDisabled: val }); break;
      case 'inapp-notifs': store.set({ inAppEnabled: val }); break;
      case 'email-summary': store.set({ emailSummaryEnabled: val }); break;
      case 'reduce-motion': store.set({ reduceMotion: val }); break;
      // 'refl-privacy' is locked
    }
  };

  const renderActivePanel = () => {
    switch(activePanel) {
      case 'coach-freq': return <CoachFrequencyPanel onClose={closePanel} />;
      case 'coach-tone': return <CoachTonePanel onClose={closePanel} />;
      case 'quiet-hours': return <QuietHoursPanel onClose={closePanel} />;
      case 'study-time': return <StudyTimePanel onClose={closePanel} />;
      case 'goal-style': return <GoalStylePanel onClose={closePanel} />;
      case 'theme': return <ThemePanel onClose={closePanel} />;
      case 'font-size': return <FontSizePanel onClose={closePanel} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary dark:bg-bg-dark relative overflow-hidden shrink-0 min-w-0">
      <div className="flex-1 overflow-y-auto w-full">
        {/* We place padding in an inner container to avoid scrollbar layout shifts */}
        <div className="px-4 py-8 lg:py-10 max-w-[600px] mx-auto w-full">
          <SettingsSearch query={query} onQueryChange={setQuery} />

          {!isSearching && (
            <>
              {/* Group Rendering (Standard) */}
              {Array.from(new Set(settingsIndex.map(s => s.category))).map(cat => {
                const items = settingsIndex.filter(s => s.category === cat);

                return (
                  <SettingsGroup key={cat} label={cat}>
                    {items.map((item, idx) => {
                      const isDanger = item.id.includes('delete');
                      const type = item.hasPanel ? 'navigate' : (item.id === 'sign-out' || isDanger || item.id === 'reset-announcements' ? 'navigate' : (item.id === 'refl-privacy' ? 'info' : 'toggle'));

                      const handlePress = () => {
                        if (item.hasPanel) setActivePanel(item.id);
                        if (item.id === 'sign-out') {
                          logout();
                          window.location.href = '/login';
                        }
                        if (item.id === 'reset-announcements') {
                          Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('dismissed_announcement_')) {
                              localStorage.removeItem(key);
                            }
                          });
                          window.location.reload();
                        }
                      };

                      return (
                        <SettingsRow
                          key={item.label}
                          label={item.label}
                          type={type as any}
                          danger={isDanger}
                          hideBorder={idx === items.length - 1}
                          icon={getIconForLabel(item.label, item.id)}
                          iconBg={item.iconBg}
                          iconColor={item.iconColor}
                          value={getValue(item.id)}
                          toggleValue={getToggleState(item.id)}
                          onToggle={(v) => handleToggle(item.id, v)}
                          onPress={handlePress}
                        />
                      );
                    })}
                  </SettingsGroup>
                );
              })}
            </>
          )}

          {isSearching && (
            <div className="flex flex-col bg-bg-secondary dark:bg-bg-darkCard rounded-[14px] overflow-hidden border border-border-light dark:border-border-dark/60 shadow-sm">
              {results.length > 0 ? (
                results.map((item, idx) => {
                  const isDanger = item.id.includes('delete');
                  const type = item.hasPanel ? 'navigate' : (item.id === 'sign-out' || isDanger || item.id === 'reset-announcements' ? 'navigate' : (item.id === 'refl-privacy' ? 'info' : 'toggle'));

                  const handlePress = () => {
                    if (item.hasPanel) setActivePanel(item.id);
                    if (item.id === 'sign-out') {
                      logout();
                      window.location.href = '/login';
                    }
                    if (item.id === 'reset-announcements') {
                      Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('dismissed_announcement_')) {
                          localStorage.removeItem(key);
                        }
                      });
                      window.location.reload();
                    }
                  };

                  return (
                    <SettingsRow
                      key={item.label}
                      label={highlight(item.label) as any}
                      sublabel={item.category}
                      type={type as any}
                      danger={isDanger}
                      hideBorder={idx === results.length - 1}
                      icon={getIconForLabel(item.label, item.id)}
                      iconBg={item.iconBg}
                      iconColor={item.iconColor}
                      value={getValue(item.id)}
                      toggleValue={getToggleState(item.id)}
                      onToggle={(v) => handleToggle(item.id, v)}
                      onPress={handlePress}
                    />
                  );
                })
              ) : (
                <div className="p-8 text-center text-[14px] text-text-tertiary dark:text-text-darkTert">
                  Nothing found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panels slide in over everything in this container */}
      <AnimatePresence>
        {activePanel && renderActivePanel()}
      </AnimatePresence>
    </div>
  );
};
