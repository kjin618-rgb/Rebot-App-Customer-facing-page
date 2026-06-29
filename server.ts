import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Store {
  storeCode: string;
  storeName: string;
  logoUrl: string | null;
  brandColor: string | null;
  stampGoal: number;
  rewardDescription: string;
}

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

// In-memory mock database
const STORES: Record<string, Store> = {
  "cafe-rebot": {
    storeCode: "cafe-rebot",
    storeName: "리봇 카페 & 베이커리",
    logoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&h=150&fit=crop&q=80",
    brandColor: "#15803d", // Emerald Green
    stampGoal: 10,
    rewardDescription: "아메리카노 1잔 무료 쿠폰",
  },
  "sweet-bakery": {
    storeCode: "sweet-bakery",
    storeName: "달콤 베이커리 본점",
    logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&h=150&fit=crop&q=80",
    brandColor: "#b45309", // Warm Amber
    stampGoal: 8,
    rewardDescription: "갓 구운 소금빵 1개 무료 교환권",
  },
  "coffee-ground": {
    storeCode: "coffee-ground",
    storeName: "커피 그라운드",
    logoUrl: null, // Test null logo
    brandColor: "#1e293b", // Slate Charcoal
    stampGoal: 12,
    rewardDescription: "모든 제조 음료 1잔 무료",
  },
  "daily-bread": {
    storeCode: "daily-bread",
    storeName: "매일 브레드",
    logoUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=150&h=150&fit=crop&q=80",
    brandColor: "#7c2d12", // Rich Brown
    stampGoal: 5,
    rewardDescription: "수제 유기농 식빵 1봉지",
  }
};

// In-memory store tables
const usersTable = new Map<string, User>();
const stampCardsTable = new Map<string, StampCard>();

// Preseed a test returning user for demo/testing
// Phone: 01012345678 (registered, already has 3 stamps)
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
  currentStamps: 7, // 1 stamp left to reward
  lastStampedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // 1. GET /api/store/[storeCode]
  app.get("/api/store/:storeCode", (req, res) => {
    const { storeCode } = req.params;
    const store = STORES[storeCode];

    if (!store) {
      return res.status(404).json({ error: "store_not_found" });
    }

    res.json(store);
  });

  // 2. GET /api/stamp/:storeCode/user/:phone (Helper to get current state without earning)
  app.get("/api/stamp/:storeCode/user/:phone", (req, res) => {
    const { storeCode, phone } = req.params;
    const store = STORES[storeCode];

    if (!store) {
      return res.status(404).json({ error: "store_not_found" });
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, "");
    if (cleanedPhone.length !== 11) {
      return res.status(400).json({ error: "invalid_phone" });
    }

    const user = usersTable.get(cleanedPhone);
    const cardKey = `${storeCode}:${cleanedPhone}`;
    const card = stampCardsTable.get(cardKey);

    if (!user) {
      return res.json({
        isNewCustomer: true,
        currentStamps: 0,
        stampGoal: store.stampGoal,
        lastStampedAt: null,
      });
    }

    res.json({
      isNewCustomer: false,
      currentStamps: card ? card.currentStamps : 0,
      stampGoal: store.stampGoal,
      lastStampedAt: card ? card.lastStampedAt : null,
    });
  });

  // 3. POST /api/stamp/[storeCode]
  app.post("/api/stamp/:storeCode", (req, res) => {
    const { storeCode } = req.params;
    const { phone, name, marketingConsent, forceConsent, forceNew } = req.body;

    const store = STORES[storeCode];
    if (!store) {
      return res.status(404).json({ error: "store_not_found" });
    }

    if (!phone) {
      return res.status(400).json({ error: "invalid_phone" });
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, "");
    if (cleanedPhone.length !== 11) {
      return res.status(400).json({ error: "invalid_phone" });
    }

    const userExists = usersTable.has(cleanedPhone);

    // If the customer is new and has not agreed to terms yet (indicated by forceConsent !== true and not having user row)
    if (!userExists && forceConsent !== true && forceNew !== false) {
      return res.json({
        stampEarned: false,
        alreadyStampedToday: false,
        currentStamps: 0,
        stampGoal: store.stampGoal,
        rewardTriggered: false,
        isNewCustomer: true,
      });
    }

    // Now, handle registration/saving if new
    if (!userExists) {
      usersTable.set(cleanedPhone, {
        phone: cleanedPhone,
        name: name || undefined,
        marketingConsent: !!marketingConsent,
        registeredAt: new Date().toISOString(),
      });
    } else if (name) {
      // Update name if provided
      const existingUser = usersTable.get(cleanedPhone)!;
      existingUser.name = name;
      usersTable.set(cleanedPhone, existingUser);
    }

    const cardKey = `${storeCode}:${cleanedPhone}`;
    let card = stampCardsTable.get(cardKey);

    if (!card) {
      card = {
        phone: cleanedPhone,
        storeCode,
        currentStamps: 0,
        lastStampedAt: null,
      };
      stampCardsTable.set(cardKey, card);
    }

    // Check if already stamped today
    const now = new Date();
    const todayStr = now.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }); // Match South Korea date

    let alreadyStampedToday = false;
    if (card.lastStampedAt) {
      const lastDate = new Date(card.lastStampedAt);
      const lastDateStr = lastDate.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
      if (todayStr === lastDateStr) {
        alreadyStampedToday = true;
      }
    }

    if (alreadyStampedToday) {
      return res.json({
        stampEarned: false,
        alreadyStampedToday: true,
        currentStamps: card.currentStamps,
        stampGoal: store.stampGoal,
        rewardTriggered: false,
        isNewCustomer: false,
      });
    }

    // Earn stamp!
    card.currentStamps += 1;
    card.lastStampedAt = now.toISOString();
    stampCardsTable.set(cardKey, card);

    let rewardTriggered = false;
    if (card.currentStamps >= store.stampGoal) {
      rewardTriggered = true;
      // Reset card stamps after triggering reward (starts next card)
      card.currentStamps = 0;
      stampCardsTable.set(cardKey, card);
    }

    res.json({
      stampEarned: true,
      alreadyStampedToday: false,
      currentStamps: rewardTriggered ? store.stampGoal : card.currentStamps, // UI can celebrate goal
      stampGoal: store.stampGoal,
      rewardTriggered,
      isNewCustomer: false,
    });
  });

  // 4. API to reset user state (For testing purposes)
  app.post("/api/test/reset", (req, res) => {
    const { phone, storeCode, action } = req.body;
    const cleanedPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

    if (!cleanedPhone) {
      return res.status(400).json({ error: "Phone number required" });
    }

    const cardKey = `${storeCode}:${cleanedPhone}`;

    if (action === "reset-all") {
      usersTable.delete(cleanedPhone);
      stampCardsTable.delete(cardKey);
    } else if (action === "reset-today") {
      const card = stampCardsTable.get(cardKey);
      if (card) {
        card.lastStampedAt = null;
        stampCardsTable.set(cardKey, card);
      }
    } else if (action === "set-stamps") {
      const { stamps } = req.body;
      const card = stampCardsTable.get(cardKey);
      if (card) {
        card.currentStamps = Number(stamps);
        stampCardsTable.set(cardKey, card);
      } else {
        stampCardsTable.set(cardKey, {
          phone: cleanedPhone,
          storeCode,
          currentStamps: Number(stamps),
          lastStampedAt: null,
        });
      }
    }

    res.json({ success: true });
  });

  // Serve static assets or integrate Vite in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
