const SDK = "https://www.gstatic.com/firebasejs/10.12.5";

function waitForDom() {
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", resolve, { once: true });
  });
}

async function existingFirebaseApp(firebaseConfig) {
  const appApi = await import(`${SDK}/firebase-app.js`);
  for (let index = 0; index < 50; index += 1) {
    if (appApi.getApps().length) return appApi.getApp();
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return appApi.initializeApp(firebaseConfig);
}

function injectStyles() {
  if (document.getElementById("hwaitingUserDownloadManagerStyle")) return;
  const style = document.createElement("style");
  style.id = "hwaitingUserDownloadManagerStyle";
  style.textContent = `
    /* 기존 사용자 목록/다운로드 기록 카드는 통합 카드와 중복되므로 항상 숨깁니다.
       기존 admin.html 스크립트가 나중에 display:block을 다시 넣어도 !important로 표시되지 않습니다. */
    #usersCard,#logsCard{display:none !important}
    #userDownloadManagerCard{margin-top:14px}
    #userDownloadManagerCard .udm-help{margin:0 0 13px;color:#6d756b;font-size:13px;line-height:1.6}
    #userDownloadManagerCard .udm-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;margin-bottom:10px}
    #userDownloadManagerCard .udm-search{width:100%;min-height:42px;padding:0 13px;border:1px solid #d9cbb8;border-radius:14px;background:#fff;font:inherit;box-sizing:border-box}
    #userDownloadManagerCard .udm-filter{min-height:42px;padding:0 12px;border:1px solid #d9cbb8;border-radius:14px;background:#fff;font:inherit;color:#23352a}
    #userDownloadManagerCard .udm-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}
    #userDownloadManagerCard .udm-summary{padding:10px 12px;border-radius:14px;background:#f4ead9;color:#5f5246;font-size:12px;line-height:1.55;margin-bottom:10px}
    #userDownloadManagerCard .udm-list{display:grid;gap:9px}
    #userDownloadManagerCard .udm-user{border:1px solid #e1d3bf;border-radius:17px;background:#fffaf1;overflow:hidden}
    #userDownloadManagerCard .udm-user[open]{box-shadow:0 7px 16px rgba(50,45,35,.05)}
    #userDownloadManagerCard .udm-user summary{list-style:none;cursor:pointer;padding:13px 14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
    #userDownloadManagerCard .udm-user summary::-webkit-details-marker{display:none}
    #userDownloadManagerCard .udm-user summary::after{content:"▼";display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#ead9bc;color:#735d43;font-size:12px;font-weight:900;transition:transform .18s ease}
    #userDownloadManagerCard .udm-user[open] summary::after{transform:rotate(180deg)}
    #userDownloadManagerCard .udm-title{font-weight:900;font-size:15px;line-height:1.4;overflow-wrap:anywhere}
    #userDownloadManagerCard .udm-meta{margin-top:3px;color:#6d756b;font-size:11px;line-height:1.5;overflow-wrap:anywhere}
    #userDownloadManagerCard .udm-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
    #userDownloadManagerCard .udm-badge{display:inline-flex;align-items:center;min-height:23px;padding:0 8px;border-radius:999px;background:#eee3d1;color:#645545;font-size:10px;font-weight:900}
    #userDownloadManagerCard .udm-badge.blocked{background:#ffe0e4;color:#9b3e4b}
    #userDownloadManagerCard .udm-badge.ok{background:#e1f2e4;color:#347044}
    #userDownloadManagerCard .udm-body{border-top:1px solid #eadfce;padding:12px 14px 14px;display:grid;gap:11px}
    #userDownloadManagerCard .udm-user-actions{display:flex;flex-wrap:wrap;gap:7px}
    #userDownloadManagerCard .udm-log-title{font-weight:900;font-size:12px;color:#5f5246}
    #userDownloadManagerCard .udm-logs{display:grid;gap:7px}
    #userDownloadManagerCard .udm-log{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px 11px;border:1px solid #e5dac8;border-radius:13px;background:#fff}
    #userDownloadManagerCard .udm-log-name{font-weight:900;font-size:12px;overflow-wrap:anywhere}
    #userDownloadManagerCard .udm-log-meta{margin-top:3px;color:#777;font-size:10px;line-height:1.45;overflow-wrap:anywhere}
    #userDownloadManagerCard .udm-empty{padding:14px;border:1px dashed #d8c7ae;border-radius:14px;color:#777;text-align:center;font-size:12px;background:#fff}
    #userDownloadManagerCard .udm-danger{background:#d65d65;color:#fff;border-color:#d65d65}
    @media(max-width:680px){
      #userDownloadManagerCard .udm-toolbar{grid-template-columns:1fr 1fr}
      #userDownloadManagerCard .udm-search{grid-column:1/-1}
      #userDownloadManagerCard .udm-toolbar .btn{width:100%}
      #userDownloadManagerCard .udm-log{grid-template-columns:1fr}
      #userDownloadManagerCard .udm-log .btn{justify-self:start}
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function valueMillis(value) {
  try {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (typeof value.seconds === "number" || typeof value._seconds === "number") {
      const seconds = typeof value.seconds === "number" ? value.seconds : value._seconds;
      const nanos = typeof value.nanoseconds === "number" ? value.nanoseconds : (value._nanoseconds || 0);
      return seconds * 1000 + Math.floor(nanos / 1000000);
    }
    if (typeof value === "number") return value < 1000000000000 ? value * 1000 : value;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (_) {
    return 0;
  }
}

function logTime(log) {
  return log?.downloadedAt || log?.createdAt || log?.timestamp || log?.time || log?.updatedAt
    || log?.downloadedAtMs || log?.clientTime || log?.downloadTime || null;
}

function stamp(value) {
  const millis = valueMillis(value);
  if (!millis) return "시간 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(millis));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function logSearchText(log) {
  return [
    log.fileName,
    log.apkFile,
    log.versionName,
    log.versionCode,
    log.name,
    log.department,
    log.email,
    log.uid
  ].map(value => String(value || "").toLowerCase()).join(" ");
}

function makeButton(text, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", handler);
  return button;
}

function userKey(user) {
  return String(user?.uid || user?.id || "").trim();
}

function linkedLogs(user, logs, consumed) {
  const uid = userKey(user);
  const email = normalizeEmail(user.email);
  const found = [];
  logs.forEach(log => {
    if (consumed.has(log.id)) return;
    const matchesUid = uid && String(log.uid || log.userId || "").trim() === uid;
    const matchesEmail = email && normalizeEmail(log.email) === email;
    if (matchesUid || (!matchesUid && matchesEmail)) {
      found.push(log);
      consumed.add(log.id);
    }
  });
  return found.sort((a, b) => valueMillis(logTime(b)) - valueMillis(logTime(a)));
}

export async function initAdminUserDownloadManager(options) {
  await waitForDom();
  injectStyles();

  const [authApi, storeApi] = await Promise.all([
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`)
  ]);
  const app = await existingFirebaseApp(options.firebaseConfig);
  const auth = authApi.getAuth(app);
  const db = storeApi.getFirestore(app);

  const oldUsersCard = document.getElementById("usersCard");
  const oldLogsCard = document.getElementById("logsCard");
  const requestsCard = document.getElementById("requestsCard");
  const main = document.querySelector("main") || document.body;

  let card = document.getElementById("userDownloadManagerCard");
  if (!card) {
    card = document.createElement("section");
    card.id = "userDownloadManagerCard";
    card.className = "card";
    card.style.display = "none";
    card.innerHTML = `
      <h2>사용자 및 다운로드 관리</h2>
      <p class="udm-help">사용자별 다운로드 기록을 한곳에서 확인하고, 필요한 기록만 한 건씩 삭제할 수 있습니다.</p>
      <div class="udm-toolbar">
        <input id="udmSearch" class="udm-search" type="search" placeholder="이름·부서·이메일·APK·버전 검색" autocomplete="off">
        <select id="udmFilter" class="udm-filter" aria-label="사용자 필터">
          <option value="all">전체 사용자</option>
          <option value="downloaded">다운로드 있음</option>
          <option value="none">다운로드 없음</option>
          <option value="blocked">차단 사용자</option>
        </select>
        <button id="udmRefresh" class="btn secondary mini" type="button">새로고침</button>
      </div>
      <div class="udm-actions">
        <button id="udmCollapse" class="btn secondary mini" type="button">전체 접기</button>
        <button id="udmExpand" class="btn secondary mini" type="button">전체 펼치기</button>
      </div>
      <div id="udmSummary" class="udm-summary">목록을 준비하고 있습니다.</div>
      <div id="udmList" class="udm-list"></div>
    `;
    if (requestsCard?.parentNode) requestsCard.parentNode.insertBefore(card, requestsCard);
    else if (oldUsersCard?.parentNode) oldUsersCard.parentNode.insertBefore(card, oldUsersCard);
    else main.appendChild(card);
  }

  const $ = id => card.querySelector(`#${id}`);
  let rows = [];
  let users = [];
  let logs = [];
  let loading = false;

  function hideOldCards() {
    // 인라인 스타일도 함께 고정합니다. CSS의 !important가 최종 안전장치입니다.
    if (oldUsersCard) {
      oldUsersCard.style.setProperty("display", "none", "important");
      oldUsersCard.setAttribute("aria-hidden", "true");
    }
    if (oldLogsCard) {
      oldLogsCard.style.setProperty("display", "none", "important");
      oldLogsCard.setAttribute("aria-hidden", "true");
    }
  }

  // 기존 admin.html 로직이 인증 완료 뒤 카드를 다시 표시하는 경우가 있어
  // 해당 두 카드의 style 변경만 감시해 즉시 숨김 상태를 유지합니다.
  hideOldCards();
  const oldCardObserver = new MutationObserver(() => hideOldCards());
  [oldUsersCard, oldLogsCard].filter(Boolean).forEach(node => {
    oldCardObserver.observe(node, { attributes: true, attributeFilter: ["style", "class"] });
  });

  async function loadData() {
    if (loading) return;
    loading = true;
    $("udmSummary").textContent = "사용자와 다운로드 기록을 불러오는 중입니다.";
    $("udmList").innerHTML = '<div class="udm-empty">불러오는 중...</div>';
    try {
      const [userSnap, logSnap] = await Promise.all([
        storeApi.getDocs(storeApi.collection(db, "users")),
        storeApi.getDocs(storeApi.collection(db, "downloadLogs"))
      ]);
      users = userSnap.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() }));
      logs = logSnap.docs.map(snapshot => ({ id: snapshot.id, ref: snapshot.ref, ...snapshot.data() }));
      users.sort((a, b) => String(a.name || a.email || "").localeCompare(String(b.name || b.email || ""), "ko"));
      logs.sort((a, b) => valueMillis(logTime(b)) - valueMillis(logTime(a)));
      render();
    } catch (error) {
      console.error(error);
      $("udmSummary").textContent = "목록을 불러오지 못했습니다. 관리자 권한과 Firestore 규칙을 확인해주세요.";
      $("udmList").innerHTML = '<div class="udm-empty">사용자 및 다운로드 기록을 불러오지 못했습니다.</div>';
    } finally {
      loading = false;
    }
  }

  function matchesFilter(user, userLogs, filter) {
    if (filter === "downloaded") return userLogs.length > 0;
    if (filter === "none") return userLogs.length === 0;
    if (filter === "blocked") return user.blocked === true;
    return true;
  }

  function matchesSearch(user, userLogs, query) {
    if (!query) return true;
    const userText = [user.name, user.department, user.email, user.id, user.uid, user.role]
      .map(value => String(value || "").toLowerCase()).join(" ");
    return userText.includes(query) || userLogs.some(log => logSearchText(log).includes(query));
  }

  function createLogRow(log) {
    const row = document.createElement("div");
    row.className = "udm-log";
    const title = log.fileName || log.apkFile || log.versionName || "APK 다운로드";
    row.innerHTML = `
      <div>
        <div class="udm-log-name">${escapeHtml(title)}</div>
        <div class="udm-log-meta">다운로드 시간: ${escapeHtml(stamp(logTime(log)))}${log.department ? ` · ${escapeHtml(log.department)}` : ""}</div>
      </div>
    `;
    const del = makeButton("이 기록 삭제", "btn secondary mini", async event => {
      event.preventDefault();
      event.stopPropagation();
      if (!confirm("선택한 다운로드 기록 한 건만 삭제할까요?")) return;
      try {
        await storeApi.deleteDoc(log.ref);
        await loadData();
      } catch (error) {
        console.error(error);
        alert("기록을 삭제하지 못했습니다.");
      }
    });
    row.appendChild(del);
    return row;
  }

  function createUserDetails(user, userLogs, forceOpen) {
    const detail = document.createElement("details");
    detail.className = "udm-user";
    detail.open = forceOpen;

    const latest = userLogs[0];
    const summary = document.createElement("summary");
    summary.innerHTML = `
      <div>
        <div class="udm-title">${escapeHtml(user.name || "이름 없음")} · ${escapeHtml(user.department || "부서 없음")}</div>
        <div class="udm-meta">${escapeHtml(user.email || "이메일 없음")}</div>
        <div class="udm-badges">
          <span class="udm-badge ${user.blocked === true ? "blocked" : "ok"}">${user.blocked === true ? "차단됨" : "정상"}</span>
          <span class="udm-badge">다운로드 ${userLogs.length}건</span>
          <span class="udm-badge">${latest ? `최근 ${escapeHtml(stamp(logTime(latest)))}` : "다운로드 없음"}</span>
        </div>
      </div>
    `;
    detail.appendChild(summary);

    const body = document.createElement("div");
    body.className = "udm-body";

    const actions = document.createElement("div");
    actions.className = "udm-user-actions";
    actions.appendChild(makeButton(user.blocked === true ? "차단 해제" : "차단", "btn secondary mini", async event => {
      event.preventDefault();
      try {
        await storeApi.updateDoc(storeApi.doc(db, "users", user.id), {
          blocked: user.blocked !== true,
          updatedAt: storeApi.serverTimestamp()
        });
        await loadData();
      } catch (error) {
        console.error(error);
        alert("차단 상태를 변경하지 못했습니다.");
      }
    }));
    actions.appendChild(makeButton("비밀번호 메일", "btn secondary mini", async event => {
      event.preventDefault();
      if (!user.email) return alert("이메일 정보가 없습니다.");
      if (!confirm(`${user.email} 주소로 비밀번호 재설정 메일을 보낼까요?`)) return;
      try {
        await authApi.sendPasswordResetEmail(auth, user.email);
        alert("비밀번호 재설정 메일을 보냈습니다.");
      } catch (error) {
        console.error(error);
        alert("메일을 보내지 못했습니다. Firebase Authentication 설정을 확인해주세요.");
      }
    }));
    body.appendChild(actions);

    const logTitle = document.createElement("div");
    logTitle.className = "udm-log-title";
    logTitle.textContent = `다운로드 기록 ${userLogs.length}건`;
    body.appendChild(logTitle);

    const logList = document.createElement("div");
    logList.className = "udm-logs";
    if (!userLogs.length) {
      logList.innerHTML = '<div class="udm-empty">다운로드 기록이 없습니다.</div>';
    } else {
      userLogs.forEach(log => logList.appendChild(createLogRow(log)));
    }
    body.appendChild(logList);
    detail.appendChild(body);
    return detail;
  }

  function createOrphanDetails(orphanLogs, forceOpen) {
    const pseudo = {
      id: "orphan-download-logs",
      name: "미등록 사용자 / 과거 기록",
      department: "사용자 정보와 연결되지 않은 기록",
      email: "UID 또는 이메일이 현재 사용자 목록과 일치하지 않습니다.",
      blocked: false
    };
    const detail = createUserDetails(pseudo, orphanLogs, forceOpen);
    const actions = detail.querySelector(".udm-user-actions");
    if (actions) actions.remove();
    return detail;
  }

  function render() {
    const query = $("udmSearch").value.trim().toLowerCase();
    const filter = $("udmFilter").value;
    const consumed = new Set();
    const mapped = users.map(user => ({ user, logs: linkedLogs(user, logs, consumed) }));
    const orphanLogs = logs.filter(log => !consumed.has(log.id));
    const visible = mapped.filter(item => matchesFilter(item.user, item.logs, filter) && matchesSearch(item.user, item.logs, query));

    $("udmList").innerHTML = "";
    rows = [];
    visible.forEach(item => {
      const detail = createUserDetails(item.user, item.logs, Boolean(query));
      rows.push(detail);
      $("udmList").appendChild(detail);
    });

    const orphanMatches = orphanLogs.filter(log => !query || logSearchText(log).includes(query));
    if (orphanMatches.length && filter !== "none" && filter !== "blocked") {
      const orphan = createOrphanDetails(orphanMatches, Boolean(query));
      rows.push(orphan);
      $("udmList").appendChild(orphan);
    }

    if (!rows.length) {
      $("udmList").innerHTML = '<div class="udm-empty">검색 조건에 맞는 사용자가 없습니다.</div>';
    }

    const downloadedUsers = mapped.filter(item => item.logs.length > 0).length;
    const blockedUsers = users.filter(user => user.blocked === true).length;
    $("udmSummary").textContent = `사용자 ${users.length}명 · 다운로드 기록 ${logs.length}건 · 다운로드 사용자 ${downloadedUsers}명 · 차단 ${blockedUsers}명 · 현재 표시 ${visible.length + (orphanMatches.length ? 1 : 0)}개`;
  }

  $("udmRefresh").addEventListener("click", loadData);
  $("udmSearch").addEventListener("input", render);
  $("udmFilter").addEventListener("change", render);
  $("udmCollapse").addEventListener("click", () => rows.forEach(detail => { detail.open = false; }));
  $("udmExpand").addEventListener("click", () => rows.forEach(detail => { detail.open = true; }));

  authApi.onAuthStateChanged(auth, async user => {
    const isAdmin = user && normalizeEmail(user.email) === normalizeEmail(options.adminEmail);
    card.style.display = isAdmin ? "block" : "none";
    if (!isAdmin) return;
    hideOldCards();
    await loadData();
  });
}
