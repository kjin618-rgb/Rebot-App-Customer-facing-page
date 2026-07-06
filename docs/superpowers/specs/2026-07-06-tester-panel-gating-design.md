# 테스터 패널 프로덕션 노출 차단 — 설계 (Design)

**작성일**: 2026-07-06

## 문제

- `src/App.tsx`의 관리자/테스터 패널(매장 강제 전환, 스탬프 강제 조작 등)이 `showTesterPanel` 기본값 `true`와 환경 분기 부재로 인해 **Vercel Preview·Production 어디에서나 실제 고객에게 노출**될 수 있는 상태.
- 백엔드 `POST /api/test/reset`(`src/lib/stamp-handlers.ts:175`)이 인증·환경 체크 없이 열려 있어, 전화번호만 알면 누구든 고객 스탬프 데이터를 직접 조작 가능.

## 목표

테스터 패널과 관련 API를 **로컬 개발 환경(`npm run dev`)에서만** 동작하도록 제한하고, Vercel Preview/Production을 포함한 그 외 모든 환경에서는 완전히 제거·차단한다.

## 범위

- 포함: `src/App.tsx` (프론트엔드 게이팅), `src/lib/stamp-handlers.ts` (백엔드 게이팅), `server.ts` (중복 핸들러, 일관성 차원)
- 제외: App.tsx 구조 리팩터링(컴포넌트 분리), 시각적 UX 개선 — 별도 후속 작업으로 분리

## 설계

### 1. 프론트엔드 게이팅 (`src/App.tsx`)

- 테스터 패널 블록(약 284~402번 줄)과 "테스터 도구 열기" 플로팅 재오픈 버튼(약 408~416번 줄) **양쪽 모두**를 `import.meta.env.DEV &&` 조건으로 감싼다.
  - 재오픈 버튼도 함께 감싸야 하는 이유: `showTesterPanel` 상태만 초기값을 바꾸면, 프로덕션에서도 재오픈 버튼이 남아있어 클릭 시 패널이 다시 열릴 수 있음.
- `import.meta.env.DEV`는 Vite가 빌드 타임에 정적으로 치환하는 상수이므로, `vite build`(Preview/Production 배포가 공통으로 사용하는 빌드 커맨드) 결과물에서는 두 블록 모두 데드코드로 완전히 제거된다.

### 2. 백엔드 게이팅 — `src/lib/stamp-handlers.ts`

- `/api/test/reset` 핸들러(174번 줄) 최상단에 가드 추가:
  ```ts
  if (process.env.VERCEL) {
    send(res, 404, { error: 'not_found' });
    return true;
  }
  ```
- 근거: Vercel은 Preview·Production 구분 없이 모든 배포 환경에 `VERCEL` 환경변수를 자동 주입하므로, 이 값이 존재하면 무조건 차단된다. 반대로 순수 로컬 `vite dev` 환경에서는 이 변수가 없으므로 정상 동작한다.

### 3. 백엔드 게이팅 — `server.ts` (일관성 목적, 배포에는 미사용)

- `server.ts`는 Vercel 배포에 관여하지 않는(vercel.json 확인 완료) 로컬 전용 대체 서버지만, `/api/test/reset` 핸들러를 중복 보유하고 있어 동일 원칙 적용:
  ```ts
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "not_found" });
  }
  ```
- 이 파일이 이미 `NODE_ENV`로 dev/prod를 구분하는 기존 컨벤션을 그대로 따름.

## 에러 처리

- 차단된 요청은 기존 API 에러 포맷과 동일하게 `404 { error: 'not_found' }`로 응답 — 별도 에러 포맷 신설 없음.

## 검증 (테스트 프레임워크 부재로 수동 검증)

1. `npm run dev` 실행 후 테스터 패널이 정상적으로 보이는지 확인.
2. `npm run build` 후 `dist/` 산출물에서 "Admin Test Suite", "테스터 도구" 등 패널 고유 문자열이 존재하지 않는지 grep으로 확인 (번들 제거 증빙).
3. `VERCEL=1 node -e ...` 또는 로컬에서 환경변수 설정 후 `/api/test/reset` 호출 시 404 응답 확인.

## 커밋 계획 (Atomic Commit)

`docs/AGENTS.md` 원칙상 UI 변경과 백엔드 로직 변경은 성격이 다르므로 별도 커밋으로 분리한다.

1. `fix: 테스터 관리자 패널 프로덕션 노출 차단` — `src/App.tsx` (프론트엔드 게이팅만)
2. `fix: test-reset API 프로덕션 환경 차단` — `src/lib/stamp-handlers.ts`, `server.ts` (백엔드 게이팅, 동일 목적의 로직 변경이라 함께 묶음)
