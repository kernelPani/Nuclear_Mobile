import { BlocksIcon, GaugeIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { FC, useState } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import {
  BottomTabBar,
  BottomTabBarItem,
  Dialog,
  MobileShell,
  MobileShellDock,
  MobileShellMain,
  RouteTransition,
  Toaster,
} from '@nuclearplayer/ui';

import { useSettingsModalStore } from '../stores/settingsModalStore';
import { useStartupStore } from '../stores/startupStore';
import { ConnectedMobilePlayerBar } from './ConnectedPlayerBar/ConnectedMobilePlayerBar';
import { ConnectedQueuePanel, QueueHeaderActions } from './ConnectedQueuePanel';
import { ConnectedSettingsModal } from './ConnectedSettingsModal';
import { FlatpakWarningBanner } from './FlatpakWarningBanner';
import { SoundProvider } from './SoundProvider';
import { StreamResolver } from './StreamResolver';

// Mobile counterpart to the desktop tree in routes/__root.tsx: no title bar,
// no resizable sidebars, no global keyboard shortcuts. Same stores/hooks
// power both trees; only the shell around them differs.
export const MobileRoot: FC = () => {
  const { t } = useTranslation('navigation');
  const { t: tSearch } = useTranslation('search');
  const { t: tPlugins } = useTranslation('plugins');
  const { t: tPreferences } = useTranslation('preferences');
  const { t: tQueue } = useTranslation('queue');
  const openSettings = useSettingsModalStore((state) => state.open);
  const isStartingUp = useStartupStore((state) => state.isStartingUp);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  return (
    <MobileShell onContextMenu={(event) => event.preventDefault()}>
      <FlatpakWarningBanner />
      {!isStartingUp && <StreamResolver />}
      <SoundProvider>
        <MobileShellMain>
          <RouteTransition />
        </MobileShellMain>
      </SoundProvider>

      <MobileShellDock>
        <ConnectedMobilePlayerBar onOpenQueue={() => setIsQueueOpen(true)} />
        <BottomTabBar>
          <BottomTabBarItem
            to="/dashboard"
            icon={<GaugeIcon />}
            label={t('dashboard')}
          />
          <BottomTabBarItem
            to="/search"
            icon={<SearchIcon />}
            label={tSearch('title')}
          />
          <BottomTabBarItem
            to="/plugins"
            icon={<BlocksIcon />}
            label={tPlugins('title')}
          />
          <BottomTabBarItem
            icon={<SettingsIcon />}
            label={tPreferences('title')}
            onClick={openSettings}
          />
        </BottomTabBar>
      </MobileShellDock>

      <Dialog
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        title={tQueue('title')}
        actions={<QueueHeaderActions />}
      >
        <ConnectedQueuePanel />
      </Dialog>

      <Toaster />
      <ConnectedSettingsModal />
    </MobileShell>
  );
};
