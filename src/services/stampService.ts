import { Store, StampResult } from "../types";

interface User {
  phone: string;
  name?: string;
  marketingConsent: boolean;
  registeredAt: string;
}

interface StampCard {
  phone: string;
  storeCode: string;
  currentStamps: number;
  lastStampedAt: string | null;
}

const STORES: Record<string, Store> = {
  "cafe-rebot": {
    storeCode: "cafe-rebot",
    storeName: "리봇 카페 & 베이커리",
    logoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&h=150&fit=crop&q=80",
    brandColor: "#15803d",
    stampGoal: 10,
    rewardDescription: "아메리카노 1잔 무료 쿠폰",
  },
  "sweet-bakery": {
    storeCode: "sweet-bakery",
    storeName: "달콤 베이커리 본점",
    logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&h=150&fit=crop&q=80",
    brandColor: "#b45309",
    stampGoal: 8,
    rewardDescription: "갓 구운 소금빵 1개 무료 교환권",
  },
  "coffee-ground": {
    storeCode: "coffee-ground",
    storeName: "커피 그라운드",
    logoUrl: null,
    brandColor: "#1e293b",
    stampGoal: 12,
    rewardDescription: "모든 제조 음료 1잔 무료",
  },
  "daily-bread": {
    storeCode: "daily-bread",
    storeName: "매일 브레드",
    logoUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=150&h=150&fit=crop&q=80",
    brandColor: "#7c2d12",
    stampGoal: 5,
    rewardDescription: "수제 유기농 식빵 1봉지",
  },
};

// Module-level in-memory storage — persists across requests in the same page session
const usersTable = new Map<string, User>();
const stampCardsTable = new Map<string, StampCard>();

// Pre-seeded test account: 01012345678 / 김미영
usersTable.set("01012345678", {
  phone: "01012345678",
  name: "김미영",
  marketingConsent: true,
  registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
});
stampCardsTable.set("cafe-rebot:01012345678", {
  phone: "01012345678",
  storeCode: "cafe-rebot",
  currentStamps: 3,
  lastStampedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
});
stampCardsTable.set("sweet-bakery:01012345678", {
  phone: "01012345678",
  storeCode: "sweet-bakery",
  currentStamps: 7,
  lastStampedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
});

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getStore(storeCode: string): Promise<Store | null> {
  await delay(500);
  return STORES[storeCode] ?? null;
}

export async function getUserStamps(
  storeCode: string,
  phone: string
): Promise<{
  isNewCustomer: boolean;
  currentStamps: number;
  stampGoal: number;
  lastStampedAt: string | null;
}> {
  await delay(200);
  const store = STORES[storeCode];
  if (!store) throw new Error("store_not_found");

  const user = usersTable.get(phone);
  const card = stampCardsTable.get(`${storeCode}:${phone}`);

  if (!user) {
    return { isNewCustomer: true, currentStamps: 0, stampGoal: store.stampGoal, lastStampedAt: null };
  }

  return {
    isNewCustomer: false,
    currentStamps: card?.currentStamps ?? 0,
    stampGoal: store.stampGoal,
    lastStampedAt: card?.lastStampedAt ?? null,
  };
}

export async function earnStamp(
  storeCode: string,
  phone: string,
  name: string,
  marketingConsent: boolean,
  forceConsent = false
): Promise<StampResult> {
  await delay(300);
  const store = STORES[storeCode];
  if (!store) throw new Error("store_not_found");

  const userExists = usersTable.has(phone);

  if (!userExists && !forceConsent) {
    return {
      stampEarned: false,
      alreadyStampedToday: false,
      currentStamps: 0,
      stampGoal: store.stampGoal,
      rewardTriggered: false,
      isNewCustomer: true,
    };
  }

  if (!userExists) {
    usersTable.set(phone, {
      phone,
      name: name || undefined,
      marketingConsent,
      registeredAt: new Date().toISOString(),
    });
  } else if (name) {
    const existing = usersTable.get(phone)!;
    usersTable.set(phone, { ...existing, name });
  }

  const cardKey = `${storeCode}:${phone}`;
  let card = stampCardsTable.get(cardKey);
  if (!card) {
    card = { phone, storeCode, currentStamps: 0, lastStampedAt: null };
    stampCardsTable.set(cardKey, card);
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

  if (card.lastStampedAt) {
    const lastStr = new Date(card.lastStampedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
    if (todayStr === lastStr) {
      return {
        stampEarned: false,
        alreadyStampedToday: true,
        currentStamps: card.currentStamps,
        stampGoal: store.stampGoal,
        rewardTriggered: false,
        isNewCustomer: false,
      };
    }
  }

  card.currentStamps += 1;
  card.lastStampedAt = now.toISOString();
  stampCardsTable.set(cardKey, card);

  let rewardTriggered = false;
  if (card.currentStamps >= store.stampGoal) {
    rewardTriggered = true;
    card.currentStamps = 0;
    stampCardsTable.set(cardKey, card);
  }

  return {
    stampEarned: true,
    alreadyStampedToday: false,
    currentStamps: rewardTriggered ? store.stampGoal : card.currentStamps,
    stampGoal: store.stampGoal,
    rewardTriggered,
    isNewCustomer: false,
  };
}

export async function testReset(
  phone: string,
  storeCode: string,
  action: "reset-all" | "reset-today" | "set-stamps",
  stamps?: number
): Promise<void> {
  const cardKey = `${storeCode}:${phone}`;

  if (action === "reset-all") {
    usersTable.delete(phone);
    stampCardsTable.delete(cardKey);
  } else if (action === "reset-today") {
    const card = stampCardsTable.get(cardKey);
    if (card) {
      card.lastStampedAt = null;
      stampCardsTable.set(cardKey, card);
    }
  } else if (action === "set-stamps" && stamps !== undefined) {
    const card = stampCardsTable.get(cardKey);
    if (card) {
      card.currentStamps = stamps;
      stampCardsTable.set(cardKey, card);
    } else {
      stampCardsTable.set(cardKey, { phone, storeCode, currentStamps: stamps, lastStampedAt: null });
    }
  }
}
