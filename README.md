# Rebot — 고객용 디지털 스탬프 웹앱

카페·베이커리용 디지털 스탬프 서비스 **리봇(Rebot)**의 고객 접점 모바일 웹 프론트엔드입니다.  
고객이 매장 QR을 스캔하면 전화번호 입력만으로 스탬프를 적립하고, 목표 달성 시 리워드를 받을 수 있습니다.

## 주요 기능

- QR 코드 스캔 후 매장 정보 자동 로딩 (`/stamp/[storeCode]`)
- 전화번호 입력으로 신규/재방문 고객 식별 (SMS 인증 없음)
- `localStorage` 기반 전화번호 자동 입력 (재방문 시)
- 신규 고객 약관 동의 (필수/선택 마케팅 동의 분리)
- 스탬프 카드 시각화 — 매장별 목표 수·브랜드 컬러 반영
- 1일 1회 적립 제한, 목표 달성 시 리워드 화면 전환
- 네트워크 오류 감지 및 재시도 UX
- 전화번호 마스킹 표시 (`010****5678`)

## 화면 상태

| 상태 | 전환 조건 |
|---|---|
| 로딩 | QR 진입 직후 |
| 잘못된 매장 코드 | 존재하지 않는 storeCode |
| 전화번호 입력 | 신규·재방문 공통 |
| 약관 동의 | 신규 고객 (`isNewCustomer: true`) |
| 스탬프 카드 | 적립 성공 |
| 오늘 이미 적립 | `alreadyStampedToday: true` |
| 리워드 달성 | `rewardTriggered: true` |
| 네트워크 오류 | fetch 실패 |

## 기술 스택

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4
- **아이콘** — Lucide React
- **서비스 레이어** — 브라우저 내 mock service (`src/services/stampService.ts`)
- **배포** — Vercel (정적 SPA)
- **백엔드 (선택)** — Express.js (`server.ts`) — 실제 API 연동 시 사용

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Vite, 포트 5173)
npm run dev

# Express 백엔드 포함 실행 (포트 3000, 실제 API 연동 시)
npm run dev:server
```

## 프로젝트 구조

```
src/
├── services/
│   └── stampService.ts   # 브라우저 mock service (API 인터페이스)
├── components/
│   ├── Header.tsx         # 매장 로고 + 번호 변경 버튼
│   ├── PhoneInput.tsx     # 전화번호·이름 입력 폼
│   ├── TermsConsent.tsx   # 약관 동의 화면
│   └── StampGrid.tsx      # 스탬프 카드 그리드
├── App.tsx                # ViewState 기반 상태 머신
├── types.ts               # Store, StampCard, StampResult 타입
└── index.css
server.ts                  # Express API 서버 (실제 API 연동용)
vercel.json                # Vercel 배포 설정
```

## 데이터 타입

```ts
type Store = {
  storeCode: string
  storeName: string
  logoUrl: string | null
  brandColor: string | null
  stampGoal: number
  rewardDescription: string
}

type StampResult = {
  stampEarned: boolean
  alreadyStampedToday: boolean
  currentStamps: number
  stampGoal: number
  rewardTriggered: boolean
  isNewCustomer: boolean
}
```

## API 계약

현재는 `src/services/stampService.ts`의 mock으로 동작하며, 실제 API 연동 시 아래 계약을 따릅니다.

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/store/:storeCode` | 매장 정보 조회 |
| `GET` | `/api/stamp/:storeCode/user/:phone` | 고객 스탬프 현황 조회 |
| `POST` | `/api/stamp/:storeCode` | 스탬프 적립 |

## Vercel 배포

`vercel.json`이 포함되어 있어 GitHub 연동 후 자동 배포됩니다.  
별도 환경 변수 설정 없이 바로 배포 가능합니다.

## 구현 범위 외

- 사장님 대시보드
- SMS 인증
- 리워드 쿠폰 ID 발행 및 만료 관리
- 사장님의 스탬프 요청 수동 승인
