import type { SVGProps } from 'react';

export type IconName =
  | 'pen'
  | 'today'
  | 'rooms'
  | 'journal'
  | 'me'
  | 'lock'
  | 'mask'
  | 'globe'
  | 'check'
  | 'bell'
  | 'bell-off'
  | 'more'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'flame'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'sun'
  | 'bookmark'
  | 'bookmark-filled'
  | 'compass'
  | 'focus'
  | 'copy'
  | 'download'
  | 'search'
  | 'plus'
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'quote'
  | 'divider'
  | 'heading'
  | 'heart'
  | 'hand'
  | 'eye'
  | 'clock'
  | 'book'
  | 'shield'
  | 'leaf'
  | 'phone'
  | 'install'
  | 'key'
  | 'trash'
  | 'edit'
  | 'drag';

/* Single-weight line icons, 1.5 px stroke, 24 px grid. Decorative by default. */
const PATHS: Record<IconName, string> = {
  pen: 'M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3',
  today:
    'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4',
  rooms: 'M3 20V9l9-6 9 6v11M9 20v-6h6v6',
  journal: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h5',
  me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  mask: 'M4 8c3-2 13-2 16 0 0 6-3 9-8 9s-8-3-8-9zM9 12h.01M15 12h.01',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  'bell-off': 'M6 16V11a6 6 0 0 1 9-5.2M18 13v3l1.5 2h-15M10 20a2 2 0 0 0 4 0M4 4l16 16',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  'arrow-down': 'M12 5v14M6 13l6 6 6-6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  flame:
    'M12 21c-4 0-6.5-2.7-6.5-6 0-3 2-5 3.5-7 .5 2 1.5 3 2.5 3 0-3 1-6 3.5-8 0 3 4 5 4 10 0 4.5-3 8-7 8z',
  close: 'M6 6l12 12M18 6L6 18',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  bookmark: 'M6 4h12v17l-6-4.5L6 21z',
  'bookmark-filled': 'M6 4h12v17l-6-4.5L6 21zM9 7.5h6M9 10.5h6',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  focus:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.5-4.5',
  plus: 'M12 5v14M5 12h14',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
  bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
  italic: 'M14 5h5M5 19h5M15 5l-6 14',
  quote: 'M6 17c0-5 2-8 6-9M13 17c0-5 2-8 6-9M6 17h3v-4H6zM13 17h3v-4h-3z',
  divider: 'M4 12h16',
  heading: 'M6 5v14M18 5v14M6 12h12',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  hand: 'M8 13V6a1.5 1.5 0 0 1 3 0v6M11 12V4.5a1.5 1.5 0 0 1 3 0V12M14 12V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-12 0v-3a1.5 1.5 0 0 1 3 0',
  eye: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  book: 'M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  leaf: 'M5 19c0-8 5-13 14-13-1 9-5 14-14 13zM5 19c3-4 6-7 10-9',
  phone:
    'M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z',
  install: 'M12 3v12M8 11l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  key: 'M14 10a4 4 0 1 0-4 4h1l1 1h2v2h2l1 1v2h3v-3l-5-5a4 4 0 0 0-1-2z',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6',
  edit: 'M4 20h4l10-10-4-4L4 16zM13 7l4 4',
  drag: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  label?: string;
}

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
