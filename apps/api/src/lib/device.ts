/**
 * Summarises a User-Agent into a short label for the sessions list
 * («Safari auf iPhone»). The raw UA string is never stored.
 */
export function describeDevice(userAgent: string | undefined): string {
  if (!userAgent) return 'Unknown device';
  const ua = userAgent;
  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('OPR/')
      ? 'Opera'
      : ua.includes('Firefox/')
        ? 'Firefox'
        : ua.includes('Chrome/')
          ? 'Chrome'
          : ua.includes('Safari/')
            ? 'Safari'
            : 'Browser';
  const device = ua.includes('iPhone')
    ? 'iPhone'
    : ua.includes('iPad')
      ? 'iPad'
      : ua.includes('Android')
        ? 'Android'
        : ua.includes('Macintosh')
          ? 'Mac'
          : ua.includes('Windows')
            ? 'Windows'
            : ua.includes('Linux')
              ? 'Linux'
              : 'Device';
  return `${browser} · ${device}`;
}
