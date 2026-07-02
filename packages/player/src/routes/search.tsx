import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { Search } from '../views/Search/Search';

export const Route = createFileRoute('/search')({
  component: Search,
  validateSearch: z.object({
    // No .min(1) here: '' is the valid "nothing searched yet" state (see
    // Search.tsx's `enabled: Boolean(provider && q)`). A .min(1) on a field
    // defaulting to '' fails validation on every bare /search visit.
    q: z.string().max(100).default(''),
  }),
});
