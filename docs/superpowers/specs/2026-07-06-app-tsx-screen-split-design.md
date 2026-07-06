# App.tsx 화면 컴포넌트 분리 — 설계 (Design)

**작성일**: 2026-07-06

## 문제

`src/App.tsx`가 782줄 단일 파일로, 다음이 전부 뒤섞여 있다:
- 상태 머신 로직 (API 호출, localStorage, `viewState` 전이) — 유지되어야 함
- 6개 화면 상태(`loading`/`invalid_store`/`network_error`/`stamps_view`/`already_stamped`/`reward_success`)의 인라인 JSX
- 테스터 관리자 패널 UI (~120줄) — 최근 보안 수정(`fix/tester-panel-prod-gating`)에서 `import.meta.env.DEV` 게이팅만 적용하고 컴포넌트 추출은 이번으로 미뤄둠
- 색종이(confetti) 연출 배경 (`CONFETTI_PARTICLES` + 렌더링, `stamps_view`/`reward_success` 양쪽에서 공용)

`Header`/`PhoneInput`/`TermsConsent`/`StampGrid`는 이미 `src/components/`에 분리되어 있는데, 나머지 화면들만 분리되지 않아 일관성이 없다.

## 목표

App.tsx를 상태 머신(뷰 전이 + API 호출)만 남기고, 각 화면과 부가 UI를 독립된 표현(presentational) 컴포넌트로 분리한다. **비즈니스 로직/상태 관리 구조는 바꾸지 않는다** — 순수 리팩터링(동작 변경 없음).

## 범위

- 포함: `src/App.tsx`에서 JSX를 8개 파일로 추출 (아래 컴포넌트 목록)
- 제외: 커스텀 훅으로의 상태/API 로직 추출, 시각적 디자인 변경, 새 기능 추가 — 전부 별도 후속 작업

## 설계

### 폴더 구조

기존 컨벤션을 따라 서브폴더 없이 `src/components/`에 평평하게 추가한다 (현재 컴포넌트 4개뿐인 저장소 규모에 서브폴더는 과함).

### 새로 만들 컴포넌트

| 파일 | 대체 대상 (App.tsx 현재 라인) | Props |
|---|---|---|
| `src/components/LoadingScreen.tsx` | `viewState === "loading"` 블록 (451-470) | 없음 (정적 스켈레톤) |
| `src/components/InvalidStoreScreen.tsx` | `viewState === "invalid_store"` 블록 (472-500) | `onSelectStore: (code: string) => void` |
| `src/components/NetworkErrorScreen.tsx` | `viewState === "network_error"` 블록 (502-523) | `onRetry: () => void` |
| `src/components/StampsScreen.tsx` | `viewState === "stamps_view"` 블록 (546-617) | `store: Store`, `maskedPhone: string`, `name: string`, `currentStamps: number`, `stampGoal: number`, `newStampAdded: boolean`, `lastStampedAt: string \| null`, `activeColor: string`, `onResetPhone: () => void` |
| `src/components/AlreadyStampedScreen.tsx` | `viewState === "already_stamped"` 블록 (620-668) | `store: Store`, `maskedPhone: string`, `currentStamps: number`, `stampGoal: number`, `lastStampedAt: string \| null`, `activeColor: string`, `onResetPhone: () => void` |
| `src/components/RewardSuccessScreen.tsx` | `viewState === "reward_success"` 블록 (671-744) | `store: Store`, `maskedPhone: string`, `activeColor: string`, `onStartNewCard: () => void`, `onResetPhone: () => void` |
| `src/components/DevToolsPanel.tsx` | 테스터 패널 div + 플로팅 재오픈 버튼 (283-418, `import.meta.env.DEV` 게이팅 포함 이동) | `storeCode: string`, `onSelectStoreCode: (code: string) => void`, `offlineMode: boolean`, `onToggleOffline: () => void`, `phone: string`, `name: string`, `currentStamps: number`, `stampGoal: number`, `onSetStamps: (n: number) => void`, `onResetTodayLimit: () => void`, `onResetAccount: () => void`, `showTesterPanel: boolean`, `onHide: () => void`, `onShow: () => void` |
| `src/components/ConfettiOverlay.tsx` | `CONFETTI_PARTICLES` 상수 + 렌더링 블록 (28-39, 426-437) | 없음 (정적 파티클) |

`maskedPhone`은 App.tsx의 기존 `getMaskedPhone(phone)` 헬퍼로 미리 계산해 문자열로 넘긴다 (각 화면 컴포넌트가 마스킹 로직을 중복 구현하지 않도록). 이 헬퍼 함수 자체는 App.tsx에 그대로 둔다 — 새 유틸 모듈을 만들 만큼 로직이 크지 않음.

### App.tsx에 남는 것

- 모든 `useState`/`useEffect`
- `loadStoreDetails`, `fetchUserStamps`, `handlePhoneSubmit`, `handleEarnStamp`, `handleBackToPhoneInput`, `handleResetPhone`, `getMaskedPhone`, `simulateResetAccount`, `simulateResetTodayLimit`, `simulateSetStamps` — 전부 그대로
- `viewState`에 따라 위 8개 컴포넌트 중 하나를 렌더링하는 최상위 JSX (`Header`, `PhoneInput`, `TermsConsent`, `StampGrid` 호출과 동일한 패턴)
- Footer(약관/개인정보 링크) — 8개 화면 중 어디에도 속하지 않는 공통 레이아웃이라 App.tsx에 유지

### 데이터 흐름

변경 없음. 각 컴포넌트는 지금 인라인 JSX가 클로저로 참조하던 state/handler를 대신 props로 받는다 — 단방향 데이터 흐름 그대로.

### 에러 처리 / 검증

로직 변경이 전혀 없는 순수 이동이므로, 검증의 핵심은 "기존 동작이 100% 그대로 보존되는가"이다. 테스트 프레임워크가 없으므로:
1. `npm run lint` (`tsc --noEmit`)로 타입 오류 없는지 확인
2. `npm run dev` 후 테스터 패널로 6개 화면 상태를 각각 전환하며 리팩터링 전과 시각적으로 동일한지 수동 확인 (매장 전환, 오프라인 모드, 스탬프 강제 설정 등 테스터 기능도 그대로 동작하는지 포함)
3. `npm run build`로 프로덕션 빌드가 깨지지 않는지 확인, 이전 보안 수정에서 확인한 tree-shaking(테스터 패널 문자열 부재)도 재확인

## 커밋 계획

컴포넌트 추출은 화면 단위로 나누기엔 상호 의존이 없어 병렬 가능하지만, 원자적 커밋 원칙(`docs/AGENTS.md`)상 "화면 컴포넌트 추출"이라는 단일 논리적 작업이므로 하나의 커밋으로 묶는다 (UI 내부에서의 파일 분리는 성격이 다른 작업이 아님 — App.tsx도, 새 컴포넌트 파일도 전부 프론트엔드 UI 레이어).

- `refactor: App.tsx 화면 컴포넌트 8개로 분리`
