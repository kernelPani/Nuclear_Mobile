import { ComponentProps, FC } from 'react';

import { cn } from '../utils';

type MobileShellProps = ComponentProps<'div'>;

// Exactly two rows: the scrollable content area (1fr) and the bottom dock
// (auto, sized to its own content). CSS grid auto-placement assigns rows by
// DOM order with no way to skip a slot, so anything else that needs to live
// inside this shell (banners, providers, portaled overlays) must nest inside
// MobileShellMain/MobileShellDock rather than becoming a third sibling here -
// an extra top-level child would silently steal one of these two rows.
export const MobileShell: FC<MobileShellProps> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      'grid h-dvh w-full grid-rows-[1fr_auto] overflow-hidden',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

type MobileShellMainProps = ComponentProps<'main'>;

export const MobileShellMain: FC<MobileShellMainProps> = ({
  children,
  className,
  ...props
}) => (
  <main
    data-testid="mobile-shell-main"
    className={cn(
      'bg-background-secondary min-h-0 min-w-0 overflow-x-hidden overflow-y-auto',
      className,
    )}
    {...props}
  >
    {children}
  </main>
);

type MobileShellDockProps = ComponentProps<'div'>;

export const MobileShellDock: FC<MobileShellDockProps> = ({
  children,
  className,
  ...props
}) => (
  <div
    data-testid="mobile-shell-dock"
    className={cn('flex min-w-0 flex-col', className)}
    {...props}
  >
    {children}
  </div>
);
