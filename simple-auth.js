const SDK = "https://www.gstatic.com/firebasejs/10.12.5";

const authApi = await import(`${SDK}/firebase-auth.js`);
const storeApi = await import(`${SDK}/firebase-firestore.js`);

export const SIMPLE_ACCOUNT_DOMAIN = "member.hwaiting.app";

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!/^[a-z0-9]{4,20}$/.test(username)) {
    const error = new Error("아이디는 영문 소문자와 숫자만 사용해 4~20자로 입력해 주세요.");
    error.hwaitingCode = "invalid-username";
    throw error;
  }
  return username;
}

function cleanText(value, max, label) {
  const text = String(value || "").trim();
  if (!text || text.length > max) {
    const error = new Error(`${label}을(를) 1~${max}자로 입력해 주세요.`);
    error.hwaitingCode = "invalid-profile";
    throw error;
  }
  return text;
}

function randomToken(bytes = 10) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data, value => value.toString(16).padStart(2, "0")).join("");
}

function internalEmail(username) {
  return `u-${username}-${randomToken()}@${SIMPLE_ACCOUNT_DOMAIN}`;
}

export function isSimpleInternalEmail(email) {
  return cleanEmail(email).endsWith(`@${SIMPLE_ACCOUNT_DOMAIN}`);
}

export async function getPublicAuthSettings(db) {
  try {
    const snap = await storeApi.getDoc(storeApi.doc(db, "siteSettings", "auth"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        autoApprove: data.autoApprove !== false,
        autoPasswordReset: data.autoPasswordReset !== false
      };
    }
  } catch (_) {}
  return { autoApprove: true, autoPasswordReset: true };
}

export async function getSimpleAlias(db, usernameValue) {
  const username = validateUsername(usernameValue);
  const snap = await storeApi.getDoc(storeApi.doc(db, "simpleAliases", username));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function signInSimple(auth, db, usernameValue, password) {
  const username = validateUsername(usernameValue);
  const alias = await getSimpleAlias(db, username);
  if (!alias?.authEmail) {
    const error = new Error("등록된 아이디를 찾을 수 없습니다.");
    error.hwaitingCode = "simple-user-not-found";
    throw error;
  }
  const result = await authApi.signInWithEmailAndPassword(auth, alias.authEmail, password);
  return { result, alias };
}

export async function createSimpleAccount(auth, db, options) {
  const username = validateUsername(options.username);
  const name = cleanText(options.name, 30, "이름");
  const department = cleanText(options.department, 40, "소속");
  const password = String(options.password || "");
  const legacyEmail = cleanEmail(options.legacyEmail);
  if (password.length < 6) {
    const error = new Error("비밀번호는 6자 이상 입력해 주세요.");
    error.hwaitingCode = "weak-password";
    throw error;
  }

  const existing = await storeApi.getDoc(storeApi.doc(db, "simpleAliases", username));
  if (existing.exists()) {
    const error = new Error("이미 사용 중인 아이디입니다.");
    error.hwaitingCode = "username-taken";
    throw error;
  }

  await authApi.signOut(auth).catch(() => {});
  const settings = await getPublicAuthSettings(db);
  const email = internalEmail(username);
  let credential = null;

  try {
    credential = await authApi.createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    await storeApi.setDoc(storeApi.doc(db, "users", uid), {
      uid,
      email,
      authEmail: email,
      accountType: "simple",
      username,
      usernameKey: username,
      name,
      department,
      legacyEmail: legacyEmail || "",
      resetOfUid: "",
      approved: settings.autoApprove === true,
      blocked: false,
      role: "user",
      createdAt: storeApi.serverTimestamp(),
      updatedAt: storeApi.serverTimestamp()
    });

    await storeApi.setDoc(storeApi.doc(db, "simpleAliases", username), {
      username,
      usernameKey: username,
      uid,
      authEmail: email,
      resetVersion: 0,
      createdAt: storeApi.serverTimestamp(),
      updatedAt: storeApi.serverTimestamp()
    });

    return {
      user: credential.user,
      username,
      approved: settings.autoApprove === true,
      legacyEmail
    };
  } catch (error) {
    if (credential?.user) {
      try { await authApi.deleteUser(credential.user); } catch (_) {}
    }
    throw error;
  }
}

export async function resetSimplePassword(auth, db, options) {
  const username = validateUsername(options.username);
  const name = cleanText(options.name, 30, "이름");
  const department = cleanText(options.department, 40, "소속");
  const password = String(options.password || "");
  if (password.length < 6) {
    const error = new Error("새 비밀번호는 6자 이상 입력해 주세요.");
    error.hwaitingCode = "weak-password";
    throw error;
  }

  const aliasRef = storeApi.doc(db, "simpleAliases", username);
  const aliasSnap = await storeApi.getDoc(aliasRef);
  if (!aliasSnap.exists()) {
    const error = new Error("등록된 아이디를 찾을 수 없습니다.");
    error.hwaitingCode = "simple-user-not-found";
    throw error;
  }

  const oldAlias = aliasSnap.data();
  const oldUid = String(oldAlias.uid || "");
  if (!oldUid) {
    const error = new Error("계정 연결 정보가 올바르지 않습니다. 관리자에게 문의해 주세요.");
    error.hwaitingCode = "invalid-alias";
    throw error;
  }

  await authApi.signOut(auth).catch(() => {});
  const settings = await getPublicAuthSettings(db);
  const email = internalEmail(username);
  let credential = null;

  try {
    credential = await authApi.createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    const autoReset = settings.autoPasswordReset === true;

    await storeApi.setDoc(storeApi.doc(db, "users", uid), {
      uid,
      email,
      authEmail: email,
      accountType: "simple",
      username,
      usernameKey: username,
      name,
      department,
      legacyEmail: "",
      resetOfUid: oldUid,
      approved: autoReset,
      blocked: false,
      role: "user",
      createdAt: storeApi.serverTimestamp(),
      updatedAt: storeApi.serverTimestamp()
    });

    if (autoReset) {
      await storeApi.updateDoc(aliasRef, {
        uid,
        authEmail: email,
        resetVersion: Number(oldAlias.resetVersion || 0) + 1,
        updatedAt: storeApi.serverTimestamp()
      });
      return { status: "reset", user: credential.user, username };
    }

    await storeApi.addDoc(storeApi.collection(db, "passwordResetRequests"), {
      username,
      usernameKey: username,
      oldUid,
      candidateUid: uid,
      candidateAuthEmail: email,
      name,
      department,
      status: "pending",
      createdAt: storeApi.serverTimestamp(),
      updatedAt: storeApi.serverTimestamp()
    });
    await authApi.signOut(auth);
    return { status: "pending", username };
  } catch (error) {
    if (credential?.user) {
      try { await authApi.deleteUser(credential.user); } catch (_) {}
    }
    throw error;
  }
}

export function friendlyAuthError(error) {
  if (error?.hwaitingCode === "invalid-username") return error.message;
  if (error?.hwaitingCode === "invalid-profile") return error.message;
  if (error?.hwaitingCode === "username-taken") return "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.";
  if (error?.hwaitingCode === "simple-user-not-found") return "아이디를 확인해 주세요.";
  if (error?.hwaitingCode === "weak-password") return error.message;

  const code = String(error?.code || "");
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "아이디 또는 비밀번호를 확인해 주세요.";
  }
  if (code.includes("email-already-in-use")) return "계정 생성 중 충돌이 발생했습니다. 다시 시도해 주세요.";
  if (code.includes("weak-password")) return "비밀번호는 6자 이상 입력해 주세요.";
  if (code.includes("too-many-requests")) return "요청이 너무 많습니다. 잠시 뒤 다시 시도해 주세요.";
  if (code.includes("network-request-failed")) return "인터넷 연결을 확인해 주세요.";
  if (code.includes("permission-denied")) return "이름 또는 소속 정보가 기존 가입 정보와 일치하지 않거나 사이트 설정이 아직 적용되지 않았습니다.";
  return error?.message || "처리 중 문제가 발생했습니다. 잠시 뒤 다시 시도해 주세요.";
}
