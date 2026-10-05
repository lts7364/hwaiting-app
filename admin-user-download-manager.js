const SDK = "https://www.gstatic.com/firebasejs/10.12.5";

function waitForDom() {
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once:true }));
}

async function existingFirebaseApp(firebaseConfig) {
  const api = await import(`${SDK}/firebase-app.js`);
  for (let i = 0; i < 40; i += 1) {
    if (api.getApps().length) return api.getApp();
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return api.initializeApp(firebaseConfig);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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
      return seconds * 1000;
    }
    if (typeof value === "number") return value < 1000000000000 ? value * 1000 : value;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (_) {
    return 0;
  }
}

function stamp(value) {
  const millis = valueMillis(value);
  if (!millis) return "시간 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", hour12:true
  }).format(new Date(millis));
}

function logTime(log) {
  return log?.downloadedAt || log?.createdAt || log?.timestamp || log?.time || log?.updatedAt || null;
}

function injectStyles() {
  if (document.getElementById("memberAdminStyle")) return;
  const style = document.createElement("style");
  style.id = "memberAdminStyle";
  style.textContent = `
    #memberSettingsCard,#memberManagerCard{margin-top:14px}
    .ma-help{margin:0 0 12px;color:#6d756b;font-size:13px;line-height:1.6}
    .ma-setting{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #e5dac8}
    .ma-setting:first-of-type{border-top:0}
    .ma-setting b{display:block;font-size:15px}
    .ma-setting span{display:block;margin-top:3px;color:#6d756b;font-size:12px;line-height:1.5}
    .ma-switch{position:relative;width:54px;height:31px;display:inline-block}
    .ma-switch input{opacity:0;width:0;height:0}
    .ma-slider{position:absolute;inset:0;border-radius:999px;background:#c9c5bd;cursor:pointer;transition:.2s}
    .ma-slider:before{content:"";position:absolute;width:23px;height:23px;left:4px;top:4px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
    .ma-switch input:checked + .ma-slider{background:#3b7f47}
    .ma-switch input:checked + .ma-slider:before{transform:translateX(23px)}
    .ma-reset-list,.ma-user-list{display:grid;gap:10px;margin-top:12px}
    .ma-reset{border:1px solid #e1d3bf;border-radius:16px;background:#f4ead9;padding:12px}
    .ma-user{border:1px solid #e1d3bf;border-radius:16px;background:#f4ead9;overflow:hidden}
    .ma-user>summary{list-style:none;cursor:pointer;padding:12px;display:flex;gap:10px;justify-content:space-between;align-items:flex-start}
    .ma-user>summary::-webkit-details-marker{display:none}
    .ma-user>summary:after{content:"펼치기";flex:0 0 auto;color:#3b7f47;font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:#edf7ee}
    .ma-user[open]>summary:after{content:"접기"}
    .ma-user[open]>summary{border-bottom:1px solid #dfd1bd}
    .ma-user-body{padding:10px 12px 12px}
    .ma-reset-head{display:flex;gap:10px;justify-content:space-between;align-items:flex-start}
    .ma-title{font-weight:900;font-size:15px;line-height:1.45}
    .ma-meta{margin-top:4px;color:#6d756b;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
    .ma-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
    .ma-badge{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eadfcf;color:#5c5044;font-size:11px;font-weight:900}
    .ma-badge.ok{background:#dff0d8;color:#2f6b3c}
    .ma-badge.wait{background:#fff0c6;color:#805e13}
    .ma-badge.blocked{background:#ffe0e4;color:#9b3e4b}
    .ma-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
    .ma-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .ma-toolbar input{flex:1 1 220px}
    .ma-toolbar select{width:auto;min-width:150px}
    .ma-logs{margin-top:10px;padding-top:10px;border-top:1px solid #dfd1bd;display:grid;gap:7px}
    .ma-log{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;background:#fff;border-radius:12px;padding:9px}
    .ma-log-name{font-size:12px;font-weight:900;overflow-wrap:anywhere}
    .ma-log-meta{margin-top:3px;color:#6d756b;font-size:11px}
    .ma-empty{padding:14px;text-align:center;color:#6d756b;font-size:13px}
    .ma-summary{margin-top:10px;padding:10px 12px;border-radius:14px;background:#edf7ee;color:#3f5f45;font-size:12px;line-height:1.55}
    .ma-section-title{margin:18px 0 0;font-size:16px}
    @media(max-width:620px){
      .ma-setting{grid-template-columns:1fr auto}
      .ma-reset-head{display:block}
      .ma-user>summary{display:block}
      .ma-user>summary:after{display:inline-flex;margin-top:8px}
      .ma-actions{justify-content:flex-start;margin-top:9px}
      .ma-toolbar select{width:100%}
      .ma-log{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);
}

function button(text, className, handler) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = className;
  el.textContent = text;
  el.addEventListener("click", handler);
  return el;
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

  function hideOldCards() {
    [oldUsersCard, oldLogsCard].filter(Boolean).forEach(card => {
      card.style.setProperty("display", "none", "important");
      card.setAttribute("aria-hidden", "true");
    });
  }
  let oldCardsObserver = null;
  function activateReplacementUi() {
    hideOldCards();
    if (oldCardsObserver) return;
    oldCardsObserver = new MutationObserver(hideOldCards);
    [oldUsersCard, oldLogsCard].filter(Boolean).forEach(card => oldCardsObserver.observe(card, { attributes:true, attributeFilter:["style","class"] }));
  }

  let settingsCard = document.getElementById("memberSettingsCard");
  if (!settingsCard) {
    settingsCard = document.createElement("section");
    settingsCard.id = "memberSettingsCard";
    settingsCard.className = "card";
    settingsCard.style.display = "none";
    settingsCard.innerHTML = `
      <h2>회원 설정</h2>
      <p class="ma-help">간편회원 가입과 비밀번호 초기화 방식을 설정합니다.</p>
      <div class="ma-setting">
        <div><b>신규 회원 자동 승인</b><span>켜면 회원가입 즉시 다운로드할 수 있습니다.</span></div>
        <label class="ma-switch"><input id="maAutoApprove" type="checkbox"><span class="ma-slider"></span></label>
      </div>
      <div class="ma-setting">
        <div><b>비밀번호 자동 초기화</b><span>켜면 아이디·이름·소속 확인 후 사용자가 바로 새 비밀번호를 정합니다.</span></div>
        <label class="ma-switch"><input id="maAutoReset" type="checkbox"><span class="ma-slider"></span></label>
      </div>
      <div id="maSettingsStatus" class="ma-summary">설정을 확인하고 있습니다.</div>
      <h3 class="ma-section-title">비밀번호 초기화 요청</h3>
      <div id="maResetList" class="ma-reset-list"><div class="ma-empty">확인 중...</div></div>
    `;
    if (requestsCard?.parentNode) requestsCard.parentNode.insertBefore(settingsCard, requestsCard);
    else main.appendChild(settingsCard);
  }

  let managerCard = document.getElementById("memberManagerCard");
  if (!managerCard) {
    managerCard = document.createElement("section");
    managerCard.id = "memberManagerCard";
    managerCard.className = "card";
    managerCard.style.display = "none";
    managerCard.innerHTML = `
      <h2>회원 · 다운로드 관리</h2>
      <p class="ma-help">새 간편계정과 기존 이메일 계정을 함께 관리합니다. 기존 사용자가 새 아이디로 전환한 경우 과거 다운로드 기록도 한곳에 합쳐서 표시합니다.</p>
      <div class="ma-toolbar">
        <input id="maSearch" type="search" placeholder="아이디·이름·소속·이메일 검색" autocomplete="off">
        <select id="maFilter">
          <option value="all">전체 회원</option>
          <option value="pending">승인 대기</option>
          <option value="simple">간편계정</option>
          <option value="legacy">기존계정</option>
          <option value="downloaded">다운로드 있음</option>
          <option value="blocked">차단 회원</option>
        </select>
        <button id="maRefresh" class="btn secondary mini" type="button">새로고침</button>
        <button id="maCollapse" class="btn secondary mini" type="button">전체 접기</button>
        <button id="maExpand" class="btn secondary mini" type="button">전체 펼치기</button>
      </div>
      <div id="maSummary" class="ma-summary">회원 정보를 확인하고 있습니다.</div>
      <div id="maUserList" class="ma-user-list"></div>
    `;
    if (requestsCard?.parentNode) requestsCard.parentNode.insertBefore(managerCard, requestsCard);
    else main.appendChild(managerCard);
  }

  const settingsRef = storeApi.doc(db, "siteSettings", "auth");
  const el = id => document.getElementById(id);
  let users = [];
  let logs = [];
  let aliases = [];
  let resetRequests = [];
  let settings = { autoApprove:true, autoPasswordReset:true };
  let loading = false;

  async function ensureSettings() {
    const snap = await storeApi.getDoc(settingsRef);
    if (!snap.exists()) {
      await storeApi.setDoc(settingsRef, {
        autoApprove:true,
        autoPasswordReset:true,
        updatedAt:storeApi.serverTimestamp()
      });
      settings = { autoApprove:true, autoPasswordReset:true };
    } else {
      const data = snap.data();
      settings = {
        autoApprove:data.autoApprove !== false,
        autoPasswordReset:data.autoPasswordReset !== false
      };
    }
    el("maAutoApprove").checked = settings.autoApprove;
    el("maAutoReset").checked = settings.autoPasswordReset;
    el("maSettingsStatus").textContent = `자동 승인 ${settings.autoApprove ? "ON" : "OFF"} · 자동 비밀번호 초기화 ${settings.autoPasswordReset ? "ON" : "OFF"}`;
  }

  async function saveSettings() {
    settings = {
      autoApprove:el("maAutoApprove").checked,
      autoPasswordReset:el("maAutoReset").checked
    };
    el("maSettingsStatus").textContent = "저장 중...";
    await storeApi.setDoc(settingsRef, {
      ...settings,
      updatedAt:storeApi.serverTimestamp()
    }, { merge:true });
    el("maSettingsStatus").textContent = `자동 승인 ${settings.autoApprove ? "ON" : "OFF"} · 자동 비밀번호 초기화 ${settings.autoPasswordReset ? "ON" : "OFF"}`;
  }

  function currentSimpleUsers() {
    const byUsername = new Map(aliases.map(alias => [String(alias.usernameKey || alias.id || ""), alias]));
    return users.filter(user => {
      if (user.accountType !== "simple") return false;
      const alias = byUsername.get(String(user.usernameKey || user.username || ""));
      return !alias || String(alias.uid || "") === String(user.id);
    });
  }

  function canonicalUsers() {
    const simple = currentSimpleUsers();
    const claimedLegacy = new Set(simple.map(user => normalizeEmail(user.legacyEmail)).filter(Boolean));
    const legacy = users.filter(user => user.accountType !== "simple" && !claimedLegacy.has(normalizeEmail(user.email)));
    return [...simple, ...legacy];
  }

  function linkedLogs(user, consumed) {
    const uid = String(user.id || user.uid || "");
    const username = String(user.username || user.usernameKey || "").toLowerCase();
    const email = normalizeEmail(user.email);
    const legacyEmail = normalizeEmail(user.legacyEmail);
    const found = [];

    logs.forEach(log => {
      if (consumed.has(log.id)) return;
      const logUid = String(log.uid || log.userId || "");
      const logUsername = String(log.username || "").toLowerCase();
      const logEmail = normalizeEmail(log.email);
      const logLegacy = normalizeEmail(log.legacyEmail);
      const match =
        (uid && logUid === uid) ||
        (username && logUsername === username) ||
        (email && logEmail === email) ||
        (legacyEmail && (logEmail === legacyEmail || logLegacy === legacyEmail));
      if (match) {
        consumed.add(log.id);
        found.push(log);
      }
    });

    return found.sort((a,b) => valueMillis(logTime(b)) - valueMillis(logTime(a)));
  }

  function matchesFilter(user, userLogs, filter) {
    if (filter === "pending") return user.approved === false;
    if (filter === "simple") return user.accountType === "simple";
    if (filter === "legacy") return user.accountType !== "simple";
    if (filter === "downloaded") return userLogs.length > 0;
    if (filter === "blocked") return user.blocked === true;
    return true;
  }

  function matchesSearch(user, userLogs, query) {
    if (!query) return true;
    const userText = [
      user.username, user.name, user.department, user.email, user.legacyEmail, user.id
    ].map(value => String(value || "").toLowerCase()).join(" ");
    if (userText.includes(query)) return true;
    return userLogs.some(log => [
      log.username, log.name, log.department, log.email, log.legacyEmail, log.apkFile, log.versionName
    ].map(value => String(value || "").toLowerCase()).join(" ").includes(query));
  }

  function createLogRow(log) {
    const row = document.createElement("div");
    row.className = "ma-log";
    const info = document.createElement("div");
    info.innerHTML = `
      <div class="ma-log-name">${escapeHtml(log.apkFile || log.versionName || "APK 다운로드")}</div>
      <div class="ma-log-meta">${escapeHtml(stamp(logTime(log)))}${log.department ? ` · ${escapeHtml(log.department)}` : ""}</div>
    `;
    const del = button("삭제", "btn secondary mini", async event => {
      event.preventDefault();
      if (!confirm("이 다운로드 기록을 삭제할까요?")) return;
      await storeApi.deleteDoc(log.ref);
      await loadAll();
    });
    row.append(info, del);
    return row;
  }

  async function toggleBlock(user) {
    await storeApi.updateDoc(storeApi.doc(db, "users", user.id), {
      blocked:user.blocked !== true,
      updatedAt:storeApi.serverTimestamp()
    });
    await loadAll();
  }

  async function approveUser(user) {
    await storeApi.updateDoc(storeApi.doc(db, "users", user.id), {
      approved:true,
      updatedAt:storeApi.serverTimestamp()
    });
    await loadAll();
  }

  function createUserCard(user, userLogs) {
    const card = document.createElement("details");
    card.className = "ma-user";
    card.open = false;

    const simple = user.accountType === "simple";
    const identity = simple ? `아이디 ${user.username || "-"}` : (user.email || "이메일 없음");

    const head = document.createElement("summary");
    const info = document.createElement("div");
    info.innerHTML = `
      <div class="ma-title">${escapeHtml(user.name || "이름 없음")} · ${escapeHtml(user.department || "소속 없음")}</div>
      <div class="ma-meta">${escapeHtml(identity)}</div>
      ${simple && user.legacyEmail ? `<div class="ma-meta">기존 기록 연결: ${escapeHtml(user.legacyEmail)}</div>` : ""}
      <div class="ma-badges">
        <span class="ma-badge ${user.blocked === true ? "blocked" : "ok"}">${user.blocked === true ? "차단됨" : "정상"}</span>
        <span class="ma-badge ${user.approved === false ? "wait" : "ok"}">${user.approved === false ? "승인대기" : "승인됨"}</span>
        <span class="ma-badge">${simple ? "간편계정" : "기존계정"}</span>
        <span class="ma-badge">다운로드 ${userLogs.length}건</span>
      </div>
    `;
    head.appendChild(info);
    card.appendChild(head);

    const body = document.createElement("div");
    body.className = "ma-user-body";

    const actions = document.createElement("div");
    actions.className = "ma-actions";
    if (user.approved === false) {
      actions.appendChild(button("승인", "btn primary mini", () => approveUser(user).catch(error => alert(error.message))));
    }
    actions.appendChild(button(user.blocked === true ? "차단 해제" : "차단", "btn secondary mini", () => toggleBlock(user).catch(error => alert(error.message))));
    if (!simple && user.email) {
      actions.appendChild(button("비밀번호 메일", "btn secondary mini", async () => {
        if (!confirm(`${user.email} 주소로 기존 방식 비밀번호 재설정 메일을 보낼까요?`)) return;
        try {
          await authApi.sendPasswordResetEmail(auth, user.email);
          alert("비밀번호 재설정 메일을 보냈습니다.");
        } catch (error) {
          alert(error?.message || "메일을 보내지 못했습니다.");
        }
      }));
    }
    body.appendChild(actions);

    const logsBox = document.createElement("div");
    logsBox.className = "ma-logs";
    if (!userLogs.length) {
      logsBox.innerHTML = '<div class="ma-empty">다운로드 기록이 없습니다.</div>';
    } else {
      userLogs.slice(0, 30).forEach(log => logsBox.appendChild(createLogRow(log)));
      if (userLogs.length > 30) {
        const more = document.createElement("div");
        more.className = "ma-empty";
        more.textContent = `최근 30건만 표시 중 · 전체 ${userLogs.length}건`;
        logsBox.appendChild(more);
      }
    }
    body.appendChild(logsBox);
    card.appendChild(body);
    return card;
  }

  async function approveReset(request) {
    const aliasRef = storeApi.doc(db, "simpleAliases", request.usernameKey);
    const aliasSnap = await storeApi.getDoc(aliasRef);
    if (!aliasSnap.exists()) throw new Error("아이디 연결 정보를 찾지 못했습니다.");
    if (String(aliasSnap.data().uid || "") !== String(request.oldUid || "")) {
      throw new Error("이미 다른 초기화가 적용된 요청입니다.");
    }
    if (!confirm(`${request.username} 계정의 새 비밀번호 사용을 승인할까요?`)) return;

    const batch = storeApi.writeBatch(db);
    batch.update(aliasRef, {
      uid:request.candidateUid,
      authEmail:request.candidateAuthEmail,
      resetVersion:Number(aliasSnap.data().resetVersion || 0) + 1,
      updatedAt:storeApi.serverTimestamp()
    });
    batch.update(storeApi.doc(db, "users", request.candidateUid), {
      approved:true,
      updatedAt:storeApi.serverTimestamp()
    });
    batch.update(request.ref, {
      status:"approved",
      approvedAt:storeApi.serverTimestamp(),
      updatedAt:storeApi.serverTimestamp()
    });
    await batch.commit();
    await loadAll();
  }

  async function rejectReset(request) {
    if (!confirm(`${request.username} 초기화 요청을 거절할까요?`)) return;
    const batch = storeApi.writeBatch(db);
    batch.update(request.ref, {
      status:"rejected",
      updatedAt:storeApi.serverTimestamp()
    });
    batch.update(storeApi.doc(db, "users", request.candidateUid), {
      blocked:true,
      updatedAt:storeApi.serverTimestamp()
    });
    await batch.commit();
    await loadAll();
  }

  function renderResetRequests() {
    const box = el("maResetList");
    const pending = resetRequests.filter(item => item.status === "pending");
    box.innerHTML = "";
    if (!pending.length) {
      box.innerHTML = '<div class="ma-empty">대기 중인 초기화 요청이 없습니다.</div>';
      return;
    }
    pending.forEach(request => {
      const row = document.createElement("div");
      row.className = "ma-reset";
      const head = document.createElement("div");
      head.className = "ma-reset-head";
      const info = document.createElement("div");
      info.innerHTML = `
        <div class="ma-title">${escapeHtml(request.username || "-")} · ${escapeHtml(request.name || "이름 없음")}</div>
        <div class="ma-meta">${escapeHtml(request.department || "소속 없음")} · ${escapeHtml(stamp(request.createdAt))}</div>
      `;
      const actions = document.createElement("div");
      actions.className = "ma-actions";
      actions.appendChild(button("승인", "btn primary mini", () => approveReset(request).catch(error => alert(error.message))));
      actions.appendChild(button("거절", "btn danger mini", () => rejectReset(request).catch(error => alert(error.message))));
      head.append(info, actions);
      row.appendChild(head);
      box.appendChild(row);
    });
  }

  function renderUsers() {
    const query = el("maSearch").value.trim().toLowerCase();
    const filter = el("maFilter").value;
    const canonical = canonicalUsers();
    const consumed = new Set();
    const mapped = canonical.map(user => ({ user, logs:linkedLogs(user, consumed) }));
    mapped.sort((a,b) => {
      const at = a.logs[0] ? valueMillis(logTime(a.logs[0])) : 0;
      const bt = b.logs[0] ? valueMillis(logTime(b.logs[0])) : 0;
      if (at !== bt) return bt - at;
      return String(a.user.name || a.user.username || "").localeCompare(String(b.user.name || b.user.username || ""), "ko");
    });

    const visible = mapped.filter(item => matchesFilter(item.user, item.logs, filter) && matchesSearch(item.user, item.logs, query));
    const box = el("maUserList");
    box.innerHTML = "";
    visible.forEach(item => box.appendChild(createUserCard(item.user, item.logs)));

    const orphan = logs.filter(log => !consumed.has(log.id));
    if (orphan.length && filter === "all" && !query) {
      const orphanBox = document.createElement("details");
      orphanBox.className = "ma-user";
      orphanBox.open = false;
      const summary = document.createElement("summary");
      summary.innerHTML = `<div><div class="ma-title">연결되지 않은 과거 기록 · ${orphan.length}건</div><div class="ma-meta">현재 회원 정보와 UID·아이디·이메일이 일치하지 않는 기록입니다.</div></div>`;
      orphanBox.appendChild(summary);
      const body = document.createElement("div");
      body.className = "ma-user-body";
      const logsBox = document.createElement("div");
      logsBox.className = "ma-logs";
      orphan.slice(0, 20).forEach(log => logsBox.appendChild(createLogRow(log)));
      body.appendChild(logsBox);
      orphanBox.appendChild(body);
      box.appendChild(orphanBox);
    }

    if (!box.children.length) box.innerHTML = '<div class="ma-empty">조건에 맞는 회원이 없습니다.</div>';

    const pending = canonical.filter(user => user.approved === false).length;
    const blocked = canonical.filter(user => user.blocked === true).length;
    const simple = canonical.filter(user => user.accountType === "simple").length;
    el("maSummary").textContent = `회원 ${canonical.length}명 · 간편계정 ${simple}명 · 승인대기 ${pending}명 · 차단 ${blocked}명 · 다운로드 기록 ${logs.length}건`;
  }

  async function loadAll() {
    if (loading) return;
    loading = true;
    el("maSummary").textContent = "불러오는 중...";
    try {
      await ensureSettings();
      const [userSnap, logSnap, aliasSnap, resetSnap] = await Promise.all([
        storeApi.getDocs(storeApi.collection(db, "users")),
        storeApi.getDocs(storeApi.collection(db, "downloadLogs")),
        storeApi.getDocs(storeApi.collection(db, "simpleAliases")),
        storeApi.getDocs(storeApi.collection(db, "passwordResetRequests"))
      ]);
      users = userSnap.docs.map(doc => ({ id:doc.id, ...doc.data() }));
      logs = logSnap.docs.map(doc => ({ id:doc.id, ref:doc.ref, ...doc.data() }));
      aliases = aliasSnap.docs.map(doc => ({ id:doc.id, ...doc.data() }));
      resetRequests = resetSnap.docs.map(doc => ({ id:doc.id, ref:doc.ref, ...doc.data() }));
      logs.sort((a,b) => valueMillis(logTime(b)) - valueMillis(logTime(a)));
      resetRequests.sort((a,b) => valueMillis(b.createdAt) - valueMillis(a.createdAt));
      activateReplacementUi();
      renderResetRequests();
      renderUsers();
    } catch (error) {
      console.error(error);
      el("maSummary").textContent = "회원 정보를 불러오지 못했습니다. Firestore 규칙이 최신인지 확인해 주세요.";
      el("maUserList").innerHTML = '<div class="ma-empty">불러오기 실패</div>';
      el("maResetList").innerHTML = '<div class="ma-empty">초기화 요청을 불러오지 못했습니다.</div>';
    } finally {
      loading = false;
    }
  }

  el("maAutoApprove").addEventListener("change", () => saveSettings().catch(error => {
    alert("설정을 저장하지 못했습니다: " + (error?.message || error));
    loadAll();
  }));
  el("maAutoReset").addEventListener("change", () => saveSettings().catch(error => {
    alert("설정을 저장하지 못했습니다: " + (error?.message || error));
    loadAll();
  }));
  el("maRefresh").addEventListener("click", loadAll);
  el("maCollapse").addEventListener("click", () => {
    document.querySelectorAll("#maUserList details.ma-user").forEach(item => { item.open = false; });
  });
  el("maExpand").addEventListener("click", () => {
    document.querySelectorAll("#maUserList details.ma-user").forEach(item => { item.open = true; });
  });
  el("maSearch").addEventListener("input", renderUsers);
  el("maFilter").addEventListener("change", renderUsers);

  authApi.onAuthStateChanged(auth, async user => {
    let admin = false;
    if (user && normalizeEmail(user.email) === normalizeEmail(options.adminEmail)) {
      admin = true;
    } else if (user) {
      try {
        const snap = await storeApi.getDoc(storeApi.doc(db, "users", user.uid));
        admin = snap.exists() && snap.data().role === "admin";
      } catch (_) {}
    }

    settingsCard.style.display = admin ? "block" : "none";
    managerCard.style.display = admin ? "block" : "none";
    if (!admin) return;
    await loadAll();
  });
}
