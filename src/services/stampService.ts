import { Store, StampResult } from "../types";

export async function getStore(storeCode: string): Promise<Store | null> {
  const res = await fetch(`/api/store/${storeCode}`);
  if (!res.ok) return null;
  return res.json();
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
  const res = await fetch(`/api/stamp/${storeCode}/user/${phone}`);
  if (!res.ok) throw new Error("store_not_found");
  return res.json();
}

export async function earnStamp(
  storeCode: string,
  phone: string,
  name: string,
  marketingConsent: boolean,
  forceConsent = false
): Promise<StampResult> {
  const res = await fetch(`/api/stamp/${storeCode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name, marketingConsent, forceConsent }),
  });
  if (!res.ok) throw new Error("stamp_failed");
  return res.json();
}

export async function testReset(
  phone: string,
  storeCode: string,
  action: "reset-all" | "reset-today" | "set-stamps",
  stamps?: number
): Promise<void> {
  await fetch("/api/test/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, storeCode, action, stamps }),
  });
}
