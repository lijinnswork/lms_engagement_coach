import { useBreakpoint } from '../hooks/useBreakpoint';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { MobileLayout } from '../layouts/MobileLayout';
import { CoachChatInterface } from '../components/Coach/CoachChatInterface';
import { CoachSidebar } from '../components/Coach/CoachSidebar';

export const CoachChat = () => {
  const breakpoint = useBreakpoint();

  const content = (
    <div className="w-full h-full p-6 overflow-hidden">
      <div className="h-full overflow-hidden">
        <CoachChatInterface />
      </div>
    </div>
  );

  const desktopContent = (
    <div className="w-full h-full flex overflow-hidden">
      <CoachSidebar />
      <div className="flex-1 h-full overflow-hidden">
        <CoachChatInterface />
      </div>
    </div>
  );

  if (breakpoint === 'desktop') {
    return <DesktopLayout>{desktopContent}</DesktopLayout>;
  }
  
  if (breakpoint === 'tablet') {
    return <TabletLayout>{content}</TabletLayout>;
  }

  // Mobile layout uses full screen native navigation anyway
  return <MobileLayout>{content}</MobileLayout>;
};
