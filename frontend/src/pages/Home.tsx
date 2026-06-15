import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileLayout } from '../layouts/MobileLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { FloatingNudgeStack } from '../components/Notifications/FloatingNudgeStack';


export const Home = () => {
  const breakpoint = useBreakpoint();
  console.error('DEBUG Home: rendered');

  const renderLayout = () => {
    if (breakpoint === 'desktop') return <DesktopLayout />;
    if (breakpoint === 'tablet') return <TabletLayout />;
    return <MobileLayout />;
  };

  return (
    <>
      {renderLayout()}
      <FloatingNudgeStack />
    </>
  );
};
