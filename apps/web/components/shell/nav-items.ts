import type { IconName } from '@/components/ui/icon';

export interface NavItem {
  key: 'today' | 'rooms' | 'journal' | 'me';
  href: '/today' | '/rooms' | '/journal' | '/me';
  icon: IconName;
  /** Order on the tab bar; decides the slide direction on phones. */
  order: number;
  guest: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'today', href: '/today', icon: 'today', order: 0, guest: false },
  { key: 'rooms', href: '/rooms', icon: 'rooms', order: 1, guest: true },
  { key: 'journal', href: '/journal', icon: 'journal', order: 2, guest: false },
  { key: 'me', href: '/me', icon: 'me', order: 3, guest: false },
];
