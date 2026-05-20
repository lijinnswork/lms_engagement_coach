import { Search, X } from 'lucide-react';

interface SettingsSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
}

export const SettingsSearch = ({ query, onQueryChange }: SettingsSearchProps) => {
  return (
    <div className="relative mb-6">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-text-darkTert">
        <Search size={14} />
      </div>
      
      <input
        type="text"
        placeholder="Search settings..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full h-[38px] pl-[34px] pr-8 py-[9px] rounded-[11px] bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark text-[14px] text-text-primary dark:text-text-darkPri placeholder:text-text-tertiary dark:placeholder:text-text-darkTert focus:outline-none focus:border-accent-sage dark:focus:border-accent-sage transition-colors shadow-sm"
      />
      
      {query.length > 0 && (
        <button
          onClick={() => onQueryChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-text-darkTert hover:text-text-primary dark:hover:text-text-darkPri transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
