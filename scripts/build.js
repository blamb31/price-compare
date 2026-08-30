const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../');
const packageJsonPath = path.join(rootDir, 'package.json');
const gradlePath = path.join(rootDir, 'android/app/build.gradle');

console.log('--- STARTING ANDROID BUILD PROCESS ---');

function detectJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  const paths = [];
  if (process.platform === 'darwin') {
    paths.push(
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
      '/Applications/Android Studio.app/Contents/jre/Contents/Home'
    );
  } else if (process.platform === 'win32') {
    paths.push(
      'C:\\Program Files\\Android\\Android Studio\\jbr',
      'C:\\Program Files\\Android\\Android Studio\\jre'
    );
  } else if (process.platform === 'linux') {
    paths.push(
      '/opt/android-studio/jbr',
      '/opt/android-studio/jre',
      '/usr/local/android-studio/jbr',
      '/usr/local/android-studio/jre'
    );
  }
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const javaHome = detectJavaHome();
if (javaHome) {
  process.env.JAVA_HOME = javaHome;
  console.log(`Setting JAVA_HOME to: ${javaHome}`);
} else {
  console.warn('Warning: Could not automatically locate Android Studio JDK. Relying on default system path.');
}

try {
  // 1. Read and bump package.json version
  console.log('Reading package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version;
  const versionParts = oldVersion.split('.').map(Number);
  if (versionParts.length !== 3 || versionParts.some(isNaN)) {
    throw new Error(`Invalid version format in package.json: ${oldVersion}`);
  }
  versionParts[2] += 1; // Bump patch version
  const newVersion = versionParts.join('.');
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log(`Package.json version bumped: ${oldVersion} -> ${newVersion}`);

  // 2. Setup dynamic environment variables for Android build
  // Calculate versionCode based on newVersion (e.g. "0.2.16" -> major*10000 + minor*100 + patch = 216)
  const versionCode = versionParts[0] * 10000 + versionParts[1] * 100 + versionParts[2];

  process.env.VERSION_CODE = versionCode.toString();
  process.env.VERSION_NAME = newVersion;
  console.log(`Configured build environment: VERSION_CODE=${process.env.VERSION_CODE}, VERSION_NAME=${process.env.VERSION_NAME}`);

  // 3. Build Angular web assets
  console.log('Building Angular web assets (npm run build)...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

  // 4. Sync Capacitor
  console.log('Syncing Capacitor android platform (npx cap sync android)...');
  execSync('npx cap sync android', { cwd: rootDir, stdio: 'inherit' });

  // 5. Build native Android app (APK and AAB)
  console.log('Compiling native Android APK (gradlew assembleDebug)...');
  const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  execSync(`${gradlewCmd} assembleDebug`, { cwd: path.join(rootDir, 'android'), stdio: 'inherit' });

  console.log('Compiling native Android AAB (gradlew bundleRelease)...');
  execSync(`${gradlewCmd} bundleRelease`, { cwd: path.join(rootDir, 'android'), stdio: 'inherit' });

  // 6. Sign the release AAB bundle if keystore exists
  const keystorePath = path.join(rootDir, 'android/app/release.keystore');
  const aabPath = path.join(rootDir, 'android/app/build/outputs/bundle/release/app-release.aab');
  if (fs.existsSync(keystorePath)) {
    console.log('Signing Android App Bundle (AAB)...');
    const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD || '159b8cc961f63339';
    const keystoreAlias = 'price-compare-key';
    try {
      execSync(`jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "${keystorePath}" -storepass "${keystorePassword}" "${aabPath}" "${keystoreAlias}"`, { stdio: 'inherit' });
      console.log('AAB signed successfully.');
    } catch (signErr) {
      console.warn('Warning: Failed to sign AAB with jarsigner:', signErr.message);
    }
  } else {
    console.warn(`Warning: Keystore not found at ${keystorePath}. Skipping signing step.`);
  }

  console.log('\n--- ANDROID BUILD SUCCESSFUL ---');
  const apkPath = path.join(rootDir, 'android/app/build/outputs/apk/debug/app-debug.apk');

  if (fs.existsSync(apkPath)) {
    console.log(`\nBuilt APK is available at:\n${apkPath}`);
  } else {
    console.log('\nAPK output file could not be found.');
  }
  if (fs.existsSync(aabPath)) {
    console.log(`\nBuilt AAB is available at:\n${aabPath}`);
  } else {
    console.log('\nAAB output file could not be found.');
  }

} catch (err) {
  console.error('\nBuild failed with error:', err.message);
  process.exit(1);
}
