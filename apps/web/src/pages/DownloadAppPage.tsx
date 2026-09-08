import { useMemo } from 'react';
import { Link } from 'react-router-dom';

function getApkUrl(): string {
  const fromEnv = import.meta.env.VITE_ANDROID_APK_URL?.trim();
  if (fromEnv) return fromEnv;
  return '/downloads/crud-android.apk';
}

export function DownloadAppPage() {
  const apkUrl = useMemo(() => getApkUrl(), []);
  const isAndroid = useMemo(() => /android/i.test(navigator.userAgent), []);

  return (
    <div className="onboard-screen">
      <div className="onboard-panel" style={{ maxWidth: 520 }}>
        <p className="onboard-kicker brand-color">CRUD Mobile</p>
        <h1>Download the Android app</h1>
        <p className="muted">
          Free install — no Play Store fee. Download the APK, then allow install from this browser.
        </p>

        <a className="btn btn-primary" href={apkUrl} download="crud-android.apk" style={{ width: '100%', textAlign: 'center' }}>
          {isAndroid ? 'Download & install APK' : 'Download Android APK'}
        </a>

        <div className="card card-pad" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Install steps (Android)</h3>
          <ol className="muted" style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Tap <strong>Download &amp; install APK</strong>.</li>
            <li>Open the downloaded file from the notification or Files app.</li>
            <li>If asked, allow <strong>Install unknown apps</strong> for Chrome/Files.</li>
            <li>Tap <strong>Install</strong>, then <strong>Open</strong>.</li>
          </ol>
          <p className="muted" style={{ marginBottom: 0, marginTop: 12 }}>
            Browsers cannot auto-install apps silently. One tap on Install after download is required by Android.
          </p>
        </div>

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          <Link to="/welcome">Back to welcome</Link>
          {' · '}
          <Link to="/login">Login on web</Link>
        </p>
      </div>
    </div>
  );
}
