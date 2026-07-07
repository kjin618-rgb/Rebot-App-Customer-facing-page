# 스탬프 카드 UX 개선 — 설계 (Design)

**작성일**: 2026-07-07

## 배경

사용자(레포지토리 주인)로부터 4가지 구체적인 UI 피드백을 받음:

1. 약관 동의 화면(전화번호 입력 후 신규 고객에게 보이는 화면)에 CTA가 2개(동의 후 적립하기 / 전화번호 입력으로 돌아가기) 있어 하나로 줄이고 싶음
2. 적립 완료 화면(`stamps_view`)의 스탬프 디자인이 단순 체크 표시라 실제 도장을 찍은 것처럼 바꾸고, 적립 날짜를 숫자로 보여주고 싶음 (`stamp.png` 참고 이미지 제공)
3. "마지막 적립: ..." 텍스트에서 시간 제거, 날짜만 남기기
4. 스탬프 카드의 마지막 "리워드(gift)" 칸을 시각적으로 더 강조
5. "확인 완료" 버튼이 비활성화된 것처럼 보여 시각 수정 필요

## 목표

위 5가지를 반영해 스탬프 관련 화면의 UX/시각 품질을 개선한다. 순수 프론트엔드 변경이며, 백엔드/API 계약은 변경하지 않는다 (아래 "범위에서 제외" 참고).

## 범위에서 제외 (중요한 스코프 결정)

**각 스탬프 칸마다 실제 적립 날짜를 개별 표시하는 기능은 이번 범위에서 제외한다.**

- 현재 백엔드는 `customers.current_stamps`(개수)와 `customers.last_visit_at`(가장 최근 방문 시각) 단 하나만 저장/조회하며, `visit_logs` 테이블에 개별 방문 기록이 쌓이고 있지만 API가 이를 조회해 배열로 내려주지 않는다.
- 칸별 실제 날짜를 보여주려면 `visit_logs` 조회 + API 응답 타입 확장(`src/types.ts`, `src/services/stampService.ts`, `src/lib/stamp-handlers.ts`) 등 백엔드 작업이 필요해, "시각 개선" 범위를 벗어난다.
- **사용자 확인 결과**: 백엔드 변경 없이, 이미 프론트엔드에 존재하는 `lastStampedAt` 값을 **가장 최근에 적립된 칸에만** 표시하기로 결정. 그 외 이미 적립된 칸들은 날짜 없이 도장 무늬만 표시한다 (사용자 확인: "숫자 없이 도장 무늬만").

## 설계

### 1. `TermsConsent.tsx` — CTA 단일화

- "전화번호 입력으로 돌아가기" 버튼(`id="terms-back-btn"`, `onBack` prop 연결)을 제거한다.
- `onBack` prop 자체와 `App.tsx`의 `handleBackToPhoneInput` 연결부(TermsConsent에 전달하는 부분)도 함께 제거한다 — 뒤로 가기는 이미 `Header`의 뒤로가기 화살표(`showBackButton={viewState === "terms_consent"}`)로 대체 가능하므로 기능 손실이 없다.
- `TermsConsentProps`에서 `onBack: () => void`도 제거.

### 2. `StampsScreen.tsx` — 마지막 적립 텍스트에서 시간 제거

- `new Date(lastStampedAt).toLocaleString("ko-KR")` → `new Date(lastStampedAt).toLocaleDateString("ko-KR")`로 변경. (동일 패턴이 `AlreadyStampedScreen.tsx`에도 있으므로 함께 수정)

### 3. `StampsScreen.tsx` — "확인 완료 (메인으로)" 버튼 활성화 스타일로 통일

- 현재: `className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-bold rounded-2xl transition-all cursor-pointer text-sm"` — 회색조라 비활성화된 것처럼 보임.
- 변경: `AlreadyStampedScreen.tsx`/`RewardSuccessScreen.tsx`의 기존 확인 버튼과 동일한 패턴으로 통일 — `activeColor`를 배경색으로 사용하는 솔리드 버튼 (`style={{ backgroundColor: activeColor }}`, 흰 텍스트, `shadow-lg hover:brightness-105 active:scale-95`).

### 4. `StampGrid.tsx` — 도장(Stamp) 비주얼 재구성

**기술 방식**: `stamp.png` 참고 이미지를 래스터 이미지로 직접 쓰지 않고, CSS로 도장 느낌을 재현한다 (매장별 `brandColor`를 그대로 입혀야 하므로 — 이미지는 고정 색상이라 매장마다 달라지는 브랜드 컬러에 대응 불가). 그런지(잉크 번짐) 질감까지 완벽히 재현하진 않지만, 이중 원형 테두리 + 미세한 회전 각도 + 잉크가 스며든 느낌(반투명 + `mix-blend-mode: multiply`)으로 "손으로 찍은 도장" 인상을 준다.

**채워진 일반 칸 (리워드 칸 제외)**:
- 기존의 단색 배경 채우기(`backgroundColor: isFilled ? brandColor : undefined`) + 체크 아이콘 + 미세 반사광 효과(`absolute top-1 left-1.5 ... bg-white/40 ...`)를 제거한다. 단색 채우기는 "도장이 찍힌" 느낌이 아니라 "배지가 채워진" 느낌이기 때문.
- 대신 칸 배경은 미채워진 칸과 동일한 종이 질감 배경(`bg-[#F5F2EB]` 계열)을 유지하고, 그 위에 `brandColor` 기반의 이중 원형 링(굵은 외곽 링 + 얇은 내곽 링, 사이 간격 있음)을 그린다.
- 이중 링 전체에 `opacity-80`과 `mix-blend-multiply`를 적용해 흰 종이 위에 잉크가 스며든 듯한 반투명 질감을 낸다.
- 살짝 기울어진 각도(`transform: rotate(...)`, 예: 칸 순서에 따라 홀수 칸 -6도 / 짝수 칸 +6도로 번갈아 — 완전 랜덤이 아닌 결정적 패턴으로 "삐뚤빼뚤 찍힌" 느낌을 내되 매 렌더마다 값이 바뀌지 않도록 함)을 적용한다.
- **가장 최근에 적립된 칸(`stampNumber === currentStamps && lastStampedAt`이 존재)**: 이중 링 안쪽 중앙에 `lastStampedAt`을 `MM.DD` 형식(예: `07.06`)의 볼드 모노스페이스 숫자로 표시한다. 전체 연도(`YYYY.MM.DD`)는 좁은 스탬프 칸 안에 넣기엔 글자가 많아 `MM.DD`로 축약한다.
- **그 외 채워진 칸**: 링 안에 별도 숫자/아이콘 없이 이중 링 자체만 표시 (사용자 확인: "숫자 없이 도장 무늬만").

**미채워진 일반 칸**: 기존과 동일하게 순서 숫자(`stampNumber`)를 모노스페이스로 표시 — 변경 없음.

**리워드(gift) 칸 강조**:
- 미채워진 상태의 현재 스타일: `bg-[#F5F2EB] border-2 border-dashed border-[#E5E2DA] text-[#8D7B73] hover:border-[#F27D26]/50`, Trophy 아이콘이 `opacity-60`으로 죽어 보임.
- 변경: Trophy 아이콘 색상을 `text-[#8D7B73]`(회색조) → `text-[#F27D26]`(강조 오렌지, 기존 리워드 강조색과 동일 계열)로 바꾸고 `opacity-60`을 제거해 미채워진 상태에서도 "이 칸이 목표"임이 한눈에 보이도록 한다. 점선 테두리(`border-dashed border-[#E5E2DA]`)도 `border-[#F27D26]/40` 정도로 톤을 올려 함께 강조한다.
- 채워진 상태(이미 `bg-[#F27D26]` 솔리드 + 흰 Trophy 아이콘으로 이미 충분히 강조되어 있음)는 변경하지 않는다.

**Props 변경**: `StampGridProps`에 `lastStampedAt: string | null`을 추가한다 (선택적 prop 아님 — 호출부인 `StampsScreen`/`AlreadyStampedScreen`이 이미 이 값을 갖고 있으므로 항상 전달).

### 5. `AlreadyStampedScreen.tsx` — 동일 규칙 자동 적용

- `StampGrid`를 그대로 재사용하므로 도장 디자인 변경은 자동 반영됨. 이 화면도 "마지막 적립 시각" 텍스트에서 시간 제거(항목 2와 동일 패턴)를 함께 적용한다.

## 영향 파일

- `src/components/TermsConsent.tsx`
- `src/components/StampsScreen.tsx`
- `src/components/StampGrid.tsx`
- `src/components/AlreadyStampedScreen.tsx`
- `src/App.tsx` (TermsConsent에 전달하던 `onBack` prop 제거)

## 검증

테스트 프레임워크가 없으므로 수동 검증:
1. `npm run lint` 통과
2. `npm run dev` 후 테스터 패널로:
   - 신규 번호 입력 → 약관 동의 화면에서 CTA 1개만 보이는지 확인
   - 스탬프 여러 개 강제 설정 후 stamps_view에서 도장 디자인, 최신 칸 날짜(MM.DD), 나머지 칸 무늬만, 리워드 칸 강조, "확인 완료" 버튼 활성 스타일 확인
   - "마지막 적립" 텍스트에 시간이 빠지고 날짜만 있는지 확인
   - already_stamped 화면에서도 동일하게 확인
