# 테스터 패널 프로덕션 노출 차단 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자/테스터 패널과 `/api/test/reset` 엔드포인트가 Vercel Preview·Production 등 배포 환경에 노출되지 않고, 로컬 `npm run dev` 환경에서만 동작하도록 만든다.

**Architecture:** 기존 구조를 바꾸지 않고 두 지점에 환경 분기 조건만 추가한다. 프론트엔드는 Vite의 빌드타임 상수 `import.meta.env.DEV`로 JSX 블록 두 곳을 감싸 프로덕션 번들에서 완전히 제거(tree-shaking)한다. 백엔드는 각 서버 구현체가 이미 쓰고 있는 기존 환경변수 관례(Vercel은 `process.env.VERCEL`, `server.ts`는 `process.env.NODE_ENV`)를 그대로 활용해 `/api/test/reset` 핸들러 최상단에 조기 차단(guard)을 추가한다.

**Tech Stack:** React 19, TypeScript, Vite 6 (`import.meta.env.DEV`), Node.js `http` (Vercel 서버리스), Express (`server.ts`)

## Global Constraints

- 스펙 문서: `docs/superpowers/specs/2026-07-06-tester-panel-gating-design.md` (본 계획의 근거 문서)
- 브랜치: `fix/tester-panel-prod-gating` (이미 `dev` 기준으로 생성됨, 현재 체크아웃된 상태)
- 커밋 분리 원칙(`docs/AGENTS.md`): UI 변경(`src/App.tsx`)과 백엔드 로직 변경(`stamp-handlers.ts`, `server.ts`)은 반드시 별도 커밋으로 분리한다.
- 커밋 메시지에 "수정/업데이트" 같은 모호한 단어 금지, 정확히 어떤 기능이 어떻게 바뀌었는지 명시 (`docs/CLAUDE_CODE_GUIDE.md`)
- 브랜치명·커밋 메시지·문서 어디에도 개인 이름 노출 금지, "리더/팀장/결재/상급자" 등 위계 단어 금지 (`docs/AGENTS.md`)
- 이 저장소에는 자동화된 테스트 프레임워크가 없다 (`*.test.*`/`*.spec.*` 파일 0개, `npm run lint`는 `tsc --noEmit`뿐). 각 태스크의 검증은 수동 커맨드(빌드 후 grep, curl)로 수행한다.
- 범위 외: `App.tsx` 구조 리팩터링(컴포넌트 분리), 시각적 UX 개선 — 별도 후속 작업.

---

### Task 1: 프론트엔드 테스터 패널 dev-only 게이팅

**Files:**
- Modify: `src/App.tsx:63` (state 초기값)
- Modify: `src/App.tsx:283-284` 및 `src/App.tsx:396-403` (패널 감싸기 시작/종료)
- Modify: `src/App.tsx:407-408` (플로팅 재오픈 버튼 조건)

**Interfaces:**
- Consumes: 없음 (기존 `showTesterPanel` state, Vite 내장 `import.meta.env.DEV`만 사용)
- Produces: 없음 (다음 태스크는 이 파일과 무관한 백엔드 파일을 수정)

- [ ] **Step 1: `showTesterPanel` 초기값을 dev 환경에서만 `true`가 되도록 변경**

`src/App.tsx`에서 다음을 찾는다:

```tsx
  const [testStampTarget, setTestStampTarget] = useState<number>(9);
  const [showTesterPanel, setShowTesterPanel] = useState<boolean>(true);
```

다음으로 교체한다:

```tsx
  const [testStampTarget, setTestStampTarget] = useState<number>(9);
  const [showTesterPanel, setShowTesterPanel] = useState<boolean>(import.meta.env.DEV);
```

- [ ] **Step 2: 테스터 관리자 패널 블록 시작 부분에 dev 조건 래퍼 추가**

`src/App.tsx`에서 다음을 찾는다 (관리자 패널의 시작 부분):

```tsx
      {/* 1. Left side control/tester suite - Only visible in desktop mode or toggled */}
      <div className={`w-full md:w-[350px] bg-stone-900 text-stone-100 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800 transition-all duration-300 ${showTesterPanel ? "block" : "hidden"}`}>
```

다음으로 교체한다:

```tsx
      {/* 1. Left side control/tester suite - dev 환경에서만 렌더링 (프로덕션 노출 차단) */}
      {import.meta.env.DEV && (
      <div className={`w-full md:w-[350px] bg-stone-900 text-stone-100 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800 transition-all duration-300 ${showTesterPanel ? "block" : "hidden"}`}>
```

- [ ] **Step 3: 테스터 관리자 패널 블록 종료 부분에 닫는 괄호 추가**

`src/App.tsx`에서 다음을 찾는다 (관리자 패널의 종료 부분, "2. Main Mobile Preview Container" 주석 직전):

```tsx
        <div className="pt-6 border-t border-stone-800/60 text-[11px] text-stone-500 space-y-1">
          <p>리봇 모바일 웹 프로토타입 테스터 바</p>
          <p>QR 코드 스캔 시나리오를 자유롭게 변경하고 즉각 피드백을 확인해 보세요.</p>
        </div>
      </div>

      {/* 2. Main Mobile Preview Container */}
```

다음으로 교체한다:

```tsx
        <div className="pt-6 border-t border-stone-800/60 text-[11px] text-stone-500 space-y-1">
          <p>리봇 모바일 웹 프로토타입 테스터 바</p>
          <p>QR 코드 스캔 시나리오를 자유롭게 변경하고 즉각 피드백을 확인해 보세요.</p>
        </div>
      </div>
      )}

      {/* 2. Main Mobile Preview Container */}
```

- [ ] **Step 4: 플로팅 "테스터 도구 열기" 재오픈 버튼도 dev 조건에 포함**

`src/App.tsx`에서 다음을 찾는다:

```tsx
        {/* Floating Tester toggle - Only when hidden */}
        {!showTesterPanel && (
```

다음으로 교체한다:

```tsx
        {/* Floating Tester toggle - dev 환경에서만, 패널이 숨겨졌을 때 */}
        {import.meta.env.DEV && !showTesterPanel && (
```

- [ ] **Step 5: TypeScript 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료 (exit code 0). `import.meta.env.DEV`는 Vite가 `boolean` 타입으로 제공하므로 `useState<boolean>` 타입과 충돌 없음.

- [ ] **Step 6: 로컬 개발 환경에서 패널이 정상적으로 보이는지 확인**

Run: `npm run dev`

브라우저(또는 `curl http://localhost:5173/`)로 접속해 좌측에 "Rebot Admin Test Suite" 패널이 정상적으로 렌더링되는지 확인한다.
Expected: 패널이 이전과 동일하게 보임 (dev 환경이므로 `import.meta.env.DEV`가 `true`).

- [ ] **Step 7: 프로덕션 빌드에서 패널 관련 코드가 완전히 제거됐는지 확인**

Run:
```bash
npm run build
grep -r "테스터 도구 열기" dist/ ; echo "exit: $?"
```
Expected: grep이 아무것도 찾지 못해 `exit: 1` 출력. (문자열이 발견되면 게이팅이 잘못된 것이므로 Step 2~4를 다시 확인)

- [ ] **Step 8: 커밋**

```bash
git add src/App.tsx
git commit -m "fix: 테스터 관리자 패널 프로덕션 노출 차단

import.meta.env.DEV 조건으로 감싸 vite build(Preview/Production 공통 빌드 커맨드) 결과물에서 완전히 제거되도록 함"
```

---

### Task 2: 백엔드 `/api/test/reset` 프로덕션 환경 차단

**Files:**
- Modify: `src/lib/stamp-handlers.ts:174-176` (Vercel 서버리스 + vite dev 플러그인 공용 핸들러)
- Modify: `server.ts:230-233` (로컬 전용 Express 대체 서버의 중복 핸들러)

**Interfaces:**
- Consumes: 없음 (Task 1과 독립적인 파일)
- Produces: 없음

- [ ] **Step 1: `stamp-handlers.ts`의 `/api/test/reset` 핸들러에 Vercel 환경 차단 가드 추가**

`src/lib/stamp-handlers.ts`에서 다음을 찾는다:

```ts
  // POST /api/test/reset
  if (url === '/api/test/reset' && method === 'POST') {
    const { phone, storeCode, action, stamps } = await parseBody(req);
```

다음으로 교체한다:

```ts
  // POST /api/test/reset (로컬 개발 전용 — Vercel 환경(Preview/Production)에서는 차단)
  if (url === '/api/test/reset' && method === 'POST') {
    if (process.env.VERCEL) {
      send(res, 404, { error: 'not_found' });
      return true;
    }
    const { phone, storeCode, action, stamps } = await parseBody(req);
```

- [ ] **Step 2: `server.ts`의 중복 핸들러에도 동일 원칙으로 프로덕션 차단 가드 추가**

`server.ts`에서 다음을 찾는다:

```ts
  // POST /api/test/reset (dev testing only)
  app.post("/api/test/reset", async (req, res) => {
    const { phone, storeCode, action, stamps } = req.body;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
```

다음으로 교체한다:

```ts
  // POST /api/test/reset (dev testing only — production 환경에서는 차단)
  app.post("/api/test/reset", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "not_found" });
    }
    const { phone, storeCode, action, stamps } = req.body;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
```

- [ ] **Step 3: TypeScript 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료.

- [ ] **Step 4: 로컬 개발 환경(VERCEL 미설정)에서 엔드포인트가 정상 동작하는지 확인**

Run: `npm run dev` (다른 터미널에서 유지한 채)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5173/api/test/reset \
  -H "Content-Type: application/json" \
  -d '{"phone":"01000000000","storeCode":"cafe-rebot","action":"reset-today"}'
```
Expected: `200` (VERCEL 환경변수가 없으므로 정상 통과 — Supabase 연동 여부에 따라 500이 날 수도 있으나, 404가 아니면 가드가 통과했다는 뜻이므로 정상)

- [ ] **Step 5: `VERCEL=1` 시뮬레이션 시 엔드포인트가 차단되는지 확인**

`npm run dev`를 중단하고 아래처럼 `VERCEL=1`을 주입해 재실행:

```bash
VERCEL=1 npm run dev
```

다른 터미널에서:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5173/api/test/reset \
  -H "Content-Type: application/json" \
  -d '{"phone":"01000000000","storeCode":"cafe-rebot","action":"reset-today"}'
```
Expected: `404`

확인 후 `VERCEL=1 npm run dev` 프로세스를 종료하고(Ctrl+C), 다음 단계 전에 일반 `npm run dev`로 되돌려 놓는다.

- [ ] **Step 6: `server.ts`의 `NODE_ENV=production` 차단 확인**

```bash
NODE_ENV=production npx tsx server.ts &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/test/reset \
  -H "Content-Type: application/json" \
  -d '{"phone":"01000000000","storeCode":"cafe-rebot","action":"reset-today"}'
kill %1
```
Expected: `404`

- [ ] **Step 7: 커밋**

```bash
git add src/lib/stamp-handlers.ts server.ts
git commit -m "fix: test-reset API 프로덕션 환경 차단

Vercel(Preview/Production)에서는 process.env.VERCEL 체크로,
server.ts 로컬 대체 서버는 기존 NODE_ENV 관례를 그대로 활용해
POST /api/test/reset 요청을 404로 조기 차단"
```

---

## 완료 후 확인 사항 (구현 계획 범위 밖, 참고용)

- 두 커밋이 모두 `fix/tester-panel-prod-gating` 브랜치에 쌓였는지 `git log --oneline -3`으로 확인
- `dev`로 PR을 올릴지 여부는 구현 완료 후 별도로 결정 (superpowers:finishing-a-development-branch 절차 참고)
