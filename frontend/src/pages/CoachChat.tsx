import { useBreakpoint } from '../hooks/useBreakpoint';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { MobileLayout } from '../layouts/MobileLayout';
import { CoachChatInterface } from '../components/Coach/CoachChatInterface';
import { LMSUsernameChecker } from '../components/Coach/LMSUsernameChecker';

export const CoachChat = () => {
  const breakpoint = useBreakpoint();

  const content = (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
      <div className="h-full overflow-hidden">
        <CoachChatInterface />
      </div>
      <div className="h-full overflow-hidden">
        <LMSUsernameChecker />
      </div>
    </div>
  );


  if (breakpoint === 'desktop') {
    return <DesktopLayout>{content}</DesktopLayout>;
  }
  
  if (breakpoint === 'tablet') {
    return <TabletLayout>{content}</TabletLayout>;
  }

  // Mobile layout uses full screen native navigation anyway
  return <MobileLayout>{content}</MobileLayout>;
};
