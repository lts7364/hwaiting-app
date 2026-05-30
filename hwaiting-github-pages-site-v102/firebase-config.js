// Firebase / 화이팅 앱 공통 설정
export const firebaseConfig = {
  apiKey: "AIzaSyDFGejarmyxZLLAvHzJDtHcZCafqxKZrl0",
  authDomain: "hwaiting-app.firebaseapp.com",
  projectId: "hwaiting-app",
  storageBucket: "hwaiting-app.firebasestorage.app",
  messagingSenderId: "836771722326",
  appId: "1:836771722326:web:9035567474ab2785adf7f7"
};

export const ADMIN_EMAIL = "lts7364@gmail.com";

export const APP_VERSION = {
  versionName: "1.0.91-native",
  versionCode: 92
};

// APK는 Netlify에 두되, 뻔한 app-release.apk 대신 긴 파일명으로 둔다.
// download.html에서 로그인/기록 저장 후 이 파일을 열어준다.
export const APK_FILE = "files/hwaiting-v1-0-91-code92-k7p4x9.apk";
