# App.tsx 화면 컴포넌트 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/App.tsx`(782줄)에 인라인으로 섞여 있는 6개 화면 상태 JSX와 테스터 패널, 색종이 연출을 8개의 독립 컴포넌트로 추출하고, App.tsx는 상태 머신(뷰 전이 + API 호출)만 남긴다. 순수 리팩터링이며 동작 변경은 없다.

**Architecture:** 새 컴포넌트 8개를 `src/components/`에 평평하게 추가(기존 `Header`/`PhoneInput`/`TermsConsent`/`StampGrid`와 동일한 위치 컨벤션)한 뒤, App.tsx의 `return (...)` JSX 블록 전체를 새 컴포넌트 호출로 교체한다. 모든 데이터/핸들러는 지금처럼 props로 전달한다(Context나 커스텀 훅 도입 없음).

**Tech Stack:** React 19, TypeScript, Vite 6, lucide-react 아이콘

## Global Constraints

- 스펙 문서: `docs/superpowers/specs/2026-07-06-app-tsx-screen-split-design.md`
- 브랜치: `refactor/app-tsx-screen-split` (이미 `dev` 기준으로 생성됨, 현재 체크아웃된 상태)
- 이 저장소에는 자동화된 테스트 프레임워크가 없다 (`*.test.*`/`*.spec.*` 파일 0개). 각 태스크의 검증은 `npm run lint`(`tsc --noEmit`) + 수동 `npm run dev` 확인으로 수행한다.
- 순수 리팩터링 원칙: 로직/동작을 단 1줄도 바꾸지 않는다. 클래스명, 텍스트, 조건문, 헬퍼 함수 전부 원본 그대로 복사한다.
- **스펙 문서 대비 변경 사항 (계획 수립 중 발견):** 스펙은 "플로팅 테스터 재오픈 버튼"도 `DevToolsPanel`에 포함하도록 제안했으나, 이 버튼은 `absolute top-4 left-4`로 위치가 지정되어 있고 그 기준점(`position: relative`)은 테스터 패널이 아니라 "2. Main Mobile Preview Container" `<div>`다. `DevToolsPanel` 안에 이 버튼을 넣으면 렌더링 위치가 다른 DOM 트리로 옮겨져 기준 컨테이너가 바뀌고 실제로 버튼 위치가 어긋나는 시각적 회귀가 발생한다. 따라서 **`DevToolsPanel`은 좌측 사이드바 패널만 담당**하고, 플로팅 재오픈 버튼은 지금처럼 App.tsx의 "Main Mobile Preview Container" 내부에 인라인으로 남긴다 (조건문은 동일하게 `import.meta.env.DEV && !showTesterPanel`).
- 브랜치명·커밋 메시지에 개인 이름/위계 단어 사용 금지 (`docs/AGENTS.md`)

---

### Task 1: 정적/단순 화면 컴포넌트 4개 추출 (LoadingScreen, ConfettiOverlay, InvalidStoreScreen, NetworkErrorScreen)

**Files:**
- Create: `src/components/LoadingScreen.tsx`
- Create: `src/components/ConfettiOverlay.tsx`
- Create: `src/components/InvalidStoreScreen.tsx`
- Create: `src/components/NetworkErrorScreen.tsx`

**Interfaces:**
- Consumes: 없음 (App.tsx는 아직 이 파일들을 import하지 않음 — Task 4에서 연결)
- Produces:
  - `LoadingScreen: React.FC` (props 없음)
  - `ConfettiOverlay: React.FC` (props 없음)
  - `InvalidStoreScreen: React.FC<{ onSelectStore: (code: string) => void }>`
  - `NetworkErrorScreen: React.FC<{ onRetry: () => void }>`

- [ ] **Step 1: `src/components/LoadingScreen.tsx` 생성**

```tsx
import React from "react";
import { Coffee } from "lucide-react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6" id="skeleton-view">
      <div className="w-16 h-16 bg-[#F5F2EB] rounded-2xl animate-pulse flex items-center justify-center">
        <Coffee className="w-8 h-8 text-[#8D7B73]/30" />
      </div>
      <div className="space-y-3 w-full text-center">
        <div className="h-5 w-1/2 bg-[#F5F2EB] rounded-md mx-auto animate-pulse" />
        <div className="h-4 w-3/4 bg-[#F5F2EB] rounded-md mx-auto animate-pulse" />
      </div>
      <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 w-full space-y-4 shadow-sm">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-[#F5F2EB] animate-pulse" />
          ))}
        </div>
        <div className="h-8 bg-[#F5F2EB] rounded-xl w-full animate-pulse mt-4" />
      </div>
      <p className="text-xs text-[#8D7B73] animate-pulse">QR 매장 정보를 읽어오고 있습니다...</p>
    </div>
  );
};
```

- [ ] **Step 2: `src/components/ConfettiOverlay.tsx` 생성**

```tsx
import React from "react";

const CONFETTI_PARTICLES = [
  { id: 1, top: "12%", left: "15%", size: "w-3 h-3", color: "bg-red-400 animate-bounce", delay: "delay-100" },
  { id: 2, top: "18%", left: "75%", size: "w-2 h-4", color: "bg-yellow-400 rotate-12", delay: "delay-300" },
  { id: 3, top: "35%", left: "5%", size: "w-3 h-2", color: "bg-teal-500 rotate-45", delay: "delay-200" },
  { id: 4, top: "25%", left: "85%", size: "w-4 h-4", color: "bg-orange-400 rounded-full", delay: "delay-500" },
  { id: 5, top: "45%", left: "90%", size: "w-2.5 h-2.5", color: "bg-pink-400", delay: "delay-75" },
  { id: 6, top: "50%", left: "10%", size: "w-3 h-3", color: "bg-blue-400 rotate-12", delay: "delay-1000" },
  { id: 7, top: "68%", left: "80%", size: "w-2.5 h-3", color: "bg-purple-400 -rotate-12", delay: "delay-150" },
  { id: 8, top: "82%", left: "20%", size: "w-4 h-2", color: "bg-emerald-400 rotate-45", delay: "delay-500" },
  { id: 9, top: "88%", left: "70%", size: "w-3 h-3", color: "bg-indigo-400 rounded-full", delay: "delay-300" },
];

export const ConfettiOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {CONFETTI_PARTICLES.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${particle.size} ${particle.color} ${particle.delay} rounded-sm transition-transform duration-1000`}
          style={{ top: particle.top, left: particle.left }}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 3: `src/components/InvalidStoreScreen.tsx` 생성**

```tsx
import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface InvalidStoreScreenProps {
  onSelectStore: (code: string) => void;
}

export const InvalidStoreScreen: React.FC<InvalidStoreScreenProps> = ({ onSelectStore }) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center" id="invalid-store-view">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mb-5 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-bold text-[#3E2723]" id="invalid-store-heading">매장을 찾을 수 없습니다</h3>
      <p className="text-sm text-[#8D7B73] mt-3 leading-relaxed">
        스캔하신 QR 코드의 매장 정보가 유효하지 않거나 비활성화된 서비스 코드입니다.<br />
        매장 직원에게 문의하시거나 다시 시도해 주세요.
      </p>

      {/* Visual Store switcher list inside mobile */}
      <div className="w-full bg-[#F5F2EB] border border-[#E5E2DA] rounded-2xl p-4 mt-8 space-y-2 text-left">
        <span className="text-[10px] font-bold text-[#8D7B73] uppercase tracking-wider block mb-1">
          데모 매장 선택해보기:
        </span>
        {["cafe-rebot", "sweet-bakery"].map((code) => (
          <button
            key={code}
            onClick={() => onSelectStore(code)}
            className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-orange-50 border border-[#E5E2DA] rounded-xl text-xs font-semibold text-[#3E2723] transition-colors cursor-pointer"
          >
            <span>{code === "cafe-rebot" ? "🌲 리봇 베이커리" : "🥐 달콤 베이커리"}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8D7B73]" />
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: `src/components/NetworkErrorScreen.tsx` 생성**

```tsx
import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface NetworkErrorScreenProps {
  onRetry: () => void;
}

export const NetworkErrorScreen: React.FC<NetworkErrorScreenProps> = ({ onRetry }) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center" id="network-error-view">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-center mb-5 shadow-xs">
        <AlertOctagon className="w-8 h-8 text-rose-600 animate-bounce" />
      </div>
      <h3 className="text-xl font-bold text-[#3E2723]" id="network-error-heading">연결 상태가 좋지 않습니다</h3>
      <p className="text-sm text-[#8D7B73] mt-3 leading-relaxed">
        네트워크 접속이 원활하지 않아 스탬프 정보를 수신할 수 없습니다. 일시적인 현상일 수 있으니 아래 재시도 버튼을 눌러주세요.
      </p>
      <button
        onClick={onRetry}
        className="w-full mt-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        id="retry-network-btn"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도하기
      </button>
    </div>
  );
};
```

- [ ] **Step 5: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료 (exit code 0). 이 4개 파일은 아직 아무 곳에서도 import되지 않지만, 미사용 export는 `tsc --noEmit`에서 에러가 아니므로 통과해야 한다.

- [ ] **Step 6: 커밋**

```bash
git add src/components/LoadingScreen.tsx src/components/ConfettiOverlay.tsx src/components/InvalidStoreScreen.tsx src/components/NetworkErrorScreen.tsx
git commit -m "refactor: 정적/단순 화면 컴포넌트 4개 신규 추출 (App.tsx 미연결 상태)

LoadingScreen, ConfettiOverlay, InvalidStoreScreen, NetworkErrorScreen을
App.tsx 인라인 JSX에서 그대로 복사해 신규 파일로 생성. 아직 App.tsx에서
사용하지 않으므로 동작 변화 없음 (다음 태스크에서 연결)"
```

---

### Task 2: 스탬프 관련 화면 컴포넌트 3개 추출 (StampsScreen, AlreadyStampedScreen, RewardSuccessScreen)

**Files:**
- Create: `src/components/StampsScreen.tsx`
- Create: `src/components/AlreadyStampedScreen.tsx`
- Create: `src/components/RewardSuccessScreen.tsx`

**Interfaces:**
- Consumes: `Store` 타입 (`src/types.ts`), `StampGrid` 컴포넌트 (`src/components/StampGrid.tsx`, 기존 파일, 이미 존재)
- Produces:
  - `StampsScreen: React.FC<{ store: Store; maskedPhone: string; name: string; currentStamps: number; stampGoal: number; newStampAdded: boolean; lastStampedAt: string | null; activeColor: string; onResetPhone: () => void }>`
  - `AlreadyStampedScreen: React.FC<{ store: Store; maskedPhone: string; currentStamps: number; stampGoal: number; lastStampedAt: string | null; activeColor: string; onResetPhone: () => void }>`
  - `RewardSuccessScreen: React.FC<{ store: Store; maskedPhone: string; activeColor: string; onStartNewCard: () => void; onResetPhone: () => void }>`

- [ ] **Step 1: `src/components/StampsScreen.tsx` 생성**

```tsx
import React from "react";
import { Sparkles, Trophy, Clock } from "lucide-react";
import { Store } from "../types";
import { StampGrid } from "./StampGrid";

interface StampsScreenProps {
  store: Store;
  maskedPhone: string;
  name: string;
  currentStamps: number;
  stampGoal: number;
  newStampAdded: boolean;
  lastStampedAt: string | null;
  activeColor: string;
  onResetPhone: () => void;
}

export const StampsScreen: React.FC<StampsScreenProps> = ({
  store,
  maskedPhone,
  name,
  currentStamps,
  stampGoal,
  newStampAdded,
  lastStampedAt,
  activeColor,
  onResetPhone,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6" id="stamps-success-container">
      <div className="space-y-4">

        {/* Phone Info ribbon */}
        <div className="bg-[#F5F2EB] rounded-2xl px-4 py-3 flex justify-between items-center" id="phone-ribbon">
          <span className="text-xs font-bold text-[#8D7B73] tracking-wide">고객 정보</span>
          <div className="text-right">
            <span className="text-sm font-bold text-[#3E2723] block tracking-wide">
              {maskedPhone}
            </span>
            {name && <span className="text-[11px] text-[#8D7B73] font-medium">{name} 단골님</span>}
          </div>
        </div>

        {/* Stamp added celebration tag */}
        {newStampAdded && (
          <div
            className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center animate-fade-in"
            style={{
              backgroundColor: `${activeColor}12`,
              borderColor: `${activeColor}25`
            }}
            id="stamp-added-celeb-banner"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: activeColor }}>
              <Sparkles className="w-4 h-4 animate-spin" />
              방금 스탬프 1개가 성공적으로 적립되었습니다!
            </div>
          </div>
        )}

        {/* Stamp card widget board */}
        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={newStampAdded}
        />

        {/* Timestamp indicator */}
        {lastStampedAt && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-[#8D7B73] font-medium inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              마지막 적립: {new Date(lastStampedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 mt-6">
        <div className="bg-[#F5F2EB] border border-[#E5E2DA]/60 p-4 rounded-2xl space-y-1.5" id="store-reward-card-info">
          <h5 className="text-xs font-extrabold text-[#8D7B73] uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#F27D26]" />
            리워드 달성 조건
          </h5>
          <p className="text-sm font-extrabold text-[#3E2723] leading-snug">
            스탬프 {stampGoal}개를 모두 모으시면 <span className="text-[#F27D26]">{store.rewardDescription}</span>를 드립니다.
          </p>
        </div>

        <button
          onClick={onResetPhone}
          className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-bold rounded-2xl transition-all cursor-pointer text-sm"
          id="back-to-scan-btn"
        >
          확인 완료 (메인으로)
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: `src/components/AlreadyStampedScreen.tsx` 생성**

```tsx
import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Store } from "../types";
import { StampGrid } from "./StampGrid";

interface AlreadyStampedScreenProps {
  store: Store;
  maskedPhone: string;
  currentStamps: number;
  stampGoal: number;
  lastStampedAt: string | null;
  activeColor: string;
  onResetPhone: () => void;
}

export const AlreadyStampedScreen: React.FC<AlreadyStampedScreenProps> = ({
  store,
  maskedPhone,
  currentStamps,
  stampGoal,
  lastStampedAt,
  activeColor,
  onResetPhone,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in" id="already-stamped-container">
      <div className="space-y-4">
        {/* Warning Header */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start" id="already-stamped-warning">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">오늘 이미 적립하셨습니다</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              리봇 디지털 스탬프는 매장 정책상 1일 1회만 적립이 가능합니다. 내일 다시 방문하여 스탬프를 적립해 주세요!
            </p>
          </div>
        </div>

        {/* Stamp status is shown below */}
        <div className="bg-[#F5F2EB] rounded-2xl px-4 py-3 flex justify-between items-center" id="phone-ribbon">
          <span className="text-xs font-bold text-[#8D7B73] tracking-wide">고객 정보</span>
          <span className="text-sm font-bold text-[#3E2723] block tracking-wide">
            {maskedPhone}
          </span>
        </div>

        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={false}
        />

        {lastStampedAt && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-[#8D7B73] font-medium inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              오늘 적립 시각: {new Date(lastStampedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onResetPhone}
        className="w-full mt-6 py-4 bg-[#4A6741] text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        style={{ backgroundColor: activeColor }}
        id="already-stamped-confirm-btn"
      >
        확인 완료
      </button>
    </div>
  );
};
```

- [ ] **Step 3: `src/components/RewardSuccessScreen.tsx` 생성**

```tsx
import React from "react";
import { Trophy } from "lucide-react";
import { Store } from "../types";

interface RewardSuccessScreenProps {
  store: Store;
  maskedPhone: string;
  activeColor: string;
  onStartNewCard: () => void;
  onResetPhone: () => void;
}

export const RewardSuccessScreen: React.FC<RewardSuccessScreenProps> = ({
  store,
  maskedPhone,
  activeColor,
  onStartNewCard,
  onResetPhone,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in" id="reward-success-container">
      <div className="space-y-6 text-center py-6">

        {/* Big celebratory icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-[#F27D26]/10 flex items-center justify-center mx-auto ring-4 ring-[#F27D26]/20">
            <Trophy className="w-10 h-10 text-[#F27D26] animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-md animate-ping">
            ★
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-[#F27D26] tracking-widest uppercase">REWARD TRIGGERED!</span>
          <h3 className="text-2xl font-black text-[#3E2723] tracking-tight">
            축하합니다! 리워드 달성
          </h3>
          <p className="text-sm text-[#8D7B73] max-w-xs mx-auto leading-relaxed">
            모든 스탬프를 가득 채우셨습니다. 아래 보상 혜택을 사장님께 확인해 주세요.
          </p>
        </div>

        {/* Big Reward voucher display */}
        <div className="bg-white border-2 border-dashed border-[#F27D26] rounded-3xl p-6 shadow-sm relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FDFCF8] border-r border-[#E5E2DA] rounded-full"></div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FDFCF8] border-l border-[#E5E2DA] rounded-full"></div>

          <p className="text-xs font-semibold text-[#8D7B73] mb-1">매장 단골 특별 쿠폰</p>
          <h2 className="text-xl md:text-2xl font-black text-[#F27D26] mb-4" id="reward-desc-celebration">
            {store.rewardDescription}
          </h2>

          <div className="bg-[#F5F2EB] border border-[#E5E2DA] rounded-2xl py-3 px-4 inline-block">
            <p className="text-xs font-bold text-[#3E2723]">사장님께 이 화면을 보여주세요</p>
          </div>
        </div>

        {/* Masked User feedback */}
        <div className="text-center">
          <span className="text-[11px] text-[#8D7B73] font-medium">
            쿠폰 수령자 번호: {maskedPhone}
          </span>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            ※ 다음 카드가 새로 시작되었어요!
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onStartNewCard}
          className="w-full py-4 bg-[#4A6741] text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-transform cursor-pointer"
          style={{ backgroundColor: activeColor }}
          id="start-new-card-btn"
        >
          새 카드 시작하기
        </button>

        <button
          onClick={onResetPhone}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          id="celebration-exit-btn"
        >
          완료 후 메인으로
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료.

- [ ] **Step 5: 커밋**

```bash
git add src/components/StampsScreen.tsx src/components/AlreadyStampedScreen.tsx src/components/RewardSuccessScreen.tsx
git commit -m "refactor: 스탬프 관련 화면 컴포넌트 3개 신규 추출 (App.tsx 미연결 상태)

StampsScreen, AlreadyStampedScreen, RewardSuccessScreen을 App.tsx 인라인
JSX에서 그대로 복사해 신규 파일로 생성. 전화번호 마스킹은 App.tsx의
getMaskedPhone 결과를 maskedPhone prop으로 미리 계산해 전달받는 방식으로
설계 (컴포넌트가 마스킹 로직을 중복 구현하지 않도록). 아직 App.tsx에서
사용하지 않으므로 동작 변화 없음"
```

---

### Task 3: 테스터 관리자 패널 컴포넌트 추출 (DevToolsPanel)

**Files:**
- Create: `src/components/DevToolsPanel.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `DevToolsPanel: React.FC<{ storeCode: string; onSelectStoreCode: (code: string) => void; offlineMode: boolean; onToggleOffline: () => void; phone: string; name: string; currentStamps: number; stampGoal: number; onSetStamps: (n: number) => void; onResetTodayLimit: () => void; onResetAccount: () => void; showTesterPanel: boolean; onHide: () => void }>`

**중요**: 이 컴포넌트는 좌측 사이드바 패널 `<div>` 하나만 렌더링한다. 플로팅 재오픈 버튼은 포함하지 않는다 (Global Constraints의 "스펙 문서 대비 변경 사항" 참고 — 포지셔닝 기준 컨테이너가 달라 여기 포함하면 안 됨).

- [ ] **Step 1: `src/components/DevToolsPanel.tsx` 생성**

```tsx
import React from "react";

interface DevToolsPanelProps {
  storeCode: string;
  onSelectStoreCode: (code: string) => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  phone: string;
  name: string;
  currentStamps: number;
  stampGoal: number;
  onSetStamps: (n: number) => void;
  onResetTodayLimit: () => void;
  onResetAccount: () => void;
  showTesterPanel: boolean;
  onHide: () => void;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  storeCode,
  onSelectStoreCode,
  offlineMode,
  onToggleOffline,
  phone,
  name,
  currentStamps,
  stampGoal,
  onSetStamps,
  onResetTodayLimit,
  onResetAccount,
  showTesterPanel,
  onHide,
}) => {
  return (
    <div className={`w-full md:w-[350px] bg-stone-900 text-stone-100 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800 transition-all duration-300 ${showTesterPanel ? "block" : "hidden"}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold tracking-wider text-stone-400 uppercase">Rebot Admin Test Suite</h3>
          </div>
          <button
            onClick={onHide}
            className="text-xs px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md cursor-pointer transition-colors"
          >
            숨기기
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">1. 매장 스캔 (QR 시뮬레이션)</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onSelectStoreCode("cafe-rebot")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "cafe-rebot" ? "bg-emerald-950 border-emerald-500 text-emerald-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              🌲 리봇 베이커리
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 10개 기준</span>
            </button>
            <button
              onClick={() => onSelectStoreCode("sweet-bakery")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "sweet-bakery" ? "bg-amber-950 border-amber-500 text-amber-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              🥐 달콤 베이커리
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 8개 기준</span>
            </button>
            <button
              onClick={() => onSelectStoreCode("coffee-ground")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "coffee-ground" ? "bg-slate-800 border-slate-500 text-slate-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              ☕ 커피 그라운드
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 12개 기준</span>
            </button>
            <button
              onClick={() => onSelectStoreCode("daily-bread")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "daily-bread" ? "bg-orange-950 border-orange-500 text-orange-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              🍞 매일 브레드
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 5개 기준</span>
            </button>
          </div>
          <button
            onClick={() => onSelectStoreCode("not-found-code")}
            className="w-full py-2.5 text-xs bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-900 rounded-xl transition-all cursor-pointer"
          >
            ⚠️ 잘못된 매장 코드 (404 에러 화면)
          </button>
        </div>

        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">2. 네트워크 상태 시뮬레이션</h4>
          <div className="flex items-center justify-between bg-stone-800/80 p-3 rounded-xl border border-stone-700/60">
            <span className="text-xs font-medium text-stone-300">오프라인 모드 강제 활성</span>
            <button
              onClick={onToggleOffline}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${offlineMode ? "bg-red-600 text-white shadow-md animate-pulse" : "bg-stone-700 hover:bg-stone-600 text-stone-300"}`}
            >
              {offlineMode ? "켜짐 (오류 유도)" : "꺼짐"}
            </button>
          </div>
        </div>

        {phone && (
          <div className="space-y-4 pt-2 border-t border-stone-800/80">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">3. 단골 데이터 수동 조정</h4>
            <div className="bg-stone-800/40 p-3 rounded-xl border border-stone-700/40 space-y-3">
              <div className="text-xs text-stone-400 space-y-1">
                <div>이름: <span className="font-semibold text-stone-200">{name || "(미지정)"}</span></div>
                <div>번호: <span className="font-semibold text-stone-200">{phone}</span></div>
                <div>현재 스탬프: <span className="font-semibold text-stone-100">{currentStamps}개</span></div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-stone-400 font-medium">스탬프 보유수 세팅:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 4, stampGoal - 1].map((val) => (
                    <button
                      key={val}
                      onClick={() => onSetStamps(val)}
                      className="py-1 px-1 bg-stone-800 hover:bg-stone-700 rounded-sm text-[10px] text-stone-300 text-center font-bold"
                    >
                      {val}개
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={onResetTodayLimit}
                  className="w-full py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-800/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  🔄 오늘 이미 적립 제한 초기화
                </button>
                <button
                  onClick={onResetAccount}
                  className="w-full py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-800/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  🗑️ 데이터 완적 삭제 (신규 번호로)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-stone-800/60 text-[11px] text-stone-500 space-y-1">
        <p>리봇 모바일 웹 프로토타입 테스터 바</p>
        <p>QR 코드 스캔 시나리오를 자유롭게 변경하고 즉각 피드백을 확인해 보세요.</p>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료.

- [ ] **Step 3: 커밋**

```bash
git add src/components/DevToolsPanel.tsx
git commit -m "refactor: 테스터 관리자 패널 컴포넌트 신규 추출 (App.tsx 미연결 상태)

DevToolsPanel은 좌측 사이드바 패널만 담당하며, 플로팅 재오픈 버튼은
포지셔닝 기준 컨테이너가 달라 App.tsx에 인라인으로 유지 (Task 4에서 설명).
아직 App.tsx에서 사용하지 않으므로 동작 변화 없음"
```

---

### Task 4: App.tsx를 8개 화면 컴포넌트 사용하도록 교체

**Files:**
- Modify: `src/App.tsx` (전체 재작성)

**Interfaces:**
- Consumes: Task 1~3에서 만든 8개 컴포넌트 (`LoadingScreen`, `ConfettiOverlay`, `InvalidStoreScreen`, `NetworkErrorScreen`, `StampsScreen`, `AlreadyStampedScreen`, `RewardSuccessScreen`, `DevToolsPanel`) — 모두 `src/components/`에서 named export로 존재
- Produces: 없음 (최종 태스크)

이 태스크는 App.tsx의 인라인 JSX를 컴포넌트 호출로 바꾸는 것 외에, 더 이상 App.tsx에서 직접 쓰이지 않는 import(아이콘, `StampGrid`, 미사용이던 `useRef` 등)도 함께 정리한다 — 이 파일의 import 목록을 어차피 전체 재작성하므로 자연스럽게 같이 정리하는 것이며, 별도의 로직 변경은 없다.

- [ ] **Step 1: `npm run dev`로 현재(리팩터링 전) 6개 화면 상태를 육안으로 확인하고 기록해둔다**

Run: `npm run dev`

테스터 패널을 이용해 아래를 순서대로 확인하고 스크린샷 또는 메모로 "이전 모습"을 남긴다 (이후 Step 5에서 비교 기준으로 사용):
1. 기본 진입 시 `cafe-rebot` 매장 로딩 → 전화번호 입력 화면
2. "⚠️ 잘못된 매장 코드" 버튼 → invalid_store 화면
3. "오프라인 모드 강제 활성" 토글 → network_error 화면
4. 새 전화번호(예: `01099998888`) 입력 → 약관 동의 화면 → 동의 후 stamps_view 화면 (스탬프 1개, 축하 배너 표시)
5. 스탬프 보유수 세팅에서 `stampGoal - 1`(예: 9) 클릭 후 페이지 새로고침, 다시 전화번호 입력 → 스탬프 적립 시 reward_success 화면
6. "오늘 이미 적립 제한 초기화" 없이 같은 번호로 한 번 더 적립 시도 → already_stamped 화면

- [ ] **Step 2: `src/App.tsx` 전체를 아래 내용으로 교체**

```tsx
import React, { useState, useEffect } from "react";
import { Smartphone } from "lucide-react";
import { Store, ViewState } from "./types";
import { getStore, getUserStamps, earnStamp, testReset } from "./services/stampService";
import { Header } from "./components/Header";
import { PhoneInput } from "./components/PhoneInput";
import { TermsConsent } from "./components/TermsConsent";
import { LoadingScreen } from "./components/LoadingScreen";
import { InvalidStoreScreen } from "./components/InvalidStoreScreen";
import { NetworkErrorScreen } from "./components/NetworkErrorScreen";
import { StampsScreen } from "./components/StampsScreen";
import { AlreadyStampedScreen } from "./components/AlreadyStampedScreen";
import { RewardSuccessScreen } from "./components/RewardSuccessScreen";
import { DevToolsPanel } from "./components/DevToolsPanel";
import { ConfettiOverlay } from "./components/ConfettiOverlay";

export default function App() {
  // Store Selection & QR Routing simulation
  const [storeCode, setStoreCode] = useState<string>("cafe-rebot");
  const [store, setStore] = useState<Store | null>(null);
  const [viewState, setViewState] = useState<ViewState>("loading");

  // Phone and Stamp states
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [currentStamps, setCurrentStamps] = useState<number>(0);
  const [stampGoal, setStampGoal] = useState<number>(10);
  const [lastStampedAt, setLastStampedAt] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);
  const [rewardDescription, setRewardDescription] = useState<string>("");

  // Control / animation states
  const [newStampAdded, setNewStampAdded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  // Quick test bar parameters
  const [testStampTarget, setTestStampTarget] = useState<number>(9);
  const [showTesterPanel, setShowTesterPanel] = useState<boolean>(import.meta.env.DEV);

  // Parse store code from URL hash or search params or fallback to cafe-rebot
  useEffect(() => {
    const handleUrlParsing = () => {
      // Priority 1: Search params (e.g. ?store=sweet-bakery)
      const urlParams = new URLSearchParams(window.location.search);
      const storeParam = urlParams.get("store");

      // Priority 2: Path-like parsing (e.g. /stamp/cafe-rebot)
      const pathParts = window.location.pathname.split("/");
      const stampIndex = pathParts.indexOf("stamp");
      const pathParam = stampIndex !== -1 && pathParts[stampIndex + 1] ? pathParts[stampIndex + 1] : null;

      const code = storeParam || pathParam || "cafe-rebot";
      setStoreCode(code);
    };

    handleUrlParsing();
    window.addEventListener("popstate", handleUrlParsing);
    return () => window.removeEventListener("popstate", handleUrlParsing);
  }, []);

  // Sync / Load Store Information
  const loadStoreDetails = async (codeToLoad = storeCode) => {
    setViewState("loading");

    if (offlineMode) {
      setViewState("network_error");
      return;
    }

    try {
      const data = await getStore(codeToLoad);
      if (!data) {
        setViewState("invalid_store");
        setStore(null);
        return;
      }

      setStore(data);
      setStampGoal(data.stampGoal);
      setRewardDescription(data.rewardDescription);

      const saved = localStorage.getItem("rebot_phone");
      const savedName = localStorage.getItem("rebot_name") || "";

      if (saved && saved.length === 11) {
        setPhone(saved);
        setName(savedName);
        await fetchUserStamps(codeToLoad, saved);
      } else {
        setViewState("input_phone");
      }
    } catch (err) {
      console.error("Error loading store details:", err);
      setViewState("network_error");
    }
  };

  useEffect(() => {
    loadStoreDetails(storeCode);
  }, [storeCode, offlineMode]);

  // Fetch current stamps for an existing phone number without adding a new stamp
  const fetchUserStamps = async (sCode: string, pNumber: string) => {
    setIsLoading(true);
    try {
      const data = await getUserStamps(sCode, pNumber);

      if (data.isNewCustomer) {
        setViewState("terms_consent");
      } else {
        setCurrentStamps(data.currentStamps);
        setLastStampedAt(data.lastStampedAt);
        setViewState("stamps_view");
      }
    } catch (e) {
      console.error(e);
      setViewState("network_error");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Phone Number Handler
  const handlePhoneSubmit = async (enteredPhone: string, enteredName: string) => {
    setIsLoading(true);
    setPhone(enteredPhone);
    setName(enteredName);

    if (offlineMode) {
      setViewState("network_error");
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUserStamps(storeCode, enteredPhone);

      if (data.isNewCustomer) {
        setViewState("terms_consent");
      } else {
        await handleEarnStamp(enteredPhone, enteredName, true);
      }
    } catch (err) {
      setViewState("network_error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle actual stamp earning with Consent variables
  const handleEarnStamp = async (
    targetPhone: string,
    targetName: string,
    isMarketingConsent: boolean
  ) => {
    setIsLoading(true);

    if (offlineMode) {
      setViewState("network_error");
      setIsLoading(false);
      return;
    }

    try {
      const result = await earnStamp(storeCode, targetPhone, targetName, isMarketingConsent, true);

      localStorage.setItem("rebot_phone", targetPhone);
      localStorage.setItem("rebot_name", targetName);

      setCurrentStamps(result.currentStamps);
      setLastStampedAt(new Date().toISOString());

      if (result.rewardTriggered) {
        setViewState("reward_success");
        setNewStampAdded(false);
      } else if (result.alreadyStampedToday) {
        setViewState("already_stamped");
        setNewStampAdded(false);
      } else {
        setViewState("stamps_view");
        setNewStampAdded(true);
        setTimeout(() => {
          setNewStampAdded(false);
        }, 3000);
      }
    } catch (err) {
      setViewState("network_error");
    } finally {
      setIsLoading(false);
    }
  };

  // Back from terms
  const handleBackToPhoneInput = () => {
    setViewState("input_phone");
  };

  // Log out or switch phone number
  const handleResetPhone = () => {
    localStorage.removeItem("rebot_phone");
    localStorage.removeItem("rebot_name");
    setPhone("");
    setName("");
    setCurrentStamps(0);
    setViewState("input_phone");
  };

  // Helper formatting for masked telephone: 010****5678
  const getMaskedPhone = (num: string) => {
    if (num.length !== 11) return num;
    return `${num.slice(0, 3)}****${num.slice(7)}`;
  };

  // Quick simulation controls (Tester Bar)
  const simulateResetAccount = async () => {
    if (!phone) {
      alert("먼저 번호를 입력한 상태여야 테스트 계정 리셋이 가능합니다.");
      return;
    }
    try {
      await testReset(phone, storeCode, "reset-all");
      handleResetPhone();
    } catch (e) {
      console.error(e);
    }
  };

  const simulateResetTodayLimit = async () => {
    if (!phone) return;
    try {
      await testReset(phone, storeCode, "reset-today");
      alert("오늘 적립 이력이 리셋되었습니다! 이제 다시 적립할 수 있습니다.");
      fetchUserStamps(storeCode, phone);
    } catch (e) {
      console.error(e);
    }
  };

  const simulateSetStamps = async (stampsNum: number) => {
    if (!phone) {
      alert("먼저 번호를 입력해 주세요.");
      return;
    }
    try {
      await testReset(phone, storeCode, "set-stamps", stampsNum);
      alert(`스탬프를 ${stampsNum}개로 강제 조정했습니다!`);
      fetchUserStamps(storeCode, phone);
    } catch (e) {
      console.error(e);
    }
  };

  const activeColor = store?.brandColor || "#4A6741";

  return (
    <div className="min-h-screen bg-[#E5E2DA] flex flex-col md:flex-row items-stretch text-[#3E2723] font-sans antialiased overflow-x-hidden selection:bg-[#4A6741]/20">

      {/* 1. Left side control/tester suite - dev 환경에서만 렌더링 (프로덕션 노출 차단) */}
      {import.meta.env.DEV && (
        <DevToolsPanel
          storeCode={storeCode}
          onSelectStoreCode={setStoreCode}
          offlineMode={offlineMode}
          onToggleOffline={() => setOfflineMode(!offlineMode)}
          phone={phone}
          name={name}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          onSetStamps={simulateSetStamps}
          onResetTodayLimit={simulateResetTodayLimit}
          onResetAccount={simulateResetAccount}
          showTesterPanel={showTesterPanel}
          onHide={() => setShowTesterPanel(false)}
        />
      )}

      {/* 2. Main Mobile Preview Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative min-h-screen">

        {/* Floating Tester toggle - dev 환경에서만, 패널이 숨겨졌을 때 */}
        {import.meta.env.DEV && !showTesterPanel && (
          <button
            onClick={() => setShowTesterPanel(true)}
            className="absolute top-4 left-4 bg-stone-900 hover:bg-stone-800 text-white rounded-full px-4 py-2 text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer z-50 transition-all hover:scale-105"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            테스터 도구 열기
          </button>
        )}

        {/* 375px * 667px Standard Warm Organic Phone container frame */}
        <div
          className="w-full max-w-[400px] min-h-[680px] bg-[#FDFCF8] shadow-2xl rounded-[40px] overflow-hidden flex flex-col relative border-4 md:border-8 border-white transition-all duration-300"
          style={{ borderColor: "white" }}
          id="mobile-phone-frame"
        >
          {/* Confetti celebration backdrop when in Success / Reward triggers */}
          {(viewState === "reward_success" || newStampAdded) && <ConfettiOverlay />}

          {/* Render Store Header (Unless in absolute error states) */}
          {viewState !== "invalid_store" && viewState !== "network_error" && (
            <Header
              store={store}
              onResetPhone={phone ? handleResetPhone : undefined}
              showBackButton={viewState === "terms_consent"}
              onBack={handleBackToPhoneInput}
            />
          )}

          {/* MAIN CONTENT WORKSPACE based on ViewState */}
          <div className="flex-1 flex flex-col" id="app-workspace">
            {viewState === "loading" && <LoadingScreen />}

            {viewState === "invalid_store" && (
              <InvalidStoreScreen onSelectStore={setStoreCode} />
            )}

            {viewState === "network_error" && (
              <NetworkErrorScreen
                onRetry={() => {
                  setOfflineMode(false);
                  loadStoreDetails(storeCode);
                }}
              />
            )}

            {viewState === "input_phone" && store && (
              <PhoneInput
                store={store}
                onSubmit={handlePhoneSubmit}
                savedPhone={phone}
                isLoading={isLoading}
              />
            )}

            {viewState === "terms_consent" && store && (
              <TermsConsent
                store={store}
                phone={phone}
                name={name}
                onSubmit={(marketingAgreed) => handleEarnStamp(phone, name, marketingAgreed)}
                isLoading={isLoading}
                onBack={handleBackToPhoneInput}
              />
            )}

            {/* Standard Stamps View (Successful stamp screen) */}
            {viewState === "stamps_view" && store && (
              <StampsScreen
                store={store}
                maskedPhone={getMaskedPhone(phone)}
                name={name}
                currentStamps={currentStamps}
                stampGoal={stampGoal}
                newStampAdded={newStampAdded}
                lastStampedAt={lastStampedAt}
                activeColor={activeColor}
                onResetPhone={handleResetPhone}
              />
            )}

            {/* Already Stamped Today Screen (Duplicate Block) */}
            {viewState === "already_stamped" && store && (
              <AlreadyStampedScreen
                store={store}
                maskedPhone={getMaskedPhone(phone)}
                currentStamps={currentStamps}
                stampGoal={stampGoal}
                lastStampedAt={lastStampedAt}
                activeColor={activeColor}
                onResetPhone={handleResetPhone}
              />
            )}

            {/* Goal Achieved / Reward Celebration Screen */}
            {viewState === "reward_success" && store && (
              <RewardSuccessScreen
                store={store}
                maskedPhone={getMaskedPhone(phone)}
                activeColor={activeColor}
                onStartNewCard={() => {
                  setCurrentStamps(0);
                  setViewState("stamps_view");
                }}
                onResetPhone={handleResetPhone}
              />
            )}
          </div>

          {/* Footer Area with legal terms links */}
          <footer className="p-6 bg-white border-t border-gray-100 text-center space-y-3 mt-auto">
            <div className="flex justify-center gap-4 text-xs font-semibold text-[#8D7B73]">
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert("리봇 서비스 이용약관: 스탬프 및 방문 혜택에 관한 이용조건입니다.");
                }}
                className="border-b border-[#8D7B73]/20 pb-0.5 hover:text-stone-900 transition-colors"
                id="footer-terms-link"
              >
                서비스 이용약관
              </a>
              <span className="text-gray-200">|</span>
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  alert("리봇 개인정보 처리방침: 전화번호 식별 정보는 스탬프 관리 용도로만 철저히 암호화 관리됩니다.");
                }}
                className="border-b border-[#8D7B73]/20 pb-0.5 hover:text-stone-900 transition-colors"
                id="footer-privacy-link"
              >
                개인정보 처리방침
              </a>
            </div>
            <p className="text-[9px] text-gray-400 font-medium">
              &copy; Rebot, All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료. (미사용 변수 `marketingConsent`/`rewardDescription`/`testStampTarget`는 원본에도 이미 존재하던 것으로, `noUnusedLocals`가 꺼져 있어 에러가 아님 — 그대로 둔다.)

- [ ] **Step 4: 프로덕션 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공.

Run: `grep -r "테스터 도구 열기" dist/`
Expected: 아무것도 찾지 못함 (exit code 1) — 이전 보안 수정에서 확인한 tree-shaking이 이번 리팩터링 후에도 여전히 유효한지 재확인.

- [ ] **Step 5: `npm run dev`로 Step 1에서 기록한 6개 화면 상태를 동일한 순서로 재현하고 리팩터링 전과 시각적으로 동일한지 비교**

Run: `npm run dev`

Step 1의 6개 시나리오(매장 로딩, invalid_store, network_error, 신규 고객 약관 동의 → stamps_view, reward_success, already_stamped)를 다시 밟아보며:
- 레이아웃/텍스트/색상/애니메이션이 리팩터링 전과 동일한지
- 테스터 패널의 매장 전환, 오프라인 토글, 스탬프 강제 설정, 리셋 버튼들이 모두 그대로 동작하는지
- 플로팅 "테스터 도구 열기" 버튼이 패널을 숨겼을 때 정확히 이전과 같은 위치(좌상단, 폰 프레임 컨테이너 기준)에 나타나는지 — 이번 태스크에서 가장 회귀 가능성이 높은 지점이므로 반드시 확인

Expected: 모든 화면과 상호작용이 리팩터링 전과 100% 동일하게 동작.

- [ ] **Step 6: 커밋**

```bash
git add src/App.tsx
git commit -m "refactor: App.tsx가 8개 화면 컴포넌트를 사용하도록 교체

인라인 JSX 6개 화면 블록 + 테스터 패널 + 색종이 연출을 Task 1~3에서 만든
컴포넌트 호출로 교체. App.tsx는 상태 머신(뷰 전이 + API 호출)만 담당하도록
축소 (782줄 → 약 300줄). 로직 변경 없음, 순수 JSX 이동."
```
