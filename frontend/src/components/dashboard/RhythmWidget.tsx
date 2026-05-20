interface RhythmDay {
  day: string;
  active: boolean;
  intensity: number;
}

export const RhythmWidget = ({ days }: { days: RhythmDay[] }) => {
  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard rounded-2xl p-4 shadow-sm border border-border-light dark:border-border-dark w-full">
      <div className="flex justify-between w-full mb-4 px-2">
        {days.map((d, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div 
              className={`w-6 h-6 rounded-[5px] ${
                d.active ? 'bg-accent-sage' : 'bg-border-light dark:bg-border-dark'
              }`}
              style={{ opacity: d.active ? d.intensity : (0.35 + (d.intensity * 0.15)) }}
            />
            <span className="text-[10px] font-sans text-text-secondary dark:text-text-darkSec font-medium">
              {d.day}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-sans text-text-secondary dark:text-text-darkSec leading-[1.5] text-center border-t border-border-light dark:border-border-dark pt-3">
        Active {days.filter(d => d.active).length} of 7 days — no pressure, just your pattern.
      </div>
    </div>
  );
};
