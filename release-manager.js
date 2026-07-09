const SDK = "https://www.gstatic.com/firebasejs/10.12.5";

function normalizeRelease(data, fallbackVersion, fallbackFile) {
  const source = data && typeof data === "object" ? data : {};
  const code = Number(source.versionCode ?? fallbackVersion?.versionCode ?? 0);
  const name = String(source.versionName ?? fallbackVersion?.versionName ?? "").trim();
  const apkFile = String(source.apkFile ?? source.apkUrl ?? fallbackFile ?? "").trim();
  const changelog = Array.isArray(source.changelog)
    ? source.changelog.map(value => String(value).trim()).filter(Boolean)
    : String(source.changelog ?? "")
        .split(/\r?\n/)
        .map(value => value.trim())
        .filter(Boolean);

  return {
    versionName: name,
    versionCode: Number.isFinite(code) ? code : 0,
    apkFile,
    changelog,
    downloadPageUrl: String(source.downloadPageUrl || "download.html"),
    updatedAt: String(source.updatedAt || ""),
    suspended: source.suspended === true,
    status: String(source.status || "public")
  };
}

function firestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if (value.arrayValue) return (value.arrayValue.values || []).map(firestoreValue);
  if (value.mapValue) {
    const result = {};
    Object.entries(value.mapValue.fields || {}).forEach(([key, item]) => {
      result[key] = firestoreValue(item);
    });
    return result;
  }
  return null;
}

export async function resolveCurrentRelease({ firebaseConfig, fallbackVersion, fallbackFile }) {
  const fallback = normalizeRelease(null, fallbackVersion, fallbackFile);
  const projectId = firebaseConfig?.projectId;
  const apiKey = firebaseConfig?.apiKey;
  if (!projectId || !apiKey) return fallback;

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`
    + `/databases/(default)/documents/appReleases/current?key=${encodeURIComponent(apiKey)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });
    clearTimeout(timer);

    if (response.status === 404) return fallback;
    if (!response.ok) throw new Error(`Firestore HTTP ${response.status}`);

    const json = await response.json();
    const plain = {};
    Object.entries(json.fields || {}).forEach(([key, value]) => {
      plain[key] = firestoreValue(value);
    });
    return normalizeRelease(plain, fallbackVersion, fallbackFile);
  } catch (error) {
    console.info("[화이팅] 공개 버전을 불러오지 못해 기존 버전을 사용합니다.", error?.message || error);
    return fallback;
  }
}

function waitForDom() {
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", resolve, { once: true });
  });
}

function safeRelativeApk(value) {
  const raw = String(value || "").trim().replace(/^\/+/, "");
  if (!raw || raw.includes("..") || !/^files\/[A-Za-z0-9._-]+\.apk$/i.test(raw)) {
    throw new Error("APK 경로는 files/파일명.apk 형식으로 입력해주세요.");
  }
  return raw;
}

function releaseLabel(release) {
  if (!release?.versionCode) return "등록된 버전 없음";
  const state = release.suspended ? "공개 중단" : "공개 중";
  return `${release.versionName || "-"} / code${release.versionCode} · ${state}`;
}

function injectStyles() {
  if (document.getElementById("hwaitingReleaseManagerStyle")) return;
  const style = document.createElement("style");
  style.id = "hwaitingReleaseManagerStyle";
  style.textContent = `
    #releaseManagerCard{margin-top:14px;background:#fffaf1;border:2px solid #d7b37a;border-radius:22px;padding:18px;box-shadow:0 8px 20px rgba(50,45,35,.05)}
    #releaseManagerCard h2{margin:0 0 6px;font-size:20px}
    #releaseManagerCard .rm-help{margin:0 0 14px;color:#6d756b;font-size:13px;line-height:1.6}
    #releaseManagerCard .rm-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
    #releaseManagerCard .rm-summary{background:#fff;border:1px solid #e5dac8;border-radius:16px;padding:12px;line-height:1.55;min-width:0}
    #releaseManagerCard .rm-summary b{display:block;font-size:13px;margin-bottom:4px}
    #releaseManagerCard .rm-summary strong{display:block;font-size:16px;overflow-wrap:anywhere}
    #releaseManagerCard .rm-summary span{display:block;margin-top:4px;color:#6d756b;font-size:11px;overflow-wrap:anywhere}
    #releaseManagerCard .rm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    #releaseManagerCard label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:900;color:#5f5246}
    #releaseManagerCard input,#releaseManagerCard textarea{width:100%;border:1px solid #dacdbb;border-radius:14px;background:#fff;padding:11px 12px;font:inherit;color:#23352a;box-sizing:border-box}
    #releaseManagerCard textarea{min-height:105px;resize:vertical;line-height:1.5}
    #releaseManagerCard .rm-wide{grid-column:1/-1}
    #releaseManagerCard .rm-status{margin:12px 0 0;padding:11px 12px;border-radius:14px;background:#f4ead9;font-size:13px;line-height:1.55;white-space:pre-wrap}
    #releaseManagerCard .rm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    #releaseManagerCard .rm-btn{border:1px solid transparent;border-radius:999px;min-height:40px;padding:0 13px;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer}
    #releaseManagerCard .rm-primary{background:#3b7f47;color:#fff}
    #releaseManagerCard .rm-accent{background:#c98a42;color:#fff}
    #releaseManagerCard .rm-secondary{background:#fff;color:#23352a;border-color:#ded3c2}
    #releaseManagerCard .rm-danger{background:#d65d65;color:#fff}
    #releaseManagerCard .rm-btn:disabled{opacity:.5;cursor:not-allowed}
    #releaseManagerCard details{margin-top:14px;border-top:1px solid #e5dac8;padding-top:12px}
    #releaseManagerCard summary{cursor:pointer;font-weight:900;font-size:13px}
    #releaseManagerCard .rm-history{margin-top:9px;font-size:12px;line-height:1.75;color:#66584c}
    #releaseManagerCard .rm-note{margin-top:12px;padding:11px;border-radius:14px;background:#fff4d7;border:1px solid #e8ca71;font-size:12px;line-height:1.55}
    @media(max-width:620px){
      #releaseManagerCard .rm-summary-grid,#releaseManagerCard .rm-grid{grid-template-columns:1fr}
      #releaseManagerCard .rm-wide{grid-column:1}
      #releaseManagerCard .rm-btn{flex:1 1 calc(50% - 8px)}
    }
  `;
  document.head.appendChild(style);
}

async function ensureExistingFirebaseApp(firebaseConfig) {
  const firebaseAppApi = await import(`${SDK}/firebase-app.js`);
  // 기존 페이지가 먼저 initializeApp()을 수행하도록 잠시 기다립니다.
  for (let i = 0; i < 40; i += 1) {
    if (firebaseAppApi.getApps().length) return firebaseAppApi.getApp();
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  // 기존 페이지 초기화가 실패했을 때만 마지막 안전장치로 초기화합니다.
  return firebaseAppApi.initializeApp(firebaseConfig);
}

async function verifyApk(apkFile) {
  const safe = safeRelativeApk(apkFile);
  const url = new URL(safe, location.href).href;
  let response = await fetch(url, { method: "HEAD", cache: "no-store" });
  if (response.status === 405) {
    response = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, cache: "no-store" });
  }
  if (!response.ok && response.status !== 206) {
    throw new Error(`APK 파일을 찾지 못했습니다. HTTP ${response.status}`);
  }
  return { safe, url };
}

async function initDownloadPage(currentRelease) {
  await waitForDom();
  const button = document.getElementById("downloadBtn");
  const status = document.getElementById("downloadStatus");
  if (!button) return;

  if (currentRelease.suspended || !currentRelease.apkFile) {
    button.style.display = "none";
    button.disabled = true;
    if (status) status.textContent = "관리자가 현재 버전 다운로드를 잠시 중단했습니다.";
    return;
  }

  // 기존 페이지가 사용하는 live binding이 갱신된 뒤 보조 문구만 최신 상태로 맞춥니다.
  if (status && !status.textContent.trim()) {
    status.textContent = `최신 버전 ${currentRelease.versionName}`;
  }
}

async function initAdminPage(options) {
  await waitForDom();
  injectStyles();

  const [authApi, storeApi] = await Promise.all([
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`)
  ]);
  const app = await ensureExistingFirebaseApp(options.firebaseConfig);
  const auth = authApi.getAuth(app);
  const db = storeApi.getFirestore(app);

  const card = document.createElement("section");
  card.id = "releaseManagerCard";
  card.style.display = "none";
  card.innerHTML = `
    <h2>앱 업데이트 관리</h2>
    <p class="rm-help">새 APK를 먼저 올려 관리자만 시험한 뒤, <b>업데이트 적용</b>을 눌렀을 때 공개합니다.</p>
    <div class="rm-summary-grid">
      <div class="rm-summary"><b>현재 공개 버전</b><strong id="rmCurrentLabel">확인 중...</strong><span id="rmCurrentFile"></span></div>
      <div class="rm-summary"><b>다음 준비 버전</b><strong id="rmStagedLabel">등록 안 됨</strong><span id="rmStagedFile"></span></div>
    </div>
    <div class="rm-grid">
      <label>다음 versionName<input id="rmVersionName" placeholder="1.0.166-native"></label>
      <label>다음 versionCode<input id="rmVersionCode" type="number" min="1" placeholder="167"></label>
      <label class="rm-wide">APK 파일 경로<input id="rmApkFile" placeholder="files/hwaiting-v1-0-166-code167.apk"></label>
      <label class="rm-wide">변경내역<textarea id="rmChangelog" placeholder="한 줄에 한 항목씩 입력"></textarea></label>
    </div>
    <div id="rmStatus" class="rm-status">관리자 권한 확인 중...</div>
    <div class="rm-actions">
      <button class="rm-btn rm-secondary" id="rmInitCurrent" type="button">현재 버전 초기등록</button>
      <button class="rm-btn rm-secondary" id="rmSave" type="button">다음 버전 저장</button>
      <button class="rm-btn rm-accent" id="rmTest" type="button">관리자 테스트 다운로드</button>
      <button class="rm-btn rm-primary" id="rmPublish" type="button">업데이트 적용</button>
      <button class="rm-btn rm-secondary" id="rmDelete" type="button">준비 버전 삭제</button>
      <button class="rm-btn rm-danger" id="rmSuspend" type="button">현재 공개 중단</button>
      <button class="rm-btn rm-secondary" id="rmResume" type="button">현재 공개 재개</button>
      <button class="rm-btn rm-secondary" id="rmRollback" type="button">이전 버전 복원</button>
      <button class="rm-btn rm-secondary" id="rmCopyJson" type="button">version.json 내용 복사</button>
    </div>
    <div class="rm-note">처음 한 번은 기존 앱 사용자도 새 방식을 지원하는 버전으로 넘어와야 합니다. 그 첫 공개 때만 복사한 version.json 내용을 GitHub에 수동 적용하세요.</div>
    <details>
      <summary>최근 업데이트 기록 보기</summary>
      <div id="rmHistory" class="rm-history">확인 중...</div>
    </details>
  `;

  const usersCard = document.getElementById("usersCard");
  const adminStatus = document.getElementById("adminStatus");
  const statusCard = adminStatus?.closest("section, .card");
  const main = document.querySelector("main") || document.body;
  if (usersCard?.parentNode) usersCard.parentNode.insertBefore(card, usersCard);
  else if (statusCard?.parentNode) statusCard.parentNode.insertBefore(card, statusCard.nextSibling);
  else main.appendChild(card);

  const el = id => card.querySelector(`#${id}`);
  const showStatus = (message, error = false) => {
    const target = el("rmStatus");
    target.textContent = message;
    target.style.background = error ? "#ffe0e4" : "#f4ead9";
    target.style.color = error ? "#9b3e4b" : "#23352a";
  };

  const currentRef = storeApi.doc(db, "appReleases", "current");
  const stagedRef = storeApi.doc(db, "appReleases", "staged");
  const historyRef = storeApi.collection(db, "appReleaseHistory");
  let current = options.currentRelease;
  let staged = null;
  let history = [];

  function formRelease() {
    return normalizeRelease({
      versionName: el("rmVersionName").value,
      versionCode: Number(el("rmVersionCode").value),
      apkFile: el("rmApkFile").value,
      changelog: el("rmChangelog").value,
      downloadPageUrl: "https://lts7364.github.io/hwaiting-app/download.html",
      status: "staged"
    }, null, "");
  }

  function fillStaged(data) {
    staged = data;
    el("rmVersionName").value = data?.versionName || "";
    el("rmVersionCode").value = data?.versionCode || "";
    el("rmApkFile").value = data?.apkFile || "";
    el("rmChangelog").value = (data?.changelog || []).join("\n");
  }

  function render() {
    el("rmCurrentLabel").textContent = releaseLabel(current);
    el("rmCurrentFile").textContent = current?.apkFile || "";
    el("rmStagedLabel").textContent = staged?.versionCode
      ? `${staged.versionName} / code${staged.versionCode} · 준비 중`
      : "등록 안 됨";
    el("rmStagedFile").textContent = staged?.apkFile || "";

    if (!history.length) {
      el("rmHistory").textContent = "업데이트 기록이 아직 없습니다.";
    } else {
      el("rmHistory").innerHTML = history.slice(0, 15).map(item => {
        const labels = {
          publish: "공개",
          published: "이전 공개본 보관",
          suspend: "중단",
          resume: "재개",
          rollback: "복원"
        };
        return `• ${labels[item.event] || item.event || "기록"} · ${item.versionName || "-"} / code${item.versionCode || "-"} · ${item.recordedAtText || ""}`;
      }).join("<br>");
    }
  }

  async function loadAll() {
    const [currentSnap, stagedSnap, historySnap] = await Promise.all([
      storeApi.getDoc(currentRef),
      storeApi.getDoc(stagedRef),
      storeApi.getDocs(historyRef)
    ]);

    current = currentSnap.exists()
      ? normalizeRelease(currentSnap.data(), options.fallbackVersion, options.fallbackFile)
      : normalizeRelease(null, options.fallbackVersion, options.fallbackFile);
    if (stagedSnap.exists()) fillStaged(normalizeRelease(stagedSnap.data(), null, ""));
    else fillStaged(null);

    history = historySnap.docs
      .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
      .sort((a, b) => Number(b.recordedAtMillis || 0) - Number(a.recordedAtMillis || 0));
    render();
  }

  async function addHistory(release, event) {
    const now = new Date();
    await storeApi.addDoc(historyRef, {
      ...release,
      event,
      recordedAt: storeApi.serverTimestamp(),
      recordedAtMillis: Date.now(),
      recordedAtText: now.toLocaleString("ko-KR")
    });
  }

  el("rmInitCurrent").addEventListener("click", async () => {
    try {
      const existing = await storeApi.getDoc(currentRef);
      if (existing.exists() && !confirm("현재 공개 버전 문서가 이미 있습니다. 기존 내용으로 다시 저장할까요?")) return;
      const initial = {
        ...normalizeRelease(null, options.fallbackVersion, options.fallbackFile),
        status: "public",
        suspended: false,
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      await storeApi.setDoc(currentRef, initial);
      showStatus("현재 공개 버전을 Firestore에 초기 등록했습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmSave").addEventListener("click", async () => {
    try {
      const next = formRelease();
      if (!next.versionName || !next.versionCode) throw new Error("versionName과 versionCode를 입력해주세요.");
      if (next.versionCode <= Number(current?.versionCode || 0)) throw new Error("다음 versionCode는 현재 공개 버전보다 커야 합니다.");
      next.apkFile = safeRelativeApk(next.apkFile);
      await storeApi.setDoc(stagedRef, {
        ...next,
        status: "staged",
        updatedAt: storeApi.serverTimestamp()
      });
      showStatus("다음 버전을 준비 상태로 저장했습니다. 아직 일반 사용자에게는 공개되지 않습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmTest").addEventListener("click", async () => {
    try {
      const next = staged || formRelease();
      if (!next.versionCode) throw new Error("먼저 다음 버전을 저장해주세요.");
      const { url } = await verifyApk(next.apkFile);
      showStatus("APK 파일을 확인했습니다. 관리자 테스트 다운로드를 시작합니다.");
      window.location.href = url;
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmPublish").addEventListener("click", async () => {
    try {
      const stagedSnap = await storeApi.getDoc(stagedRef);
      if (!stagedSnap.exists()) throw new Error("먼저 다음 버전을 저장해주세요.");
      const next = normalizeRelease(stagedSnap.data(), null, "");
      if (next.versionCode <= Number(current?.versionCode || 0)) throw new Error("다음 versionCode는 현재 공개 버전보다 커야 합니다.");
      await verifyApk(next.apkFile);
      if (!confirm(`${next.versionName} / code${next.versionCode}를 일반 사용자에게 공개할까요?`)) return;

      if (current?.versionCode) await addHistory(current, "published");
      const publicRelease = {
        ...next,
        status: "public",
        suspended: false,
        updatedAt: new Date().toISOString().slice(0, 10),
        publishedAt: storeApi.serverTimestamp()
      };
      await storeApi.setDoc(currentRef, publicRelease);
      await addHistory(publicRelease, "publish");
      await storeApi.deleteDoc(stagedRef);
      showStatus("업데이트 적용 완료: 새 방식을 지원하는 앱과 홈페이지에 새 버전이 공개됐습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmDelete").addEventListener("click", async () => {
    try {
      if (!confirm("준비 중인 버전 정보만 삭제할까요? APK 파일은 삭제되지 않습니다.")) return;
      await storeApi.deleteDoc(stagedRef);
      showStatus("준비 버전 정보를 삭제했습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmSuspend").addEventListener("click", async () => {
    try {
      if (!confirm("현재 공개 다운로드와 새 방식의 앱 업데이트 감지를 중단할까요?")) return;
      await storeApi.setDoc(currentRef, {
        suspended: true,
        status: "suspended",
        updatedAt: new Date().toISOString().slice(0, 10)
      }, { merge: true });
      await addHistory(current, "suspend");
      showStatus("현재 공개를 중단했습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmResume").addEventListener("click", async () => {
    try {
      await storeApi.setDoc(currentRef, {
        suspended: false,
        status: "public",
        updatedAt: new Date().toISOString().slice(0, 10)
      }, { merge: true });
      await addHistory(current, "resume");
      showStatus("현재 버전 공개를 다시 시작했습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmRollback").addEventListener("click", async () => {
    try {
      const candidates = history
        .filter(item => Number(item.versionCode || 0) < Number(current?.versionCode || 0) && item.apkFile)
        .sort((a, b) => Number(b.versionCode || 0) - Number(a.versionCode || 0));
      if (!candidates.length) throw new Error("복원할 이전 공개 버전 기록이 없습니다.");
      const previous = normalizeRelease(candidates[0], null, "");
      await verifyApk(previous.apkFile);
      if (!confirm(`${previous.versionName} / code${previous.versionCode}로 복원할까요?`)) return;
      const restored = {
        ...previous,
        status: "public",
        suspended: false,
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      await storeApi.setDoc(currentRef, restored);
      await addHistory(restored, "rollback");
      showStatus("이전 공개 버전으로 복원했습니다.");
      await loadAll();
    } catch (error) {
      showStatus(error.message || String(error), true);
    }
  });

  el("rmCopyJson").addEventListener("click", async () => {
    try {
      const value = {
        versionName: current.versionName,
        versionCode: Number(current.versionCode),
        downloadMode: "login-log-auto-approve",
        downloadPageUrl: "https://lts7364.github.io/hwaiting-app/download.html",
        apkUrl: "https://lts7364.github.io/hwaiting-app/download.html",
        forceUpdate: false,
        updatedAt: current.updatedAt || new Date().toISOString().slice(0, 10),
        changelog: current.changelog || []
      };
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      showStatus("현재 공개 버전의 version.json 내용을 클립보드에 복사했습니다.");
    } catch (error) {
      showStatus(`복사 실패: ${error.message || error}`, true);
    }
  });

  authApi.onAuthStateChanged(auth, async user => {
    const isAdmin = user && String(user.email || "").toLowerCase() === String(options.adminEmail || "").toLowerCase();
    card.style.display = isAdmin ? "block" : "none";
    if (!isAdmin) return;
    showStatus("관리자 전용 업데이트 관리 기능을 사용할 수 있습니다.");
    try {
      await loadAll();
    } catch (error) {
      showStatus(`업데이트 정보 확인 실패: ${error.message || error}`, true);
    }
  });
}

export async function initReleaseManager(options) {
  const path = `${location.pathname}${location.search}${location.hash}`;
  if (/download\.html(?:$|[?#])/.test(path)) {
    await initDownloadPage(options.currentRelease);
  }
  if (/admin\.html(?:$|[?#])/.test(path)) {
    await initAdminPage(options);
    try {
      const manager = await import("./admin-user-download-manager.js?v=116");
      await manager.initAdminUserDownloadManager(options);
    } catch (error) {
      console.info("[화이팅] 사용자·다운로드 통합 관리 화면을 불러오지 못했습니다.", error);
    }
  }
}
