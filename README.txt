# 화이팅 Netlify 자동승인 다운로드 관리 사이트

## 운영 방식
- 회원가입하면 자동 승인됩니다.
- 다운로드 버튼을 누르면 Firestore downloadLogs에 기록이 저장됩니다.
- 관리자는 admin.html에서 사용자 차단/차단해제와 다운로드 기록 확인을 할 수 있습니다.
- APK는 Netlify files 폴더에 긴 파일명으로 둡니다.
- 완전한 비공개 APK 보안은 아니고, 누가 다운로드 버튼을 눌렀는지 확인하는 목적입니다.

## 관리자 계정
관리자 이메일:
lts7364@gmail.com

이 이메일로 회원가입하면 role: admin으로 생성됩니다.

## APK 넣기
Android Studio에서 만든 APK를 아래 파일명으로 바꿔서 넣으세요.

files/hwaiting-v1-0-91-code92-k7p4x9.apk

즉 폴더 구조:
hwaiting-netlify-autoapprove-site/
└─ files/
   └─ hwaiting-v1-0-91-code92-k7p4x9.apk

현재 ZIP에는 실제 APK가 포함되어 있지 않습니다.
files/PUT_APK_HERE.txt를 지우고 APK를 넣으세요.

## Firestore Rules
firestore-rules.txt 내용을 Firebase Console > Firestore Database > Rules에 붙여넣으면 됩니다.
처음 테스트 중에는 테스트 모드로 해도 되지만, 운영할 때는 rules 적용을 추천합니다.

## Netlify 업로드
이 폴더 전체를 ZIP으로 압축해서 hwaiting-app Netlify 사이트에 업로드하세요.


## 비공식 앱 안내 문구
index.html과 download.html에 아래 취지의 안내 문구가 포함되어 있습니다.

- 개인 편의를 위한 비공식 앱
- 회사 또는 특정 기관의 공식 앱 아님
- 근무 정보는 참고용이며 공식 근무표/공지 우선
- 다운로드 및 사용 기록은 앱 관리 목적으로 저장
- 무단 재배포 권장하지 않음


## 기능 요청 / 오류 신고
request.html이 추가되었습니다.

- 로그인한 사용자만 요청 작성 가능
- 요청 항목: 분류, 제목, 내용
- 작성자 이름/부서/이메일/시간 자동 저장
- 사용자는 자기 요청 목록과 상태 확인 가능
- 관리자는 admin.html에서 요청 목록 확인 가능
- 관리자는 요청 상태를 접수/검토중/적용완료/보류/거절로 변경 가능

Firestore 컬렉션:
requests


## v95 익명 요청함 변경
request.html은 로그인 없이 작성 가능한 익명 요청함으로 변경되었습니다.

- 작성자 이름/부서/이메일 저장 안 함
- 사용자는 제목/분류/내용만 입력
- Firestore requests 컬렉션에 anonymous: true로 저장
- 관리자만 admin.html에서 요청 확인/상태 변경 가능
- firestore-rules.txt는 requests create를 공개 허용하도록 변경됨

주의:
익명 요청함은 편하게 의견을 받기 좋지만, 로그인 제한이 없으므로 장난글이 들어올 수 있습니다.


## v97 가입자 익명 요청함
request.html을 다시 로그인 필요 방식으로 변경했습니다.

- 로그인한 사용자만 요청 작성 가능
- 차단된 사용자는 요청 작성 불가
- 관리자 화면에는 작성자 이름/부서/이메일 표시 안 함
- 요청 문서에는 내부 확인용 uid만 저장
- 사용자는 자기 요청 목록과 상태를 request.html에서 확인 가능
- 관리자는 admin.html에서 전체 요청 확인 및 상태 변경 가능

Firestore Rules:
firestore-rules.txt 내용을 Firestore Rules에 적용해야 권한이 정상 동작합니다.


## v98 다운로드 화면 요청함 버튼
download.html에 가입자 익명 요청함 버튼을 추가했습니다.

로그인 후 다운로드 화면으로 이동해도 request.html로 바로 갈 수 있습니다.


## v99 관리자 버튼 숨김
일반 사용자 화면(index.html, download.html, request.html)에서 관리자 버튼을 제거했습니다.

관리자 페이지 파일은 유지됩니다.
직접 주소로 접속하세요.

https://lts7364.github.io/hwaiting-app/admin.html


## v100 다운로드 화면 요청함 중복 제거
download.html에서 기능 요청 / 오류 신고 별도 카드를 제거했습니다.

로그인 후 다운로드 화면에서는 사용자 정보 카드 안의 '가입자 익명 요청함' 버튼 하나만 표시됩니다.


## v101 사용자 문구 정리
사용자 화면에서 다운로드 기록 관련 안내 문구를 제거했습니다.

삭제/정리:
- 다운로드 기록 저장 안내 문구 제거
- 이름/부서/이메일/다운로드 시간 기록 안내 문구 제거
- 기존 앱/패키지명 업데이트 설치 안내 문구 제거
- 운영방식 섹션 제거
- 업데이트 내역은 앱 기능 변경 내용만 표시
- 비공식 앱 안내는 짧게 유지
