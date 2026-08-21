const TAB_ROUTES: Record<string, string> = {
  '/desk': '/(tabs)',
  '/chat': '/(tabs)',
  '/discover': '/(tabs)/discover',
  '/requests': '/(tabs)/requests',
  '/tasks': '/(tabs)/tasks',
  '/connect': '/(tabs)/connect',
};

function stripOrigin(path: string): string {
  try {
    const url = new URL(path, 'https://kurukoo.local');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path.startsWith('/') ? path : `/${path}`;
  }
}

/**
 * Resolve Kurukoo's canonical web addresses into the native Expo Router tree.
 *
 * Native navigation is a platform presentation of the same product resources;
 * it must not invent a second URL vocabulary. Unsupported detail resources land
 * in More until a dedicated native detail surface exists rather than silently
 * pretending a different resource is being displayed.
 */
export function redirectSystemPath({ path }: { path: string; initial?: boolean }): string {
  const pathname = stripOrigin(path).split(/[?#]/, 1)[0] || '/';

  const direct = TAB_ROUTES[pathname];
  if (direct) return direct;

  if (/^\/chat\//.test(pathname) || /^\/share\//.test(pathname)) return '/(tabs)';
  if (/^\/requests\//.test(pathname)) return '/(tabs)/requests';
  if (/^\/tasks\//.test(pathname)) return '/(tabs)/tasks';
  if (/^\/connections\//.test(pathname)) return '/(tabs)/connect';

  return '/(tabs)/more';
}
