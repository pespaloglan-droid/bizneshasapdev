import pkg from '../../package.json';
export interface MobileUpdate { version: string; downloadUrl: string; releaseUrl: string }
export function compareMobileVersions(a: string, b: string): number {
  const valid = /^\d{1,6}\.\d{1,6}\.\d{1,6}$/;
  if (!valid.test(a) || !valid.test(b)) throw new Error('INVALID_VERSION');
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i=0;i<3;i++) if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
  return 0;
}
const source = pkg.build.publish;
export const MOBILE_RELEASE_API = `https://api.github.com/repos/${source.owner}/${source.repo}/releases?per_page=10`;
const root = `https://github.com/${source.owner}/${source.repo}/releases/`;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
/** Compare the APK asset version, not the Windows release tag (different versions). */
export function findMobileUpdate(releases: unknown, installed: string): MobileUpdate | null {
  if (!Array.isArray(releases)) throw new Error('INVALID_RELEASE_RESPONSE');
  compareMobileVersions(installed, installed);
  let best: MobileUpdate | null = null;
  for (const release of releases) {
    if (!object(release) || release.draft || release.prerelease || !Array.isArray(release.assets) || typeof release.html_url !== 'string' || !release.html_url.startsWith(root+'tag/')) continue;
    for (const asset of release.assets) {
      if (!object(asset) || typeof asset.name !== 'string' || typeof asset.browser_download_url !== 'string') continue;
      const match = /^BiznesHasap-v(\d{1,6}\.\d{1,6}\.\d{1,6})\.apk$/i.exec(asset.name);
      if (!match || !asset.browser_download_url.startsWith(root+'download/')) continue;
      if (compareMobileVersions(match[1], installed) <= 0 || (best && compareMobileVersions(match[1], best.version) <= 0)) continue;
      best = { version: match[1], downloadUrl: asset.browser_download_url, releaseUrl: release.html_url };
    }
  }
  return best;
}
export async function checkMobileUpdate(installed: string, signal?: AbortSignal): Promise<MobileUpdate | null> {
  const response = await fetch(MOBILE_RELEASE_API, { signal, headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit' });
  if (!response.ok) throw new Error('RELEASE_CHECK_FAILED');
  return findMobileUpdate(await response.json(), installed);
}
