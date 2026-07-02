import { ChevronLeftIcon, XIcon } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { DialogRoot } from '../Dialog/DialogRoot';
import type { SettingsTab } from './SettingsPanel';
import { SettingsPanelContent } from './SettingsPanelContent';
import { SettingsPanelNavItem } from './SettingsPanelNavItem';

type SettingsPanelMobileProps = {
  isOpen: boolean;
  onClose: () => void;
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navFooter?: ReactNode;
  title?: string;
  // When a tab is selected we swap the whole full-screen surface from the tab
  // list (master) to that tab's content (detail), iOS-Settings style. The
  // parent owns this flag so closing/reopening the modal can reset it to the
  // list instead of reopening straight into the last detail view.
  showDetail: boolean;
  onOpenDetail: () => void;
  onBackToList: () => void;
};

export const SettingsPanelMobile: FC<SettingsPanelMobileProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  navFooter,
  title,
  showDetail,
  onOpenDetail,
  onBackToList,
}) => {
  const active = tabs.find((tab) => tab.id === activeTab);

  const handleSelect = (tabId: string) => {
    onTabChange(tabId);
    onOpenDetail();
  };

  return (
    <DialogRoot
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      showCloseButton={false}
    >
      {showDetail ? (
        <div className="flex h-full min-h-0 flex-col">
          <header className="border-border flex h-12 shrink-0 items-center gap-2 border-b-(length:--border-width) px-2">
            <button
              type="button"
              onClick={onBackToList}
              data-testid="settings-mobile-back"
              className="text-foreground flex min-h-11 items-center gap-1 px-2"
            >
              <ChevronLeftIcon size={20} />
            </button>
            <span className="text-foreground text-lg font-bold">
              {active?.label}
            </span>
          </header>
          <SettingsPanelContent>{active?.content()}</SettingsPanelContent>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <header className="border-border flex h-12 shrink-0 items-center justify-between border-b-(length:--border-width) px-4">
            <span className="text-foreground text-lg font-bold">{title}</span>
            <button
              type="button"
              onClick={onClose}
              data-testid="settings-mobile-close"
              aria-label="Close"
              className="text-foreground flex min-h-11 items-center px-2"
            >
              <XIcon size={20} />
            </button>
          </header>
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4">
            {tabs.map((tab) => (
              <SettingsPanelNavItem
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={false}
                onClick={() => handleSelect(tab.id)}
              />
            ))}
          </nav>
          {navFooter && (
            <div className="border-border shrink-0 border-t-(length:--border-width) p-4">
              {navFooter}
            </div>
          )}
        </div>
      )}
    </DialogRoot>
  );
};
