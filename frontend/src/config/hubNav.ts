export type HubNavItem = {
  labelKey: string;
  icon: string;
  to: string;
  match: (pathname: string, search: string) => boolean;
  /** Requires Fanverse Plus (watch / play / win) */
  premium?: boolean;
};

/** Bottom nav + dashboard hub footer: Home → Watch → Play → Win → Share */
export const hubNavItems: HubNavItem[] = [
  { labelKey: 'nav.home', icon: 'home', to: '/dashboard', match: (p) => p === '/dashboard' },
  { labelKey: 'nav.watch', icon: 'sensors', to: '/streaming', match: (p) => p === '/streaming', premium: true },
  { labelKey: 'nav.play', icon: 'sports_esports', to: '/gameplay', match: (p) => p === '/gameplay', premium: true },
  {
    labelKey: 'nav.win',
    icon: 'workspace_premium',
    to: '/earn-share?view=earn',
    match: (p, s) => p === '/earn-share' && new URLSearchParams(s).get('view') !== 'share',
    premium: true,
  },
  {
    labelKey: 'nav.share',
    icon: 'hub',
    to: '/earn-share?view=share',
    match: (p, s) => p === '/earn-share' && new URLSearchParams(s).get('view') === 'share',
  },
];

/** Desktop header hub tabs (by label key). */
export const headerNavLabelKeys = ['nav.home', 'nav.watch', 'nav.play', 'nav.win', 'nav.share'] as const;
