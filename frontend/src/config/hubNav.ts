export type HubNavItem = {
  label: string;
  icon: string;
  to: string;
  match: (pathname: string, search: string) => boolean;
  /** Requires Fanverse Plus (watch / play / earn) */
  premium?: boolean;
};

export const hubNavItems: HubNavItem[] = [
  { label: 'Home', icon: 'home', to: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Play', icon: 'sports_esports', to: '/gameplay', match: (p) => p === '/gameplay', premium: true },
  { label: 'Wallet', icon: 'account_balance_wallet', to: '/history', match: (p) => p === '/history' },
  {
    label: 'Earn',
    icon: 'workspace_premium',
    to: '/earn-share?view=earn',
    match: (p, s) => p === '/earn-share' && new URLSearchParams(s).get('view') !== 'share',
    premium: true,
  },
  {
    label: 'Share',
    icon: 'hub',
    to: '/earn-share?view=share',
    match: (p, s) => p === '/earn-share' && new URLSearchParams(s).get('view') === 'share',
  },
  { label: 'Watch', icon: 'sensors', to: '/streaming', match: (p) => p === '/streaming', premium: true },
];
