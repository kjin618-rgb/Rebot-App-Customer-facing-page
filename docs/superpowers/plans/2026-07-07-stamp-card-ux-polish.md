# 스탬프 카드 UX 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 약관 동의 화면 CTA 단일화, 적립 완료/이미적립 화면의 날짜 텍스트 간소화, 확인 버튼 스타일 통일, 스탬프 도장 비주얼 재구성(리워드 칸 강조 포함)을 적용한다.

**Architecture:** 5개 세부 요구사항을 3개 독립 태스크로 나눈다 — (1) `TermsConsent` CTA 정리, (2) 날짜 텍스트/버튼 스타일 정리, (3) `StampGrid` 도장 비주얼 재구성. 모두 순수 프론트엔드 컴포넌트 수정이며 백엔드/API/타입 계약 변경은 없다.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind CSS v4, lucide-react

## Global Constraints

- 스펙 문서: `docs/superpowers/specs/2026-07-07-stamp-card-ux-polish-design.md`
- 브랜치: `feat/stamp-card-ux-polish` (이미 `dev` 기준으로 생성됨, 현재 체크아웃된 상태)
- **범위 제외 (스펙에서 확정)**: 스탬프 칸별 개별 실제 적립 날짜 표시는 하지 않는다. 백엔드/API/타입(`src/types.ts`, `src/services/stampService.ts`, `src/lib/stamp-handlers.ts`) 변경 없음. 이미 프론트엔드에 있는 `lastStampedAt` 하나만 사용한다.
- **가장 최근 적립 칸에만 날짜(`MM.DD` 형식) 표시**, 그 외 채워진 칸은 도장 무늬만 표시(숫자 없음). 미채워진 칸은 기존처럼 순서 숫자 유지.
- 이 저장소에는 자동화된 테스트 프레임워크가 없다 (`*.test.*`/`*.spec.*` 파일 0개). 각 태스크의 검증은 `npm run lint`(`tsc --noEmit`) + 수동 `npm run dev` 확인으로 수행한다.
- 커밋 메시지에 "수정/업데이트" 같은 모호한 단어 금지, 정확히 어떤 기능이 어떻게 바뀌었는지 명시 (`docs/CLAUDE_CODE_GUIDE.md`)

---

### Task 1: `TermsConsent` CTA 단일화

**Files:**
- Modify: `src/components/TermsConsent.tsx`
- Modify: `src/App.tsx:337-346` (TermsConsent 호출부)

**Interfaces:**
- Consumes: 없음
- Produces: `TermsConsentProps`에서 `onBack` 제거됨 — 다른 태스크는 이 인터페이스를 참조하지 않음

- [ ] **Step 1: `TermsConsent.tsx`의 props 인터페이스와 컴포넌트 시그니처에서 `onBack` 제거**

`src/components/TermsConsent.tsx`에서 다음을 찾는다:

```tsx
interface TermsConsentProps {
  store: Store;
  phone: string;
  name?: string;
  onSubmit: (marketingConsent: boolean) => void;
  isLoading: boolean;
  onBack: () => void;
}

export const TermsConsent: React.FC<TermsConsentProps> = ({
  store,
  phone,
  onSubmit,
  isLoading,
  onBack,
}) => {
```

다음으로 교체한다:

```tsx
interface TermsConsentProps {
  store: Store;
  phone: string;
  name?: string;
  onSubmit: (marketingConsent: boolean) => void;
  isLoading: boolean;
}

export const TermsConsent: React.FC<TermsConsentProps> = ({
  store,
  phone,
  onSubmit,
  isLoading,
}) => {
```

- [ ] **Step 2: "전화번호 입력으로 돌아가기" 버튼 제거**

`src/components/TermsConsent.tsx`에서 다음을 찾는다:

```tsx
        </button>

        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold py-3.5 rounded-2xl transition-colors cursor-pointer text-sm"
          id="terms-back-btn"
        >
          전화번호 입력으로 돌아가기
        </button>
      </div>
```

다음으로 교체한다:

```tsx
        </button>
      </div>
```

- [ ] **Step 3: `App.tsx`의 `TermsConsent` 호출부에서 `onBack` prop 제거**

`src/App.tsx`에서 다음을 찾는다:

```tsx
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
```

다음으로 교체한다:

```tsx
            {viewState === "terms_consent" && store && (
              <TermsConsent
                store={store}
                phone={phone}
                name={name}
                onSubmit={(marketingAgreed) => handleEarnStamp(phone, name, marketingAgreed)}
                isLoading={isLoading}
              />
            )}
```

`handleBackToPhoneInput` 함수 자체는 `Header`의 `onBack` prop(뒤로가기 화살표, `App.tsx:307`)에서 계속 사용되므로 삭제하지 않는다.

- [ ] **Step 4: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료 (exit code 0).

- [ ] **Step 5: 수동 확인**

Run: `npm run dev`

테스터 패널에서 새 전화번호(예: `01099998888`)를 입력해 약관 동의 화면으로 진입한다. "동의하고 스탬프 적립하기" 버튼만 보이고 "전화번호 입력으로 돌아가기" 버튼이 없는지 확인한다. (뒤로 가고 싶으면 상단 Header의 뒤로가기 화살표를 사용 — 여전히 동작해야 함)

- [ ] **Step 6: 커밋**

```bash
git add src/components/TermsConsent.tsx src/App.tsx
git commit -m "refactor: 약관 동의 화면 CTA 단일화

'전화번호 입력으로 돌아가기' 버튼 제거 — 뒤로가기는 Header의 뒤로가기
화살표로 대체 가능하므로 기능 손실 없음. onBack prop도 함께 제거."
```

---

### Task 2: 날짜 텍스트 간소화 및 확인 버튼 스타일 통일

**Files:**
- Modify: `src/components/StampsScreen.tsx`
- Modify: `src/components/AlreadyStampedScreen.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (Task 3과 독립적인 파일 영역 — Task 3은 같은 두 파일의 `StampGrid` 호출부만 건드리므로 겹치지 않음)

- [ ] **Step 1: `StampsScreen.tsx`의 "마지막 적립" 텍스트에서 시간 제거**

`src/components/StampsScreen.tsx`에서 다음을 찾는다:

```tsx
              마지막 적립: {new Date(lastStampedAt).toLocaleString("ko-KR")}
```

다음으로 교체한다:

```tsx
              마지막 적립: {new Date(lastStampedAt).toLocaleDateString("ko-KR")}
```

- [ ] **Step 2: `StampsScreen.tsx`의 "확인 완료 (메인으로)" 버튼을 활성화 스타일로 통일**

`src/components/StampsScreen.tsx`에서 다음을 찾는다:

```tsx
        <button
          onClick={onResetPhone}
          className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-bold rounded-2xl transition-all cursor-pointer text-sm"
          id="back-to-scan-btn"
        >
          확인 완료 (메인으로)
        </button>
```

다음으로 교체한다:

```tsx
        <button
          onClick={onResetPhone}
          className="w-full py-3.5 text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer text-sm"
          style={{ backgroundColor: activeColor }}
          id="back-to-scan-btn"
        >
          확인 완료 (메인으로)
        </button>
```

(`activeColor`는 `StampsScreen`이 이미 받고 있는 prop이므로 인터페이스 변경 없음.)

- [ ] **Step 3: `AlreadyStampedScreen.tsx`의 "오늘 적립 시각" 텍스트에서 시간 제거**

`src/components/AlreadyStampedScreen.tsx`에서 다음을 찾는다:

```tsx
              오늘 적립 시각: {new Date(lastStampedAt).toLocaleString("ko-KR")}
```

다음으로 교체한다:

```tsx
              오늘 적립 시각: {new Date(lastStampedAt).toLocaleDateString("ko-KR")}
```

- [ ] **Step 4: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료.

- [ ] **Step 5: 수동 확인**

Run: `npm run dev`

테스터 패널에서 스탬프를 1개 이상 적립한 뒤:
- stamps_view 화면에서 "마지막 적립: YYYY. M. D." 형태로 시간 없이 날짜만 보이는지 확인
- "확인 완료 (메인으로)" 버튼이 매장 브랜드 컬러의 활성화된 버튼처럼 보이는지 확인 (회색 비활성 느낌이 아님)
- 같은 번호로 하루에 두 번째 적립을 시도해 already_stamped 화면 진입 후 "오늘 적립 시각: YYYY. M. D." 형태로 시간 없이 날짜만 보이는지 확인

- [ ] **Step 6: 커밋**

```bash
git add src/components/StampsScreen.tsx src/components/AlreadyStampedScreen.tsx
git commit -m "fix: 적립 날짜 텍스트에서 시간 제거, 확인 버튼 활성화 스타일 통일

toLocaleString → toLocaleDateString으로 시간 부분 제거.
StampsScreen의 확인 버튼을 다른 화면과 동일하게 activeColor 기반
솔리드 버튼으로 통일해 비활성화처럼 보이던 문제 수정."
```

---

### Task 3: `StampGrid` 도장 비주얼 재구성

**Files:**
- Modify: `src/components/StampGrid.tsx` (전체 재작성)
- Modify: `src/components/StampsScreen.tsx` (StampGrid 호출부에 `lastStampedAt` prop 추가)
- Modify: `src/components/AlreadyStampedScreen.tsx` (StampGrid 호출부에 `lastStampedAt` prop 추가)

**Interfaces:**
- Consumes: 없음
- Produces: `StampGridProps`에 `lastStampedAt: string | null` 추가됨 (이후 태스크 없음 — 이 계획의 마지막 태스크)

- [ ] **Step 1: `npm run dev`로 현재(변경 전) 스탬프 카드 모습을 확인하고 기록해둔다**

Run: `npm run dev`

테스터 패널에서 스탬프를 3~4개 정도 강제 설정한 뒤 stamps_view 화면의 스탬프 카드(체크 아이콘, 리워드 칸 모양)를 육안으로 확인해 "이전 모습"을 기억해둔다 (Step 6에서 비교 기준으로 사용).

- [ ] **Step 2: `src/components/StampGrid.tsx` 전체를 아래 내용으로 교체**

```tsx
import React from "react";
import { Trophy, Sparkles } from "lucide-react";
import { Store } from "../types";

interface StampGridProps {
  store: Store;
  currentStamps: number;
  stampGoal: number;
  newStampAdded?: boolean; // If true, animate the newly added stamp
  lastStampedAt: string | null;
}

// 스탬프 도장에 새길 날짜: 좁은 원형 칸에 맞춰 MM.DD로 축약
const formatStampDate = (iso: string) => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
};

export const StampGrid: React.FC<StampGridProps> = ({
  store,
  currentStamps,
  stampGoal,
  newStampAdded = false,
  lastStampedAt,
}) => {
  const brandColor = store.brandColor || "#4A6741"; // Use store brand color or default to Warm Organic green
  const maxStamps = stampGoal;

  return (
    <div className="space-y-4" id="stamp-grid-container">
      {/* Stamp Card Board */}
      <div 
        className="bg-white border border-[#E5E2DA] rounded-3xl p-6 shadow-xs relative overflow-hidden"
        id="stamp-card-board"
      >
        {/* Card Decorative background texture */}
        <div className="absolute inset-0 opacity-2 pointer-events-none bg-[radial-gradient(#4A6741_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Stamps Grid */}
        <div 
          className="grid gap-3 relative z-10"
          style={{
            gridTemplateColumns: `repeat(${maxStamps <= 6 ? 3 : maxStamps <= 10 ? 5 : 4}, minmax(0, 1fr))`,
          }}
          id="stamps-grid"
        >
          {Array.from({ length: maxStamps }).map((_, index) => {
            const stampNumber = index + 1;
            const isFilled = stampNumber <= currentStamps;
            const isLatest = isFilled && stampNumber === currentStamps && newStampAdded;
            const isMostRecentStamp = isFilled && stampNumber === currentStamps && !!lastStampedAt;
            const isRewardPosition = stampNumber === maxStamps;
            const rotationDeg = stampNumber % 2 === 0 ? 6 : -6;

            if (isRewardPosition) {
              // Reward Stamp Slot (Last item)
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    isFilled
                      ? "bg-[#F27D26] text-white ring-4 ring-[#FDFCF8] shadow-md scale-105"
                      : "bg-[#F5F2EB] border-2 border-dashed border-[#F27D26]/40 text-[#F27D26]"
                  }`}
                  id={`stamp-slot-${stampNumber}`}
                >
                  {isFilled ? (
                    <div className="animate-pulse flex items-center justify-center">
                      <Trophy className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                  ) : (
                    <Trophy className="w-5 h-5" />
                  )}
                  {/* Goal label indicator */}
                  <span className="absolute -bottom-1 text-[8px] font-bold uppercase tracking-wider bg-white border border-[#E5E2DA] text-[#8D7B73] px-1 rounded-sm scale-90">
                    GIFT
                  </span>
                </div>
              );
            }

            // Normal Stamp Slot
            return (
              <div
                key={index}
                className={`aspect-square rounded-full flex items-center justify-center relative transition-all duration-300 bg-[#F5F2EB] border border-[#E5E2DA] ${
                  isFilled ? "" : "text-[#8D7B73]/30"
                } ${isLatest ? "animate-bounce" : ""}`}
                id={`stamp-slot-${stampNumber}`}
              >
                {isFilled ? (
                  <div
                    className="absolute inset-[10%] rounded-full flex items-center justify-center"
                    style={{
                      border: `2px solid ${brandColor}`,
                      opacity: 0.8,
                      mixBlendMode: "multiply",
                      transform: `rotate(${rotationDeg}deg)`,
                    }}
                  >
                    <div
                      className="absolute inset-[3px] rounded-full"
                      style={{ border: `1px solid ${brandColor}` }}
                    />
                    {isMostRecentStamp && lastStampedAt && (
                      <span
                        className="font-black tracking-tighter"
                        style={{
                          color: brandColor,
                          fontFamily: "monospace",
                          fontSize: "9px",
                          transform: `rotate(${-rotationDeg}deg)`,
                        }}
                      >
                        {formatStampDate(lastStampedAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-semibold tracking-tighter" style={{ fontFamily: "monospace" }}>
                    {stampNumber}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Counter Info & Progress Bar */}
        <div className="border-t border-dashed border-[#E5E2DA] mt-6 pt-5 flex items-center justify-between" id="stamps-progress-summary">
          <div>
            <p className="text-xs text-[#8D7B73] font-medium tracking-tight">현재 모은 스탬프</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold tracking-tight" style={{ color: brandColor }} id="current-stamps-count">
                {currentStamps}
              </span>
              <span className="text-sm text-[#8D7B73] font-semibold">/</span>
              <span className="text-sm text-[#8D7B73] font-bold" id="goal-stamps-count">{maxStamps}개</span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#8D7B73]">
              <Sparkles className="w-3 h-3 text-[#F27D26]" />
              {maxStamps - currentStamps === 0 ? "목표 완료!" : `남은 스탬프: ${maxStamps - currentStamps}개`}
            </span>
            <p className="text-[10px] text-[#8D7B73] mt-1.5 tracking-tight font-medium">
              혜택: {store.rewardDescription}
            </p>
          </div>
        </div>

        {/* Visual progress line */}
        <div className="w-full bg-[#F5F2EB] h-1.5 rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${Math.min((currentStamps / maxStamps) * 100, 100)}%`,
              backgroundColor: currentStamps === maxStamps ? "#F27D26" : brandColor
            }}
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: `StampsScreen.tsx`의 `StampGrid` 호출부에 `lastStampedAt` prop 추가**

`src/components/StampsScreen.tsx`에서 다음을 찾는다:

```tsx
        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={newStampAdded}
        />
```

다음으로 교체한다:

```tsx
        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={newStampAdded}
          lastStampedAt={lastStampedAt}
        />
```

- [ ] **Step 4: `AlreadyStampedScreen.tsx`의 `StampGrid` 호출부에 `lastStampedAt` prop 추가**

`src/components/AlreadyStampedScreen.tsx`에서 다음을 찾는다:

```tsx
        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={false}
        />
```

다음으로 교체한다:

```tsx
        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={false}
          lastStampedAt={lastStampedAt}
        />
```

(두 화면 모두 `lastStampedAt`을 이미 자신의 prop으로 받고 있으므로 `StampsScreenProps`/`AlreadyStampedScreenProps` 인터페이스 변경은 필요 없음.)

- [ ] **Step 5: 컴파일 확인**

Run: `npm run lint`
Expected: 에러 없이 종료. (`Check` import 제거로 인한 미사용 변수 에러 없음 — `noUnusedLocals`가 꺼져 있어도, 애초에 새 코드에서 `Check`를 import하지 않으므로 문제 없음)

- [ ] **Step 6: 수동 확인 — Step 1에서 기록한 이전 모습과 비교**

Run: `npm run dev`

테스터 패널에서 스탬프 보유수를 다양하게 설정(`0`, `1`, `stampGoal - 1` 등)해가며 다음을 확인한다:
- 채워진 일반 칸이 체크 아이콘이 아니라 이중 원형 테두리(도장 느낌)로 보이는지
- 가장 최근에 적립된 칸(스탬프 보유수와 같은 위치)에만 `MM.DD` 형식 날짜가 도장 안에 표시되는지, 나머지 채워진 칸은 숫자 없이 도장 무늬만 있는지
- 미채워진 일반 칸은 기존처럼 순서 숫자가 그대로 보이는지 (변경 없음)
- 리워드(마지막) 칸이 미채워진 상태에서도 오렌지 톤으로 강조되어 보이는지 (이전엔 회색조로 죽어 보였던 부분)
- 스탬프 적립을 1회 진행해 새 스탬프가 추가되는 애니메이션(`animate-bounce`)이 여전히 정상 동작하는지

- [ ] **Step 7: 프로덕션 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공.

- [ ] **Step 8: 커밋**

```bash
git add src/components/StampGrid.tsx src/components/StampsScreen.tsx src/components/AlreadyStampedScreen.tsx
git commit -m "feat: 스탬프 도장 비주얼로 재구성, 리워드 칸 강조

체크 아이콘 채우기 방식을 이중 원형 테두리 기반 도장 디자인으로 교체.
가장 최근 적립 칸에만 lastStampedAt을 MM.DD로 표시(백엔드 변경 없이
기존 필드 재사용). 리워드 칸은 미채워진 상태에서도 오렌지 톤으로
강조해 목표 칸임을 한눈에 알 수 있도록 함."
```
