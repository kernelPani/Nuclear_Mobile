import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, Row } from '@tanstack/react-table';

import { Track } from '@nuclearplayer/model';

import { cn } from '../../utils';

type SortableRowProps<T extends Track = Track> = {
  row: Row<T>;
  itemId: string;
  isReorderable?: boolean;
  isNowPlaying?: boolean;
  style?: React.CSSProperties;
};

export function SortableRow<T extends Track = Track>({
  row,
  itemId,
  isReorderable = false,
  isNowPlaying = false,
  style: externalStyle,
}: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
    disabled: !isReorderable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...externalStyle,
  };

  return (
    <tr
      data-testid="track-row"
      ref={setNodeRef}
      style={style}
      data-now-playing={isNowPlaying || undefined}
      className={cn(
        'border-border bg-background-secondary group border-b-(length:--border-width) select-none',
        {
          '': !isDragging,
          'z-50': isDragging,
          'cursor-grab': isReorderable,
          // Highlight the currently playing track.
          'bg-primary/40 text-foreground font-semibold': isNowPlaying,
        },
      )}
      {...attributes}
      {...listeners}
    >
      {row.getVisibleCells().map((cell) => (
        <Cell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
}

type CellProps<T extends Track> = {
  cell: ReturnType<Row<T>['getVisibleCells']>[number];
};

const Cell = <T extends Track>({ cell }: CellProps<T>) => {
  return flexRender(cell.column.columnDef.cell, cell.getContext());
};
