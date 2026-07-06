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
