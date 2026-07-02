import { useRouter } from '@tanstack/react-router';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn, Input } from '@nuclearplayer/ui';

type SearchBoxProps = {
  className?: string;
  initialQuery?: string;
};

export const SearchBox: FC<SearchBoxProps> = ({
  className,
  initialQuery = '',
}) => {
  const { t } = useTranslation('search');
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const submit = () => {
    const q = query.trim();
    if (q.length === 0) {
      return;
    }

    router.navigate({ to: '/search', search: { q } });
  };

  return (
    <Input
      data-testid="search-box"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          submit();
        }
      }}
      placeholder={t('placeholder')}
      tone="secondary"
      className={cn('h-8', className)}
    />
  );
};
