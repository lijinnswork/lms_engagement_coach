import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';

interface SettingsRowProps {
  label: string;
  sublabel?: string;
  value?: string;
  type: 'navigate' | 'toggle' | 'info';
  danger?: boolean;
  onPress?: () => void;
  // Toggle specific
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  // Icon specific
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  hideBorder?: boolean;
}

export const SettingsRow = ({
  label,
  sublabel,
  value,
  type,
  danger,
  onPress,
  toggleValue,
  onToggle,
  icon,
  iconBg,
  iconColor,
  hideBorder
}: SettingsRowProps) => {
  const isInteractive = type !== 'info' || onPress;

  return (
    <div
      onClick={isInteractive ? onPress : undefined}
      className={`
        flex items-center justify-between min-h-[44px] py-3 pl-4 pr-5
        ${!hideBorder ? 'border-b border-border-light/50 dark:border-border-dark/50' : ''}
        ${isInteractive ? 'cursor-pointer hover:bg-accent-sage/5 hover:dark:bg-accent-sage/5 transition-colors' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div 
            className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10' : iconBg || 'bg-border-light dark:bg-border-dark'}`}
            style={danger ? { color: '#A05050' } : { color: iconColor }}
          >
            {icon}
          </div>
        )}
        <div className="flex flex-col">
          <span className={`text-[13px] font-medium ${danger ? 'text-[#A05050]' : 'text-text-primary dark:text-text-darkPri'}`}>
            {label}
          </span>
          {sublabel && (
            <span className="text-[11px] text-text-secondary dark:text-text-darkSec mt-0.5 leading-tight">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {type === 'navigate' && (
          <>
            {value && (
              <span className="text-[13px] text-text-secondary dark:text-text-darkSec">{value}</span>
            )}
            <ChevronRight size={16} className={danger ? 'text-[#A05050]/50' : 'text-text-tertiary dark:text-text-darkTert'} />
          </>
        )}
        
        {type === 'toggle' && (
          <ToggleSwitch 
            value={!!toggleValue} 
            onChange={(v) => { if(onToggle) onToggle(v); }} 
          />
        )}

        {type === 'info' && (
          <>
            {value && (
              <span className="text-[13px] text-text-secondary dark:text-text-darkSec">{value}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
