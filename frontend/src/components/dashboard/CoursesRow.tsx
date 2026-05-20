import { mockCourses } from '../../data/mockDashboard';
import { CourseCard } from './CourseCard';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export const CoursesRow = () => {
  const breakpoint = useBreakpoint();
  
  if (breakpoint === 'desktop') {
    return (
      <div className="flex flex-wrap gap-4 mt-2">
        {mockCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    );
  }

  // Mobile and Tablet - Horizontal scroll, hide scrollbar via CSS class
  return (
    <div className="flex overflow-x-auto gap-4 mt-2 pb-4 -mx-6 px-6 no-scrollbar">
      {mockCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};
