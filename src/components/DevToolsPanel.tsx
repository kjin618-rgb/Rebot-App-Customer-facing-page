import React from "react";

interface DevToolsPanelProps {
  storeCode: string;
  onSelectStoreCode: (code: string) => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  phone: string;
  name: string;
  currentStamps: number;
  stampGoal: number;
  onSetStamps: (n: number) => void;
  onResetTodayLimit: () => void;
  onResetAccount: () => void;
  showTesterPanel: boolean;
  onHide: () => void;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  storeCode,
  onSelectStoreCode,
  offlineMode,
  onToggleOffline,
  phone,
  name,
  currentStamps,
  stampGoal,
  onSetStamps,
  onResetTodayLimit,
  onResetAccount,
  showTesterPanel,
  onHide,
}) => {
  return (
    <div className={`w-full md:w-[350px] bg-stone-900 text-stone-100 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800 transition-all duration-300 ${showTesterPanel ? "block" : "hidden"}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-bold tracking-wider text-stone-400 uppercase">Rebot Admin Test Suite</h3>
          </div>
          <button
            onClick={onHide}
            className="text-xs px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md cursor-pointer transition-colors"
          >
            숨기기
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">1. 매장 스캔 (QR 시뮬레이션)</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onSelectStoreCode("cafe-rebot")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "cafe-rebot" ? "bg-emerald-950 border-emerald-500 text-emerald-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              🌲 리봇 베이커리
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 10개 기준</span>
            </button>
            <button
              onClick={() => onSelectStoreCode("sweet-bakery")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "sweet-bakery" ? "bg-amber-950 border-amber-500 text-amber-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              🥐 달콤 베이커리
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 8개 기준</span>
            </button>
            <button
              onClick={() => onSelectStoreCode("coffee-ground")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "coffee-ground" ? "bg-slate-800 border-slate-500 text-slate-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              ☕ 커피 그라운드
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 12개 기준</span>
            </button>
            <button
              onClick={() => onSelectStoreCode("daily-bread")}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${storeCode === "daily-bread" ? "bg-orange-950 border-orange-500 text-orange-200 shadow-xs" : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"}`}
            >
              🍞 매일 브레드
              <span className="block text-[9px] text-stone-400 font-normal mt-0.5">스탬프: 5개 기준</span>
            </button>
          </div>
          <button
            onClick={() => onSelectStoreCode("not-found-code")}
            className="w-full py-2.5 text-xs bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-900 rounded-xl transition-all cursor-pointer"
          >
            ⚠️ 잘못된 매장 코드 (404 에러 화면)
          </button>
        </div>

        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">2. 네트워크 상태 시뮬레이션</h4>
          <div className="flex items-center justify-between bg-stone-800/80 p-3 rounded-xl border border-stone-700/60">
            <span className="text-xs font-medium text-stone-300">오프라인 모드 강제 활성</span>
            <button
              onClick={onToggleOffline}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${offlineMode ? "bg-red-600 text-white shadow-md animate-pulse" : "bg-stone-700 hover:bg-stone-600 text-stone-300"}`}
            >
              {offlineMode ? "켜짐 (오류 유도)" : "꺼짐"}
            </button>
          </div>
        </div>

        {phone && (
          <div className="space-y-4 pt-2 border-t border-stone-800/80">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">3. 단골 데이터 수동 조정</h4>
            <div className="bg-stone-800/40 p-3 rounded-xl border border-stone-700/40 space-y-3">
              <div className="text-xs text-stone-400 space-y-1">
                <div>이름: <span className="font-semibold text-stone-200">{name || "(미지정)"}</span></div>
                <div>번호: <span className="font-semibold text-stone-200">{phone}</span></div>
                <div>현재 스탬프: <span className="font-semibold text-stone-100">{currentStamps}개</span></div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-stone-400 font-medium">스탬프 보유수 세팅:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 4, stampGoal - 1].map((val) => (
                    <button
                      key={val}
                      onClick={() => onSetStamps(val)}
                      className="py-1 px-1 bg-stone-800 hover:bg-stone-700 rounded-sm text-[10px] text-stone-300 text-center font-bold"
                    >
                      {val}개
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={onResetTodayLimit}
                  className="w-full py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-800/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  🔄 오늘 이미 적립 제한 초기화
                </button>
                <button
                  onClick={onResetAccount}
                  className="w-full py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-800/50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  🗑️ 데이터 완적 삭제 (신규 번호로)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-stone-800/60 text-[11px] text-stone-500 space-y-1">
        <p>리봇 모바일 웹 프로토타입 테스터 바</p>
        <p>QR 코드 스캔 시나리오를 자유롭게 변경하고 즉각 피드백을 확인해 보세요.</p>
      </div>
    </div>
  );
};
