import { platform } from '@tauri-apps/plugin-os';
import React from 'react';

import { isMobilePlatform, type Platform } from '@nuclearplayer/ui';

import App from './App';
import { initLogStream } from './hooks/useLogStream';
import { startAdvancedThemeWatcher } from './services/advancedThemeDirService';
import { applyThemeFromSettingsIfAny } from './services/advancedThemeService';
import { initBridgeHandler } from './services/bridge/bridgeHandler';
import { registerBuiltInCoreSettings } from './services/coreSettings';
import { initDiscordHandler } from './services/discordHandler';
import { initDiscoveryService } from './services/discoveryService';
import { initHttpApiHandler } from './services/httpApi';
import {
  applyLanguageFromSettings,
  initLanguageWatcher,
} from './services/languageService';
import { loadMarketplaceThemes } from './services/marketplaceThemeDirService';
import { initMcpHandler } from './services/mcp';
import { initMediaSessionHandler } from './services/mediaSessionHandler';
import { initMpdHandler } from './services/mpd';
import { hydratePluginsFromRegistry } from './services/plugins/pluginBootstrap';
import { ytdlpEnsureInstalled } from './services/tauri/commands';
import { initializeFavoritesStore } from './stores/favoritesStore';
import { initializePlaylistStore } from './stores/playlistStore';
import { initializeQueueStore } from './stores/queueStore';
import { initializeSettingsStore } from './stores/settingsStore';
import { initializeShortcutsStore } from './stores/shortcutsStore';
import { hydrateThemeStore } from './stores/themeStore';
import { useUpdaterStore } from './stores/updaterStore';

export const initPlayerApp = async (
  root: ReturnType<typeof import('react-dom/client').createRoot>,
) => {
  initLogStream();

  await initializeSettingsStore()
    .then(() => initializeShortcutsStore())
    .then(() => initializeQueueStore())
    .then(() => initializeFavoritesStore())
    .then(() => initializePlaylistStore())
    .then(() => registerBuiltInCoreSettings())
    .then(() => initDiscoveryService())
    .then(() => initMcpHandler())
    .then(() => initMpdHandler())
    .then(() => initHttpApiHandler())
    .then(() => initBridgeHandler())
    .then(() => initDiscordHandler())
    .then(() => initMediaSessionHandler())
    .then(() => applyLanguageFromSettings())
    .then(() => initLanguageWatcher())
    .then(() => startAdvancedThemeWatcher())
    .then(() => loadMarketplaceThemes())
    .then(() => hydrateThemeStore())
    .then(() => applyThemeFromSettingsIfAny())
    .then(() => {
      void hydratePluginsFromRegistry();
      // The updater plugin is desktop-only (see Cargo.toml/lib.rs); calling it
      // on mobile just logs a "plugin not found" error.
      if (!isMobilePlatform(platform() as Platform)) {
        void useUpdaterStore.getState().checkForUpdate();
      }
      void ytdlpEnsureInstalled();
    });

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};
