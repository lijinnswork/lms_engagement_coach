import React from 'react';
import { ClipboardList } from 'lucide-react';

export const GradesTable = ({ data }: { data: any }) => {
  const getStatusBadge = (status: string) => {
    if (status === 'pass') {
      return <span className="bg-accent-soft/20 text-accent-soft px-2 py-0.5 rounded-full text-[12px] font-medium">Passing ✓</span>;
    }
    if (status === 'fail') {
      return <span className="bg-accent-warm/20 text-accent-warm px-2 py-0.5 rounded-full text-[12px] font-medium">Needs Improvement</span>;
    }
    return <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full text-[12px] font-medium">In Progress</span>;
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-accent-soft';
    if (score >= 60) return 'text-text-primary dark:text-text-darkPri';
    return 'text-accent-warm';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatLastUpdated = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const gradedAssessments = (data.assessments || []).filter((a: any) => a.graded);

  return (
    <div className="bg-bg-secondary dark:bg-bg-darkCard border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      
      <div className="flex items-center gap-2 text-text-primary dark:text-text-darkPri">
        <ClipboardList size={18} />
        <h2 className="font-serif text-[16px] font-medium">Grades</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-text-secondary text-[14px]">Overall:</span>
          <span className="font-mono text-[24px] font-bold text-text-primary dark:text-text-darkPri">{data.overall_grade}%</span>
        </div>
        <div className="hidden sm:block w-px h-6 bg-border-light dark:bg-border-dark"></div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-[14px]">Status:</span>
          {getStatusBadge(data.pass_fail_status)}
        </div>
      </div>

      <div className="overflow-x-auto">
        {gradedAssessments.length > 0 ? (
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark">
                <th className="text-left font-medium text-[12px] text-text-secondary pb-2 uppercase tracking-wider">Assessment</th>
                <th className="text-left font-medium text-[12px] text-text-secondary pb-2 uppercase tracking-wider">Score</th>
                <th className="text-left font-medium text-[12px] text-text-secondary pb-2 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {gradedAssessments.map((a: any, idx: number) => (
                <tr key={idx} className="border-b border-border-light dark:border-border-dark/50 last:border-0">
                  <td className="py-3 text-[14px] text-text-primary dark:text-text-darkPri">{a.assessment_name}</td>
                  <td className={`py-3 text-[14px] font-mono font-medium ${getScoreColorClass(a.score)}`}>
                    {a.score}%
                  </td>
                  <td className="py-3 text-[14px] text-text-secondary font-mono">{formatDate(a.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-[14px] text-text-secondary py-4 border-y border-border-light dark:border-border-dark">
            No graded assessments yet. They'll appear here as you complete them.
          </div>
        )}
      </div>

      {data.grade_last_updated && (
        <div className="text-[12px] text-text-secondary">
          Grade last updated: {formatLastUpdated(data.grade_last_updated)}
        </div>
      )}
    </div>
  );
};
