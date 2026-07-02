import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

type BottomTabBarProps = {
  children?: ReactNode;
  className?: string;
};

export const BottomTabBar: FC<BottomTabBarProps> = ({
  children,
  className = '',
}) => (
  <nav
    data-testid="bottom-tab-bar"
    className={cn(
      'bg-background-secondary border-border pb-safe-bottom flex shrink-0 flex-row border-t-(length:--border-width)',
      className,
    )}
  >
    {children}
  </nav>
);
