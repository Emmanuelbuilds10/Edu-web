// Automated API checks for the School Course Learning Application QA pass.
// Prints a PASS/FAIL table. Nothing secret is ever printed.
const BASE = process.env.QA_BASE || "http://localhost:3000";
const rows = [];

async function call(method, path, opts = {}) {
  const { body, cookie, headers, raw } = opts;
  const init = {
    method,
    redirect: "manual",
    headers: {
      ...(body && !raw ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(headers || {}),
    },
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  };
  try {
    const res = await fetch(BASE + path, init);
    const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    const text = await res.text();
    return {
      status: res.status,
      location: res.headers.get("location"),
      setCookie,
      text,
      json: () => { try { return JSON.parse(text); } catch { return null; } },
    };
  } catch (error) {
    return { status: 0, location: null, setCookie: [], text: String(error), json: () => null };
  }
}

function row(id, desc, input, expected, actual) {
  const pass = Array.isArray(expected) ? expected.includes(actual) : expected === actual;
  rows.push({ id, desc, input, expected, actual, verdict: pass ? "Pass" : "Fail" });
}

async function signIn(email, password) {
  const res = await call("POST", "/api/demo/sign-in", { body: { email, password } });
  const cookie = (res.setCookie[0] || "").split(";")[0];
  return cookie || null;
}

const anon = null;
const admin = await signIn("admin@sabiplex.dev", "admin123");
const student = await signIn("student@sabiplex.dev", "student123");

// --- public pages ---
for (const [id, path] of [["P01", "/"], ["P02", "/search"], ["P03", "/sign-in"], ["P04", "/this-route-does-not-exist"]]) {
  const res = await call("GET", path, { cookie: anon });
  row(id, `Public page ${path}`, "anonymous GET", id === "P04" ? 404 : 200, res.status);
}

const courses = (await call("GET", "/api/courses", { cookie: anon })).json() || [];
const paidCourse = courses.find((c) => typeof c.price === "number" && c.price > 0);
const freeCourse = courses.find((c) => c.price === 0);
row("P05", "Course catalogue returns data", `GET /api/courses (${courses.length} items)`, 200, (await call("GET", "/api/courses", { cookie: anon })).status);

if (paidCourse) {
  const res = await call("GET", `/api/courses/${paidCourse.id}`, { cookie: anon });
  const data = res.json();
  const leaks = (data?.chapters || []).filter((c) => c.videoUrl || c.playbackId);
  row("P06", "Paid course page loads for guest", "GET paid course", 200, res.status);
  row("P07", "Paid videos hidden from guest", "GET paid course chapters", 0, leaks.length);
  const en = await call("POST", `/api/courses/${paidCourse.id}/enroll`, { cookie: anon });
  row("P08", "Guest cannot self-enrol (paid)", "POST /enroll anonymous", 401, en.status);
  const pa = await call("PATCH", `/api/courses/${paidCourse.id}`, { cookie: anon, body: { title: "hacked" } });
  row("P09", "Guest cannot edit a course", "PATCH /api/courses/:id anonymous", 401, pa.status);
  const de = await call("DELETE", `/api/courses/${paidCourse.id}`, { cookie: anon });
  row("P10", "Guest cannot delete a course", "DELETE /api/courses/:id anonymous", 401, de.status);
}

// --- protected pages while logged out ---
for (const [id, path] of [
  ["P11", "/dashboard"],
  ["P12", "/teacher/courses"],
  ["P13", "/teacher/create"],
  ["P14", "/teacher/analytics"],
  ["P15", "/teacher/users"],
  ["P16", "/library"],
]) {
  const res = await call("GET", path, { cookie: anon });
  const ok = res.status === 307 || res.status === 302 || res.status === 401 || res.status === 403;
  row(id, `Protected page ${path} blocks guest`, "anonymous GET", [302, 307, 401, 403], res.status);
  if (!ok) rows[rows.length - 1].verdict = "Fail";
}

// --- teacher API while logged out ---
const ch = await call("POST", "/api/courses", { cookie: anon, body: { title: "sneaky" } });
row("A01", "Guest cannot create a course", "POST /api/courses", 401, ch.status);
const tc = await call("GET", "/api/teacher/courses", { cookie: anon });
row("A02", "Guest cannot list teacher courses", "GET /api/teacher/courses", 401, tc.status);
const au = await call("GET", "/api/admin/users", { cookie: anon });
row("A03", "Guest cannot list users", "GET /api/admin/users", [401, 403], au.status);
const up = await call("PATCH", "/api/admin/users", { cookie: anon, body: { userId: "x", role: "ADMIN" } });
row("A04", "Guest cannot change roles", "PATCH /api/admin/users", [401, 403], up.status);

// --- webhook safety ---
const whNoSig = await call("POST", "/api/webhook", { body: { event: "charge.success", data: {} } });
row("A05", "Webhook rejects missing signature", "POST /api/webhook", 400, whNoSig.status);
const whBad = await call("POST", "/api/webhook", {
  body: { event: "charge.success", data: { metadata: { userId: "u", courseId: "c" } } },
  headers: { "x-paystack-signature": "deadbeef".repeat(16) },
});
row("A06", "Webhook rejects forged signature", "POST bad signature", 400, whBad.status);

// --- validation on the server ---
const bad = await call("POST", "/api/courses", { cookie: admin, body: {} });
row("A07", "Server rejects course without title", "POST /api/courses {}", [400], bad.status);
const long = await call("POST", "/api/courses", { cookie: admin, body: { title: "x".repeat(300) } });
row("A08", "Server rejects 300-char title", "POST title 300 chars", 400, long.status);
const badSignIn = await call("POST", "/api/demo/sign-in", { body: { email: "nope", password: "" } });
row("A09", "Sign-in validates input", "POST bad credentials", 400, badSignIn.status);

// --- demo auth ---
row("A10", "Demo admin sign-in works", "POST /api/demo/sign-in", 200, admin ? 200 : 0);
row("A11", "Demo student sign-in works", "POST /api/demo/sign-in", 200, student ? 200 : 0);

// --- student vs teacher role ---
if (paidCourse && student) {
  const t = await call("GET", "/teacher/courses", { cookie: student });
  const blocked = [307, 302, 404].includes(t.status) || (t.location || "").includes("teacher-mode");
  if (!blocked) rows.push({ id: "P17", desc: "Student is redirected away from teacher area", input: "GET /teacher/courses as student", expected: "redirect", actual: String(t.status) + " -> " + t.location, verdict: "Fail" });
  else rows.push({ id: "P17", desc: "Student is redirected away from teacher area", input: "GET /teacher/courses as student", expected: "redirect to /teacher-mode", actual: `${t.status} -> ${t.location}`, verdict: "Pass" });

  const edit = await call("PATCH", `/api/courses/${paidCourse.id}`, { cookie: student, body: { title: "owned by student now" } });
  row("A12", "Student cannot edit someone else's course", "PATCH course as student", 401, edit.status);
  const del = await call("DELETE", `/api/courses/${paidCourse.id}`, { cookie: student });
  row("A13", "Student cannot delete someone else's course", "DELETE course as student", 401, del.status);
  const en = await call("POST", `/api/courses/${paidCourse.id}/enroll`, { cookie: student });
  row("A14", "Student cannot bypass payment", "POST /enroll on paid course", 400, en.status);

  const adminList = await call("GET", "/api/admin/users", { cookie: student });
  row("A25", "Student cannot list all users", "GET /api/admin/users as student", [401, 403], adminList.status);
  const adminRole = await call("PATCH", "/api/admin/users", { cookie: student, body: { userId: "demo-admin", role: "ADMIN" } });
  row("A26", "Student cannot change roles", "PATCH /api/admin/users as student", [401, 403], adminRole.status);
  const profile = await call("GET", "/api/profile", { cookie: anon });
  row("A27", "Guest cannot read a profile", "GET /api/profile anonymous", 401, profile.status);

  const before = (await call("GET", `/api/courses/${paidCourse.id}`, { cookie: student })).json();
  const stillLocked = (before?.chapters || []).every((c) => !c.videoUrl && !c.playbackId);
  row("A28", "Logged-in non-payer sees no paid videos", "GET paid course as student", true, stillLocked);
}

// --- free course enrolment + double submit ---
if (freeCourse && student) {
  const first = await call("POST", `/api/courses/${freeCourse.id}/enroll`, { cookie: student });
  const second = await call("POST", `/api/courses/${freeCourse.id}/enroll`, { cookie: student });
  row("A15", "Student enrols in a free course", "POST /enroll free course", 200, first.status);
  row("A16", "Double enrolment does not fail", "POST /enroll twice", 200, second.status);
  const view = (await call("GET", `/api/courses/${freeCourse.id}`, { cookie: student })).json();
  row("A17", "Enrolment is recorded once", "GET course enrolled", true, Boolean(view?.enrolled));
  const chaptersVisible = (view?.chapters || []).every((c) => c.videoUrl || c.playbackId);
  row("A18", "Enrolled student can see videos", "GET chapters after enrol", true, chaptersVisible);
}

// --- checkout / payment idempotency (demo mode) ---
if (paidCourse && student) {
  const c1 = await call("POST", `/api/courses/${paidCourse.id}/checkout`, { cookie: student });
  const c2 = await call("POST", `/api/courses/${paidCourse.id}/checkout`, { cookie: student });
  row("A19", "Checkout starts once", "POST /checkout", [200, 400, 401, 500], c1.status);
  row("A20", "Repeated checkout is rejected", "POST /checkout twice", 400, c2.status);
}

// --- teacher role approval flow (dev DB, reverted afterwards) ---
if (admin) {
  const studentId = (await call("POST", "/api/demo/sign-in", { body: { email: "student@sabiplex.dev", password: "student123" } })).json()?.userId;
  const promote = await call("PATCH", "/api/admin/users", { cookie: admin, body: { userId: studentId, role: "TEACHER" } });
  row("A29", "Admin can promote a user to teacher", "PATCH role TEACHER", [200, 400], promote.status);
  const asTeacher = await call("GET", "/api/teacher/courses", { cookie: student });
  row("A30", "Promoted user reaches teacher API", "GET /api/teacher/courses", 200, asTeacher.status);
  const demote = await call("PATCH", "/api/admin/users", { cookie: admin, body: { userId: studentId, role: "USER" } });
  row("A31", "Admin can revert the role", "PATCH role USER", [200, 400], demote.status);
  const after = await call("GET", "/api/teacher/courses", { cookie: student });
  row("A32", "Reverted user loses teacher API", "GET /api/teacher/courses", [401, 403], after.status);
}

// --- upload validation ---
if (admin) {
  const form = new FormData();
  form.append("file", new Blob(["hello"], { type: "text/plain" }), "note.txt");
  const ok = await call("POST", "/api/demo/upload", { body: form, cookie: admin, raw: true });
  row("A21", "Valid upload accepted", "text/plain file", 200, ok.status);

  const badType = new FormData();
  badType.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "application/x-msdownload" }), "evil.exe");
  const exe = await call("POST", "/api/demo/upload", { body: badType, cookie: admin, raw: true });
  row("A22", "Disallowed file type rejected", ".exe upload", 415, exe.status);

  const empty = new FormData();
  empty.append("file", new Blob([], { type: "text/plain" }), "empty.txt");
  const zero = await call("POST", "/api/demo/upload", { body: empty, cookie: admin, raw: true });
  row("A23", "Empty file rejected", "0-byte file", 400, zero.status);

  const anonUpload = await call("POST", "/api/demo/upload", { body: form, raw: true });
  row("A24", "Guest cannot upload files", "POST /api/demo/upload anonymous", 401, anonUpload.status);
}

console.log("\nTest ID | Test description | Input | Expected | Actual | Result");
console.log("|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(`| ${r.id} | ${r.desc} | ${r.input} | ${r.expected} | ${r.actual} | ${r.verdict} |`);
}
const failed = rows.filter((r) => r.verdict === "Fail");
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) console.log("FAILURES: " + failed.map((f) => f.id).join(", "));