const { withAndroidManifest } = require('@expo/config-plugins');

// react-native-android-notification-listener porta con sé un suo
// AndroidManifest.xml che dichiara android:allowBackup="false", in
// conflitto con quello dell'app (true di default per Expo). Il manifest
// merger di Android si rifiuta di scegliere da solo: serve dire
// esplicitamente "vince il valore dell'app" con tools:replace.
module.exports = function withAndroidManifestFixes(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    if (application) {
      const existing = application.$['tools:replace'];
      const additions = ['android:allowBackup'];
      const merged = existing ? Array.from(new Set([...existing.split(','), ...additions])) : additions;
      application.$['tools:replace'] = merged.join(',');
    }

    return config;
  });
};
