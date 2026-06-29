export interface Store {
  storeCode: string;
  storeName: string;
  logoUrl: string | null;
  brandColor: string | null;   // null이면 기본 포인트 그린 사용
  stampGoal: number;
  rewardDescription: string;
}

export interface StampCard {
  currentStamps: number;
  stampGoal: number;
  rewardDescription: string;
  lastStampedAt: string | null;  // ISO date string
}

export interface StampResult {
  stampEarned: boolean;
  alreadyStampedToday: boolean;
  currentStamps: number;
  stampGoal: number;
  rewardTriggered: boolean;     // true면 리워드 달성 축하 화면
  isNewCustomer: boolean;       // true면 약관 동의 화면 선행
}

export type ViewState =
  | "loading"             // QR 진입 직후 스켈레톤
  | "invalid_store"       // 잘못된 매장 코드
  | "input_phone"         // 전화번호 입력 화면
  | "terms_consent"       // 약관 및 마케팅 동의 화면 (신규 고객)
  | "stamps_view"         // 스탬프 카드 화면 (적립 성공 또는 단순 조회)
  | "already_stamped"     // 오늘 이미 적립한 화면
  | "reward_success"      // 리워드 달성 축하 화면
  | "network_error";      // 네트워크 오류
