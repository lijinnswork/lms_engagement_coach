import React, { useState, useEffect } from 'react';
import { Loader2, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '../../stores/authStore';

interface CourseStat {
  course_id: string;
  course_name: string;
  total_enrolled_learners: number;
  avg_progress_percent: number;
  avg_grade_percent: number;
  graded_learners_count: number;
}

interface Pagination {
  page: number;
  page_size: number;
  total_pages: number;
  total_count: number;
  next: string | null;
  previous: string | null;
}

export const LiveCourseStats: React.FC = () => {
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>('1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const fetchStats = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    setHasFetched(true);
    try {
      const response = await fetchWithAuth(`/api/admin/live-course-stats?page=${pageNum}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setCourses(data.courses || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
      setInputPage(pageNum.toString());
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching course stats.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputPage);
    if (!isNaN(parsed) && parsed > 0) {
      fetchStats(parsed);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Course Stats</h1>
          <p className="text-gray-400 mt-1">Live data from the production LMS API</p>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center gap-4">
          {!hasFetched ? (
            <button 
              onClick={() => fetchStats(1)}
              className="px-4 py-2 bg-[#00D8FF] text-black font-medium rounded-lg hover:bg-[#00b5d6] transition-colors"
            >
              Fetch Data
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-[#1C2128] p-2 rounded-lg border border-[#3A3F4D]">
              <button 
                onClick={() => fetchStats(page - 1)} 
                disabled={page <= 1 || loading}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Page</span>
                <input 
                  type="number" 
                  value={inputPage}
                  onChange={(e) => setInputPage(e.target.value)}
                  className="w-16 bg-[#0D1117] border border-[#3A3F4D] text-white rounded px-2 py-1 text-center focus:outline-none focus:border-[#00D8FF]"
                  min={1}
                  max={pagination?.total_pages || undefined}
                />
                {pagination && (
                  <span className="text-sm text-gray-400">of {pagination.total_pages}</span>
                )}
              </form>

              <button 
                onClick={() => fetchStats(page + 1)} 
                disabled={(!pagination?.next && pagination !== null) || loading}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 size={32} className="animate-spin text-[#00D8FF]" />
          <p className="text-gray-400">Fetching live statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => fetchStats(page)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-[#1C2128] border border-[#3A3F4D] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0D1117] text-gray-400 text-xs uppercase border-b border-[#3A3F4D]">
                <tr>
                  <th className="px-6 py-4 font-medium">Course ID</th>
                  <th className="px-6 py-4 font-medium">Course Name</th>
                  <th className="px-6 py-4 font-medium text-right">Enrolled</th>
                  <th className="px-6 py-4 font-medium text-right">Avg Progress</th>
                  <th className="px-6 py-4 font-medium text-right">Avg Grade</th>
                  <th className="px-6 py-4 font-medium text-right">Graded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3F4D]">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No courses found for this page.
                    </td>
                  </tr>
                ) : (
                  courses.map((course, idx) => (
                    <tr key={idx} className="hover:bg-[#242834] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                        {course.course_id}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {course.course_name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {course.total_enrolled_learners.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${course.avg_progress_percent > 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                          {course.avg_progress_percent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${course.avg_grade_percent > 0 ? 'bg-blue-500/10 text-[#00D8FF]' : 'bg-gray-500/10 text-gray-400'}`}>
                          {course.avg_grade_percent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {course.graded_learners_count.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="bg-[#0D1117] px-6 py-4 border-t border-[#3A3F4D] flex justify-between items-center text-xs text-gray-400">
              <span>Showing {courses.length} courses on this page.</span>
              <span>Total Courses: {pagination.total_count.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
