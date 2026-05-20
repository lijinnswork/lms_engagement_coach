export const mockUser = {
  name: 'Priya',
  greeting: 'Good morning',
  date: 'Thursday, April 16',
};

export const mockCourses = [
  {
    id: 'python-101',
    name: 'Python Fundamentals',
    modulesComplete: 12,
    modulesTotal: 18,
    progress: 65,
    color: '#7B9EA8',    // sage
    iconType: 'code',
  },
  {
    id: 'data-sci-101',
    name: 'Data Science Basics',
    modulesComplete: 5,
    modulesTotal: 16,
    progress: 30,
    color: '#E8A87C',   // peach
    iconType: 'grid',
  },
  {
    id: 'ux-101',
    name: 'UX Design Foundations',
    modulesComplete: 2,
    modulesTotal: 14,
    progress: 15,
    color: '#B4C7B8',   // mint
    iconType: 'monitor',
  },
];

export const mockCoachMessage = {
  text: `I noticed you came back to data structures three times this
         week. Something about it is clicking — how does it feel now
         compared to when you started?`,
  triggeredBy: 'momentum',
};

export const mockNextAction = {
  label: 'Suggested next step',
  text: 'Your Data Science module is 70% done — about 20 minutes to finish it today.',
  courseId: 'data-sci-101',
};

export interface Goal {
  id: string;
  name: string;
  meta: string;
  status: 'active' | 'proposed';
  done: boolean;
  proposedBy: 'student' | 'coach';
}

export const mockGoals: Goal[] = [
  {
    id: 'g1',
    name: 'Complete Module 4 — recursion',
    meta: 'Python Fundamentals · by Sunday',
    status: 'active',
    done: false,
    proposedBy: 'student',
  },
  {
    id: 'g2',
    name: 'Watch 3 intro lectures',
    meta: 'Data Science Basics · done today',
    status: 'active',
    done: true,
    proposedBy: 'student',
  },
  {
    id: 'g3',
    name: 'Finish the wireframe assignment',
    meta: 'UX Design · proposed by coach',
    status: 'proposed',
    done: false,
    proposedBy: 'coach',
  },
];

export const mockRhythm = [
  { day: 'Mon', active: true,  intensity: 0.9 },
  { day: 'Tue', active: true,  intensity: 0.55 },
  { day: 'Wed', active: false, intensity: 0 },
  { day: 'Thu', active: true,  intensity: 0.8 },
  { day: 'Fri', active: false, intensity: 0.5 },
  { day: 'Sat', active: false, intensity: 0.35 },
  { day: 'Sun', active: false, intensity: 0.35 },
];
