import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Loader } from '@nuclearplayer/ui';

import { ConnectedTrackTable } from '../../../components/ConnectedTrackTable';
import { useDashboardTopTracks } from '../hooks/useDashboardData';

export const TopTracksWidget: FC = () => {
  const { t } = useTranslation('dashboard');
  const { data: results, isLoading } = useDashboardTopTracks();

  const tracks = useMemo(
    () => results?.flatMap((result) => result.items) ?? [],
    [results],
  );

  // Don't render an empty widget: a provider that returns no tracks would
  // otherwise leave a full-height blank block that hides the widgets below.
  if (!isLoading && tracks.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="dashboard-top-tracks"
      className="flex shrink-0 flex-col pb-4"
    >
      <h2 className="mb-2 text-lg font-semibold">{t('top-tracks')}</h2>
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader data-testid="dashboard-top-tracks-loader" />
        </div>
      ) : (
        // Bound the height so the virtualized table is a dashboard-sized
        // preview instead of grabbing the whole viewport.
        <div className="h-96">
          <ConnectedTrackTable
            tracks={tracks}
            features={{ filterable: true, playAll: true, addAllToQueue: true }}
            display={{ displayDuration: false }}
          />
        </div>
      )}
    </div>
  );
};
