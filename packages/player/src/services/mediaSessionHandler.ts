import { invoke } from '@tauri-apps/api/core';
import { platform } from '@tauri-apps/plugin-os';

import { formatArtistNames } from '@nuclearplayer/model';
import { isMobilePlatform, type Platform } from '@nuclearplayer/ui';

import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';
import { Logger } from './logger';

type MediaMetadata = {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
};

type MediaActionType = 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'seek';

declare global {
  interface Window {
    // Installed for the native Android MediaSessionPlugin to call via
    // evaluateJavascript when a transport control is used.
    __nuclearMediaAction?: (action: MediaActionType, seekTime: number) => void;
  }
}

const buildMetadata = (): MediaMetadata | null => {
  const currentItem = useQueueStore.getState().getCurrentItem();
  if (!currentItem) {
    return null;
  }
  const { track } = currentItem;
  const { status, seek, duration } = useSoundStore.getState();
  return {
    title: track.title,
    artist: formatArtistNames(track.artists),
    album: track.album?.title ?? '',
    artworkUrl: track.artwork?.items[0]?.url ?? null,
    isPlaying: status === 'playing',
    positionMs: Math.floor(seek * 1000),
    durationMs: Math.floor(duration * 1000),
  };
};

const pushUpdate = () => {
  const { status } = useSoundStore.getState();
  const metadata = buildMetadata();
  if (!metadata || status === 'stopped') {
    invoke('media_session_clear').catch(() => {});
    return;
  }
  invoke('media_session_update', { metadata }).catch((error) =>
    Logger.playback.debug(`media_session_update failed: ${String(error)}`),
  );
};

// Routes transport actions coming from the OS media controls (notification /
// lock screen) back into the player's stores.
const handleAction = (action: MediaActionType, seekTime: number) => {
  const sound = useSoundStore.getState();
  const queue = useQueueStore.getState();
  switch (action) {
    case 'play':
      sound.play();
      break;
    case 'pause':
      sound.pause();
      break;
    case 'stop':
      sound.stop();
      break;
    case 'next':
      queue.goToNext();
      break;
    case 'previous':
      queue.goToPrevious();
      break;
    case 'seek':
      sound.seekTo(seekTime / 1000);
      break;
  }
};

// Native media session: metadata + transport controls surfaced to the Android
// notification/lock screen via the PlaybackService foreground service. The
// embedded WebView does not bridge the Web `navigator.mediaSession` API to the
// OS, so we drive a native MediaSessionCompat through the Tauri plugin instead.
export const initMediaSessionHandler = () => {
  if (!isMobilePlatform(platform() as Platform)) {
    return;
  }

  window.__nuclearMediaAction = handleAction;

  let previousItemId: string | undefined;
  useQueueStore.subscribe((state) => {
    const currentItem = state.getCurrentItem();
    if (currentItem?.id !== previousItemId) {
      previousItemId = currentItem?.id;
      pushUpdate();
    }
  });

  let previousStatus = useSoundStore.getState().status;
  useSoundStore.subscribe((state) => {
    if (state.status !== previousStatus) {
      previousStatus = state.status;
      pushUpdate();
    }
  });

  pushUpdate();
};
