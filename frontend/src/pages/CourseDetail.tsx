import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { MobileLayout } from '../layouts/MobileLayout';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { CourseHeader } from '../components/CourseDetail/CourseHeader';
import { ProgressHero } from '../components/CourseDetail/ProgressHero';
import { ContinueAction } from '../components/CourseDetail/ContinueAction';
import { CoachTake } from '../components/CourseDetail/CoachTake';
import { SuggestedPace } from '../components/CourseDetail/SuggestedPace';
import { GradesTable } from '../components/CourseDetail/GradesTable';
import { CourseGoals } from '../components/CourseDetail/CourseGoals';
import { MilestonesList } from '../components/CourseDetail/MilestonesList';
import { AboutCourse } from '../components/CourseDetail/AboutCourse';
import { motion } from 'framer-motion';

export const CourseDetail = () => {
  const { course_id } = useParams<{ course_id: string }>();
  const breakpoint = useBreakpoint();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/courses/${course_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCourseData(data);
        }
      } catch (err) {
        console.error("Failed to fetch course data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (course_id) {
      fetchCourseData();
    }
  }, [course_id]);

  const content = (
    <div className="w-full h-full bg-bg-primary dark:bg-bg-dark flex flex-col relative pb-20">
      <CourseHeader courseName={courseData?.course_name || 'Loading...'} courseId={course_id || ''} />
      
      <div className="max-w-[800px] w-full mx-auto px-4 md:px-6 pt-6 flex flex-col gap-5">
        {loading ? (
          <div className="w-full h-[200px] bg-bg-secondary dark:bg-bg-darkCard rounded-2xl animate-pulse"></div>
        ) : courseData ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-5"
          >
            <ProgressHero data={courseData} />
            <ContinueAction data={courseData} />
            <CoachTake courseId={course_id!} data={courseData} />
            <SuggestedPace courseId={course_id!} />
            <GradesTable data={courseData} />
            <CourseGoals courseId={course_id!} data={courseData} />
            <MilestonesList data={courseData} />
            <AboutCourse data={courseData} />
          </motion.div>
        ) : (
          <div className="text-center py-12 text-text-secondary">Failed to load course data.</div>
        )}
      </div>
    </div>
  );

  if (breakpoint === 'desktop') return <DesktopLayout>{content}</DesktopLayout>;
  if (breakpoint === 'tablet') return <TabletLayout>{content}</TabletLayout>;
  return <MobileLayout>{content}</MobileLayout>;
};
