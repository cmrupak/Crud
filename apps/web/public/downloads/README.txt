# App updates (no APK required in git)

The installed Android app checks:
  https://rupak26.netlify.app/app-update.json

After each EAS build:
1. Open the Expo build page and copy the APK download URL
2. Update app-update.json:
   - bump "version" and "versionCode" (must match apps/mobile/app.json)
   - set "apkUrl" to the Expo APK URL (or any public APK link)
3. Commit + push only that JSON (tiny file)
4. Users tap Profile → Check for updates

Optional helper:
  node scripts/set-app-update.mjs --version 1.0.1 --code 2 --url "https://expo.dev/..."
