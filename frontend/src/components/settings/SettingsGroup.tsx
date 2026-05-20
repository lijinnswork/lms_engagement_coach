import React from 'react';

interface SettingsGroupProps {
  label?: string;
  children: React.ReactNode;
}

export const SettingsGroup = ({ label, children }: SettingsGroupProps) => {
  return (
    <div className="flex flex-col mb-8">
      {label && (
        <h3 className="px-4 text-[11px] font-semibold text-text-secondary dark:text-text-darkSec uppercase tracking-wider mb-2">
          {label}
        </h3>
      )}
      <div className="flex flex-col bg-bg-secondary dark:bg-bg-darkCard rounded-[14px] overflow-hidden border border-border-light dark:border-border-dark/60 shadow-sm">
        {children}
      </div>
    </div>
  );
};
