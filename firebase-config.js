export const firebaseConfig = {
  apiKey: "AIzaSyDFGejarmyxZLLAvHzJDtHcZCafqxKZrl0",
  authDomain: "hwaiting-app.firebaseapp.com",
  projectId: "hwaiting-app",
  storageBucket: "hwaiting-app.firebasestorage.app",
  messagingSenderId: "836771722326",
  appId: "1:836771722326:web:9035567474ab2785adf7f7"
};

export const ADMIN_EMAIL = "lts7364@gmail.com";

// 현재 GitHub Pages에 공개된 버전의 안전한 대체값입니다.
// Firestore appReleases/current 문서가 없거나 통신에 실패할 때만 사용합니다.
const FALLBACK_VERSION = {
  versionName: "1.0.170-native",
  versionCode: 171
};
const FALLBACK_APK_FILE = "files/hwaiting-v1-0-170-code171.apk";

// 기존 download.html이 그대로 import해서 사용할 수 있도록 live binding으로 유지합니다.
export let APP_VERSION = { ...FALLBACK_VERSION };
export let APK_FILE = FALLBACK_APK_FILE;
export let CURRENT_RELEASE = {
  ...FALLBACK_VERSION,
  apkFile: FALLBACK_APK_FILE,
  changelog: [],
  suspended: false,
  status: "public"
};

// 중요: 기존 admin.html/download.html이 initializeApp()을 먼저 실행하도록
// 다음 작업 틱에서 업데이트 관리 모듈을 시작합니다. 중복 Firebase 초기화를 막습니다.
// 다른 홈페이지 화면에서는 불필요한 버전 조회를 하지 않습니다.
const RELEASE_MANAGER_PAGE = /\/(admin|download)\.html(?:$|[?#])/.test(`${location.pathname}${location.search}${location.hash}`);
if (RELEASE_MANAGER_PAGE) setTimeout(async () => {
  try {
    const manager = await import("./release-manager.js?v=117");
    CURRENT_RELEASE = await manager.resolveCurrentRelease({
      firebaseConfig,
      fallbackVersion: FALLBACK_VERSION,
      fallbackFile: FALLBACK_APK_FILE
    });

    APP_VERSION = {
      versionName: CURRENT_RELEASE.versionName || FALLBACK_VERSION.versionName,
      versionCode: Number(CURRENT_RELEASE.versionCode || FALLBACK_VERSION.versionCode)
    };
    APK_FILE = CURRENT_RELEASE.suspended
      ? ""
      : (CURRENT_RELEASE.apkFile || FALLBACK_APK_FILE);

    await manager.initReleaseManager({
      firebaseConfig,
      adminEmail: ADMIN_EMAIL,
      currentRelease: CURRENT_RELEASE,
      fallbackVersion: FALLBACK_VERSION,
      fallbackFile: FALLBACK_APK_FILE
    });
  } catch (error) {
    console.info("[화이팅] 업데이트 관리 모듈을 불러오지 못해 기존 방식으로 동작합니다.", error);
  }
}, 0);
