import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
import { getAssetUrl } from './backend';

export type AppUpdateInfo = {
  version: string;
  versionCode: number;
  apkUrl: string;
  notes?: string;
  force?: boolean;
};

export type UpdateCheckResult =
  | { status: 'up_to_date'; current: number; latest: AppUpdateInfo }
  | { status: 'available'; current: number; latest: AppUpdateInfo }
  | { status: 'unavailable'; message: string };

function updateManifestUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.updateUrl as string | undefined;
  if (fromExtra?.trim()) return fromExtra.trim();
  return `${getAssetUrl()}/app-update.json`;
}

export function getInstalledVersionCode(): number {
  const fromNative = Number(Constants.nativeBuildVersion);
  if (Number.isFinite(fromNative) && fromNative > 0) return fromNative;

  const fromConfig = Number(Constants.expoConfig?.android?.versionCode);
  if (Number.isFinite(fromConfig) && fromConfig > 0) return fromConfig;

  return 1;
}

export function getInstalledVersionName(): string {
  return (
    Constants.nativeAppVersion ||
    Constants.expoConfig?.version ||
    '1.0.0'
  );
}

export async function fetchLatestUpdate(): Promise<AppUpdateInfo> {
  const response = await fetch(updateManifestUrl(), {
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) {
    throw new Error(`Update check failed (${response.status}).`);
  }
  const data = (await response.json()) as Partial<AppUpdateInfo>;
  if (!data.apkUrl || !data.version || !Number.isFinite(Number(data.versionCode))) {
    throw new Error('Update manifest is invalid.');
  }
  return {
    version: String(data.version),
    versionCode: Number(data.versionCode),
    apkUrl: String(data.apkUrl),
    notes: data.notes ? String(data.notes) : undefined,
    force: Boolean(data.force),
  };
}

export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  try {
    const latest = await fetchLatestUpdate();
    const current = getInstalledVersionCode();
    if (latest.versionCode > current) {
      return { status: 'available', current, latest };
    }
    return { status: 'up_to_date', current, latest };
  } catch (error) {
    return {
      status: 'unavailable',
      message: error instanceof Error ? error.message : 'Unable to check for updates.',
    };
  }
}

/** Download APK and open the Android installer, or fall back to the browser. */
export async function installAppUpdate(latest: AppUpdateInfo): Promise<void> {
  if (Platform.OS !== 'android') {
    await Linking.openURL(latest.apkUrl);
    return;
  }

  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) throw new Error('No cache directory');
    const target = `${cacheDir}crud-update-${latest.versionCode}.apk`;
    const download = await FileSystem.downloadAsync(latest.apkUrl, target);
    if (download.status !== 200) {
      throw new Error(`Download failed (${download.status}).`);
    }
    const contentUri = await FileSystem.getContentUriAsync(download.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });
  } catch {
    // Fallback: open the APK URL in the browser / download manager
    const canOpen = await Linking.canOpenURL(latest.apkUrl);
    if (!canOpen) {
      throw new Error('Unable to open the update download link.');
    }
    await Linking.openURL(latest.apkUrl);
  }
}
