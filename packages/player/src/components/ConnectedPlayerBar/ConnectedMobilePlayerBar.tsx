import { FC } from 'react';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedNowPlaying } from './ConnectedNowPlaying';
import { ConnectedSeekBar } from './ConnectedSeekBar';

type ConnectedMobilePlayerBarProps = {
  onOpenQueue?: () => void;
};

// Compact single-row layout for the mobile bottom dock: same connected pieces
// as the desktop PlayerBar (ConnectedSeekBar/NowPlaying/Controls), just
// arranged for a narrow screen. Volume is left out (hardware buttons cover
// that on phones) and Controls renders in compact mode (prev/play/next only)
// since now-playing info + shuffle/prev/play/next/repeat doesn't fit next to
// each other below ~400px wide. Tapping the now-playing area opens the queue
// sheet, same idea as tapping a mini player on other mobile music apps.
export const ConnectedMobilePlayerBar: FC<ConnectedMobilePlayerBarProps> = ({
  onOpenQueue,
}) => (
  <div
    data-testid="mobile-player-bar"
    className="bg-background-secondary border-border border-t-(length:--border-width)"
  >
    <ConnectedSeekBar />
    <div className="flex items-center gap-2 px-3 py-2">
      <div
        className="min-w-0 flex-1"
        role={onOpenQueue ? 'button' : undefined}
        onClick={onOpenQueue}
        data-testid="mobile-player-bar-open-queue"
      >
        <ConnectedNowPlaying />
      </div>
      <ConnectedControls compact />
    </div>
  </div>
);
