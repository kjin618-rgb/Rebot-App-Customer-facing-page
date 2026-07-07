import React from "react";
import { Sparkles, Trophy, Clock } from "lucide-react";
import { Store } from "../types";
import { StampGrid } from "./StampGrid";

interface StampsScreenProps {
  store: Store;
  maskedPhone: string;
  name: string;
  currentStamps: number;
  stampGoal: number;
  newStampAdded: boolean;
  lastStampedAt: string | null;
  activeColor: string;
  onResetPhone: () => void;
}

export const StampsScreen: React.FC<StampsScreenProps> = ({
  store,
  maskedPhone,
  name,
  currentStamps,
  stampGoal,
  newStampAdded,
  lastStampedAt,
  activeColor,
  onResetPhone,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6" id="stamps-success-container">
      <div className="space-y-4">

        {/* Phone Info ribbon */}
        <div className="bg-[#F5F2EB] rounded-2xl px-4 py-3 flex justify-between items-center" id="phone-ribbon">
          <span className="text-xs font-bold text-[#8D7B73] tracking-wide">고객 정보</span>
          <div className="text-right">
            <span className="text-sm font-bold text-[#3E2723] block tracking-wide">
              {maskedPhone}
            </span>
            {name && <span className="text-[11px] text-[#8D7B73] font-medium">{name} 단골님</span>}
          </div>
        </div>

        {/* Stamp added celebration tag */}
        {newStampAdded && (
          <div
            className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center animate-fade-in"
            style={{
              backgroundColor: `${activeColor}12`,
              borderColor: `${activeColor}25`
            }}
            id="stamp-added-celeb-banner"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: activeColor }}>
              <Sparkles className="w-4 h-4 animate-spin" />
              방금 스탬프 1개가 성공적으로 적립되었습니다!
            </div>
          </div>
        )}

        {/* Stamp card widget board */}
        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={newStampAdded}
          lastStampedAt={lastStampedAt}
        />

        {/* Timestamp indicator */}
        {lastStampedAt && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-[#8D7B73] font-medium inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              마지막 적립: {new Date(lastStampedAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 mt-6">
        <div className="bg-[#F5F2EB] border border-[#E5E2DA]/60 p-4 rounded-2xl space-y-1.5" id="store-reward-card-info">
          <h5 className="text-xs font-extrabold text-[#8D7B73] uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-[#F27D26]" />
            리워드 달성 조건
          </h5>
          <p className="text-sm font-extrabold text-[#3E2723] leading-snug">
            스탬프 {stampGoal}개를 모두 모으시면 <span className="text-[#F27D26]">{store.rewardDescription}</span>를 드립니다.
          </p>
        </div>

        <button
          onClick={onResetPhone}
          className="w-full py-3.5 text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer text-sm"
          style={{ backgroundColor: activeColor }}
          id="back-to-scan-btn"
        >
          확인 완료 (메인으로)
        </button>
      </div>
    </div>
  );
};
