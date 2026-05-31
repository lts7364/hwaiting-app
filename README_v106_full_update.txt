화이팅 GitHub Pages v106 전체 통합본

적용 내용:
- 홈페이지 화면 정리
- 로그인/회원가입 화면을 선택식으로 개선
- 다운로드 화면 정리
- 사용자 화면에서 관리자 버튼 숨김
- 사용설명서 guide.html 추가
- 설명서에서 계정 아이디가 들어간 긴 주소 제거
- 가입자 익명 요청함 유지
- 요청 상태가 적용완료/보류/거절일 때 작성자가 삭제 가능
- 접수/검토중 상태는 작성자 삭제 불가
- 관리자는 요청 상태 변경 및 삭제 가능
- 관리자 페이지 v103 권한/표시 수정 반영
- Firestore Rules v105 반영
- 사용자 화면에서 다운로드 기록/패키지명/운영방식 안내 문구 제거

배포:
GitHub 저장소 루트에 이 ZIP 안의 파일 전체를 업로드/덮어쓰기

주소:
https://lts7364.github.io/hwaiting-app/

관리자:
https://lts7364.github.io/hwaiting-app/admin.html

Firebase:
firestore-rules.txt 내용을 Firebase Console > Firestore Database > Rules에 붙여넣고 Publish
