import { useBreakpoint } from '../hooks/useBreakpoint';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { MobileLayout } from '../layouts/MobileLayout';
import { CoachChatInterface } from '../components/Coach/CoachChatInterface';

export const CoachChat = () => {
  const breakpoint = useBreakpoint();

  const content = (
    <div className="w-full h-full flex justify-center">
      <CoachChatInterface />
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
