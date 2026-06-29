import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function maskPhone(phone: string): string {
  const c = phone.replace(/[^0-9]/g, "");
  if (c.length === 11) return `${c.slice(0, 3)}-****-${c.slice(7)}`;
  if (c.length === 10) return `${c.slice(0, 3)}-***-${c.slice(6)}`;
  return phone;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GET /api/store/:storeCode
  app.get("/api/store/:storeCode", async (req, res) => {
    const { storeCode } = req.params;
    const sb = getSupabase();

    const { data } = await sb
      .from("stores")
      .select("store_code, store_name, stamp_goal, reward_desc")
      .eq("store_code", storeCode)
      .single();

    if (!data) {
      return res.status(404).json({ error: "store_not_found" });
    }

    res.json({
      storeCode: data.store_code,
      storeName: data.store_name,
      logoUrl: null,
      brandColor: null,
      stampGoal: data.stamp_goal,
      rewardDescription: data.reward_desc,
    });
  });

  // GET /api/stamp/:storeCode/user/:phone
  app.get("/api/stamp/:storeCode/user/:phone", async (req, res) => {
    const { storeCode, phone } = req.params;
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    if (cleanPhone.length !== 11) {
      return res.status(400).json({ error: "invalid_phone" });
    }

    const sb = getSupabase();

    const { data: store } = await sb
      .from("stores")
      .select("id, stamp_goal")
      .eq("store_code", storeCode)
      .single();

    if (!store) {
      return res.status(404).json({ error: "store_not_found" });
    }

    const { data: customer } = await sb
      .from("customers")
      .select("current_stamps, last_visit_at")
      .eq("store_id", store.id)
      .eq("phone", cleanPhone)
      .single();

    if (!customer) {
      return res.json({
        isNewCustomer: true,
        currentStamps: 0,
        stampGoal: store.stamp_goal,
        lastStampedAt: null,
      });
    }

    res.json({
      isNewCustomer: false,
      currentStamps: customer.current_stamps,
      stampGoal: store.stamp_goal,
      lastStampedAt: customer.last_visit_at,
    });
  });

  // POST /api/stamp/:storeCode
  app.post("/api/stamp/:storeCode", async (req, res) => {
    const { storeCode } = req.params;
    const { phone, name, marketingConsent, forceConsent } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "invalid_phone" });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 11) {
      return res.status(400).json({ error: "invalid_phone" });
    }

    const sb = getSupabase();

    const { data: store } = await sb
      .from("stores")
      .select("id, stamp_goal")
      .eq("store_code", storeCode)
      .single();

    if (!store) {
      return res.status(404).json({ error: "store_not_found" });
    }

    const { data: customer } = await sb
      .from("customers")
      .select("id, name, current_stamps, total_stamps, total_visits, last_visit_at")
      .eq("store_id", store.id)
      .eq("phone", cleanPhone)
      .single();

    const userExists = !!customer;

    // New customer without terms consent — prompt UI to show consent screen
    if (!userExists && forceConsent !== true) {
      return res.json({
        stampEarned: false,
        alreadyStampedToday: false,
        currentStamps: 0,
        stampGoal: store.stamp_goal,
        rewardTriggered: false,
        isNewCustomer: true,
      });
    }

    const nowStr = new Date().toISOString();

    // Check daily stamp limit (1 per day in KST)
    if (userExists && customer.last_visit_at) {
      const todayKST = new Date(nowStr).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
      const lastKST = new Date(customer.last_visit_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
      if (todayKST === lastKST) {
        return res.json({
          stampEarned: false,
          alreadyStampedToday: true,
          currentStamps: customer.current_stamps,
          stampGoal: store.stamp_goal,
          rewardTriggered: false,
          isNewCustomer: false,
        });
      }
    }

    let finalCustomerId: string;
    let finalCurrentStamps: number;

    if (!userExists) {
      const { data: newCustomer, error } = await sb
        .from("customers")
        .insert({
          store_id: store.id,
          name: name || null,
          phone: cleanPhone,
          phone_masked: maskPhone(cleanPhone),
          marketing_consent: !!marketingConsent,
          marketing_consent_at: marketingConsent ? nowStr : null,
          current_stamps: 1,
          total_stamps: 1,
          total_visits: 1,
          last_visit_at: nowStr,
        })
        .select("id")
        .single();

      if (error || !newCustomer) {
        return res.status(500).json({ error: "failed_to_create_customer" });
      }

      finalCustomerId = newCustomer.id;
      finalCurrentStamps = 1;
    } else {
      const newStamps = customer.current_stamps + 1;
      const rewardNow = newStamps >= store.stamp_goal;

      await sb
        .from("customers")
        .update({
          name: name || customer.name,
          current_stamps: rewardNow ? 0 : newStamps,
          total_stamps: customer.total_stamps + 1,
          total_visits: customer.total_visits + 1,
          last_visit_at: nowStr,
        })
        .eq("id", customer.id);

      finalCustomerId = customer.id;
      finalCurrentStamps = newStamps;
    }

    // Record visit
    await sb.from("visit_logs").insert({
      customer_id: finalCustomerId,
      store_id: store.id,
      visited_at: nowStr,
      stamps_earned: 1,
      source: "kiosk",
    });

    const rewardTriggered = finalCurrentStamps >= store.stamp_goal;

    res.json({
      stampEarned: true,
      alreadyStampedToday: false,
      currentStamps: rewardTriggered ? store.stamp_goal : finalCurrentStamps,
      stampGoal: store.stamp_goal,
      rewardTriggered,
      isNewCustomer: !userExists,
    });
  });

  // POST /api/test/reset (dev testing only)
  app.post("/api/test/reset", async (req, res) => {
    const { phone, storeCode, action, stamps } = req.body;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

    if (!cleanPhone) {
      return res.status(400).json({ error: "Phone number required" });
    }

    const sb = getSupabase();

    const { data: store } = await sb
      .from("stores")
      .select("id, stamp_goal")
      .eq("store_code", storeCode)
      .single();

    if (!store) {
      return res.status(404).json({ error: "store_not_found" });
    }

    const { data: customer } = await sb
      .from("customers")
      .select("id")
      .eq("store_id", store.id)
      .eq("phone", cleanPhone)
      .single();

    if (action === "reset-all") {
      if (customer) {
        await sb.from("customers").delete().eq("id", customer.id);
      }
    } else if (action === "reset-today") {
      if (customer) {
        await sb.from("customers").update({ last_visit_at: null }).eq("id", customer.id);
      }
    } else if (action === "set-stamps") {
      const targetStamps = Number(stamps);
      if (customer) {
        await sb.from("customers").update({ current_stamps: targetStamps }).eq("id", customer.id);
      } else {
        await sb.from("customers").insert({
          store_id: store.id,
          phone: cleanPhone,
          phone_masked: maskPhone(cleanPhone),
          marketing_consent: false,
          current_stamps: targetStamps,
          total_stamps: targetStamps,
          total_visits: 0,
          last_visit_at: null,
        });
      }
    }

    res.json({ success: true });
  });

  // Dev: Vite dev server as middleware / Prod: serve dist
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
