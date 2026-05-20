import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileLayout } from '../layouts/MobileLayout';
import { TabletLayout } from '../layouts/TabletLayout';
import { DesktopLayout } from '../layouts/DesktopLayout';


export const Home = () => {
  const breakpoint = useBreakpoint();

  const renderLayout = () => {
    if (breakpoint === 'desktop') return <DesktopLayout />;
    if (breakpoint === 'tablet') return <TabletLayout />;
    return <MobileLayout />;
  };

  return (
    <>

      {renderLayout()}
    </>
  );
};
