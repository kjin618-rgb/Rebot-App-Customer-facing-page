# Rebot — 고객용 디지털 스탬프 웹앱

카페·베이커리용 디지털 스탬프 서비스 **리봇(Rebot)**의 고객 접점 모바일 웹앱입니다.  
고객이 매장 QR을 스캔하면 전화번호 입력만으로 스탬프를 적립하고, 목표 달성 시 리워드를 받을 수 있습니다.

## 주요 기능

- QR 코드 스캔 후 매장 정보 자동 로딩 (`/stamp/[storeCode]`)
- 전화번호 입력으로 신규/재방문 고객 식별 (SMS 인증 없음)
- `localStorage` 기반 전화번호 자동 입력 (재방문 시)
- 신규 고객 약관 동의 (필수/선택 마케팅 동의 분리)
- 스탬프 카드 시각화 — 매장별 목표 수 반영
- 1일 1회 적립 제한 (KST 기준), 목표 달성 시 리워드 화면 전환 및 카드 리셋
- 네트워크 오류 감지 및 재시도 UX
- 전화번호 마스킹 표시 (`010****5678`)

## 화면 상태

| 상태 | 전환 조건 |
|---|---|
| 로딩 | QR 진입 직후 |
| 잘못된 매장 코드 | Supabase에 없는 storeCode |
| 전화번호 입력 | 신규·재방문 공통 |
| 약관 동의 | 신규 고객 (`isNewCustomer: true`) |
| 스탬프 카드 | 적립 성공 |
| 오늘 이미 적립 | `alreadyStampedToday: true` |
| 리워드 달성 | `rewardTriggered: true` |
| 네트워크 오류 | fetch 실패 |

## 기술 스택

- **Frontend** — React 19, TypeScript, Vite 6, Tailwind CSS v4
- **Backend** — Express.js (API 서버 + Vite 미들웨어)
- **Database** — Supabase (PostgreSQL), service_role key로 서버사이드 접근
- **아이콘** — Lucide React

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env 파일 생성)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. 개발 서버 실행 (Express + Vite, 포트 3000)
npm run dev:server
```

> `npm run dev` (Vite 단독)는 API가 없어 동작하지 않습니다. 반드시 `npm run dev:server`를 사용하세요.

## 프로젝트 구조

```
src/
├── services/
│   └── stampService.ts   # API 클라이언트 (fetch → Express)
├── components/
│   ├── Header.tsx         # 매장 로고 + 번호 변경 버튼
│   ├── PhoneInput.tsx     # 전화번호·이름 입력 폼
│   ├── TermsConsent.tsx   # 약관 동의 화면
│   └── StampGrid.tsx      # 스탬프 카드 그리드
├── App.tsx                # ViewState 기반 상태 머신
├── types.ts               # Store, StampCard, StampResult 타입
└── index.css
server.ts                  # Express API 서버 (Supabase 연동)
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/store/:storeCode` | 매장 정보 조회 |
| `GET` | `/api/stamp/:storeCode/user/:phone` | 고객 스탬프 현황 조회 |
| `POST` | `/api/stamp/:storeCode` | 스탬프 적립 |
| `POST` | `/api/test/reset` | 테스트용 데이터 리셋 |

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

## 관련 레포

- [사장님 CRM 대시보드](https://github.com/kjin618-rgb/Rebot-App-Owner-Dashboard) — 고객 관리·AI 메시지 생성, 동일 Supabase 프로젝트 공유
