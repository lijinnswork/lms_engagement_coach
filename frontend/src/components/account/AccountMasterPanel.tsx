import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { accountIndex } from '../../data/accountIndex';
import { SettingsSearch } from '../settings/SettingsSearch';
import { ProfileSummary } from './ProfileSummary';
import { SettingsGroup } from '../settings/SettingsGroup';
import { SettingsRow } from '../settings/SettingsRow';

// Icons
import {
  User, Image as ImageIcon, Mail, Key, Link as LinkIcon, DownloadCloud,
  XOctagon, LogOut, Settings, Smartphone, LayoutTemplate
} from 'lucide-react';

// Panels
import { ProfilePanel } from './panels/ProfilePanel';
import { ExportDataPanel } from './panels/ExportDataPanel';
import { DeleteAccountPanel } from './panels/DeleteAccountPanel';
import { ChangePasswordPanel } from './panels/ChangePasswordPanel';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { DataSummaryPanel } from './panels/DataSummaryPanel';
import { LmsAccountPanel } from './panels/LmsAccountPanel';

const getIconForLabel = (label: string, id: string) => {
  if (label.includes('photo')) return <ImageIcon size={14} />;
  if (label.includes('Email')) return <Mail size={14} />;
  if (label.includes('password')) return <Key size={14} />;
  if (label.includes('sessions')) return <Smartphone size={14} />;
  if (label.includes('summary')) return <LayoutTemplate size={14} />;
  switch(id) {
    case 'profile': return <User size={14} />;
    case 'lms-account': return <LinkIcon size={14} />;
    case 'export-data': return <DownloadCloud size={14} />;
    case 'sign-out': return <LogOut size={14} />;
    case 'delete-account': return <XOctagon size={14} />;
    default: return <Settings size={14} />;
  }
};

export const AccountMasterPanel = () => {
  const { logout, user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const closePanel = () => setActivePanel(null);

  const getResults = () => {
    if (!query) return [];
    const q = query.toLowerCase();
    return accountIndex
      .filter(item => {
        if (item.id === 'lms-account' && user?.role !== 'super_admin' && user?.role !== 'support_staff') return false;
        return true;
      })
      .filter(item => 
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
      case 'lms-account': return 'Open edX';
      default: return undefined;
    }
  };

  const renderActivePanel = () => {
    switch(activePanel) {
      case 'profile': return <ProfilePanel onClose={closePanel} />;
      case 'export-data': return <ExportDataPanel onClose={closePanel} />;
      case 'delete-account': return <DeleteAccountPanel onClose={closePanel} />;
      case 'change-password': return <ChangePasswordPanel onClose={closePanel} />;
      case 'active-sessions': return <ActiveSessionsPanel onClose={closePanel} />;
      case 'data-summary': return <DataSummaryPanel onClose={closePanel} />;
      case 'lms-account': return <LmsAccountPanel onClose={closePanel} />;
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
              <ProfileSummary onEdit={() => setActivePanel('profile')} />

              {/* Group Rendering (Standard) */}
              {Array.from(new Set(accountIndex.map(s => s.category))).map(cat => {
                const items = accountIndex
                  .filter(s => s.category === cat)
                  .filter(item => {
                    if (item.id === 'lms-account' && user?.role !== 'super_admin' && user?.role !== 'support_staff') return false;
                    return true;
                  });
                if (items.length === 0) return null;
                if (items.find(i => i.id === 'profile')) return null; // Profile is handled via ProfileSummary above

                return (
                  <SettingsGroup key={cat} label={cat}>
                    {items.map((item, idx) => {
                      const isDanger = item.id.includes('delete');
                      const type = item.hasPanel ? 'navigate' : (item.id === 'sign-out' || isDanger ? 'navigate' : 'info');

                      const handlePress = () => {
                        if (item.hasPanel) setActivePanel(item.id);
                        if (item.id === 'sign-out') {
                          localStorage.setItem('manually_logged_out', 'true');
                          logout();
                          window.location.href = '/login';
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
                  const type = item.hasPanel ? 'navigate' : (item.id === 'sign-out' || isDanger ? 'navigate' : 'info');

                  const handlePress = () => {
                    if (item.hasPanel) setActivePanel(item.id);
                    if (item.id === 'sign-out') {
                      localStorage.setItem('manually_logged_out', 'true');
                      logout();
                      window.location.href = '/login';
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
