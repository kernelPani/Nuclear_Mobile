import { FC, ReactNode, useEffect, useState } from 'react';

import { useIsMobilePlatform } from '../../providers/PlatformProvider';
import { DialogRoot } from '../Dialog/DialogRoot';
import { SettingsPanelContent } from './SettingsPanelContent';
import { SettingsPanelMobile } from './SettingsPanelMobile';
import { SettingsPanelNav } from './SettingsPanelNav';

export type SettingsTab = {
  id: string;
  label: string;
  icon: ReactNode;
  content: () => ReactNode;
};

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navFooter?: ReactNode;
  title?: string;
};

export const SettingsPanel: FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  navFooter,
  title,
}) => {
  const isMobile = useIsMobilePlatform();
  const [showDetail, setShowDetail] = useState(false);

  // Always reopen on the master (tab list) view rather than wherever the user
  // last was, so the mobile modal behaves like a fresh settings entry point.
  useEffect(() => {
    if (!isOpen) {
      setShowDetail(false);
    }
  }, [isOpen]);

  if (isMobile) {
    return (
      <SettingsPanelMobile
        isOpen={isOpen}
        onClose={onClose}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        navFooter={navFooter}
        title={title}
        showDetail={showDetail}
        onOpenDetail={() => setShowDetail(true)}
        onBackToList={() => setShowDetail(false)}
      />
    );
  }

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <DialogRoot
      isOpen={isOpen}
      onClose={onClose}
      className="flex h-[80vh] max-h-[900px] w-[80vw] max-w-6xl p-0"
    >
      <SettingsPanelNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        footer={navFooter}
      />
      <SettingsPanelContent>
        {activeTabContent && activeTabContent()}
      </SettingsPanelContent>
    </DialogRoot>
  );
};
