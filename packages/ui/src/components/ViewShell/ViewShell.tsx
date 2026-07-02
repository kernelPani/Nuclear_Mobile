import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { ScrollableArea } from '../ScrollableArea';

type ViewShellClasses = {
  root?: string;
  scrollableArea?: string;
};

type ViewShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  'data-testid'?: string;
  classes?: ViewShellClasses;
};

export const ViewShell: FC<ViewShellProps> = ({
  children,
  title,
  subtitle,
  'data-testid': dataTestId,
  classes,
}) => (
  <div
    className={cn(
      'bg-background relative flex h-full min-h-0 w-full flex-1 flex-col items-start justify-start px-3 pt-3 sm:px-6 sm:pt-6',
      classes?.root,
    )}
    data-testid={dataTestId}
  >
    {title && (
      <h1
        className="mb-3 flex w-full flex-0 flex-row text-center text-2xl font-bold sm:mb-6 sm:text-3xl"
        data-testid="title"
      >
        {title}
      </h1>
    )}
    {subtitle && (
      <h2 className="mb-4 flex w-full flex-0 flex-row text-center text-xl font-semibold">
        {subtitle}
      </h2>
    )}
    <ScrollableArea
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col',
        classes?.scrollableArea,
      )}
    >
      {children}
    </ScrollableArea>
  </div>
);
