import { Link } from '@tanstack/react-router';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

type BottomTabBarItemProps = {
  icon: ReactNode;
  label: string;
  isSelected?: boolean;
  to?: string;
  onClick?: () => void;
};

const MaybeNavLink: FC<{
  to?: string;
  isSelected?: boolean;
  children: (isSelected: boolean) => ReactNode;
}> = ({ to, isSelected = false, children }) => {
  if (to) {
    // className goes on Link itself (it renders the actual flex item, an <a>),
    // not just on its child - otherwise flex-1 on the child has no effect since
    // its real parent in the flex row is the anchor, not the BottomTabBar.
    return (
      <Link to={to} className="flex flex-1">
        {({ isActive }) => children(isActive)}
      </Link>
    );
  }
  return <>{children(isSelected)}</>;
};

export const BottomTabBarItem: FC<BottomTabBarItemProps> = ({
  icon,
  label,
  isSelected,
  to,
  onClick,
}) => (
  <MaybeNavLink to={to} isSelected={isSelected}>
    {(active) => (
      <div
        role="button"
        onClick={onClick}
        data-testid="bottom-tab-bar-item"
        className={cn(
          'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1',
          {
            'text-primary': active,
            'text-foreground-secondary': !active,
          },
        )}
      >
        <div className="flex size-6 items-center justify-center [&>svg]:size-5">
          {icon}
        </div>
        <span className={cn('text-xs', { 'font-bold': active })}>{label}</span>
      </div>
    )}
  </MaybeNavLink>
);
