import React from "react";
import { Trophy } from "lucide-react";
import { Store } from "../types";

interface RewardSuccessScreenProps {
  store: Store;
  maskedPhone: string;
  activeColor: string;
  onStartNewCard: () => void;
  onResetPhone: () => void;
}

export const RewardSuccessScreen: React.FC<RewardSuccessScreenProps> = ({
  store,
  maskedPhone,
  activeColor,
  onStartNewCard,
  onResetPhone,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in" id="reward-success-container">
      <div className="space-y-6 text-center py-6">

        {/* Big celebratory icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-[#F27D26]/10 flex items-center justify-center mx-auto ring-4 ring-[#F27D26]/20">
            <Trophy className="w-10 h-10 text-[#F27D26] animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-md animate-ping">
            ★
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-[#F27D26] tracking-widest uppercase">REWARD TRIGGERED!</span>
          <h3 className="text-2xl font-black text-[#3E2723] tracking-tight">
            축하합니다! 리워드 달성
          </h3>
          <p className="text-sm text-[#8D7B73] max-w-xs mx-auto leading-relaxed">
            모든 스탬프를 가득 채우셨습니다. 아래 보상 혜택을 사장님께 확인해 주세요.
          </p>
        </div>

        {/* Big Reward voucher display */}
        <div className="bg-white border-2 border-dashed border-[#F27D26] rounded-3xl p-6 shadow-sm relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FDFCF8] border-r border-[#E5E2DA] rounded-full"></div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FDFCF8] border-l border-[#E5E2DA] rounded-full"></div>

          <p className="text-xs font-semibold text-[#8D7B73] mb-1">매장 단골 특별 쿠폰</p>
          <h2 className="text-xl md:text-2xl font-black text-[#F27D26] mb-4" id="reward-desc-celebration">
            {store.rewardDescription}
          </h2>

          <div className="bg-[#F5F2EB] border border-[#E5E2DA] rounded-2xl py-3 px-4 inline-block">
            <p className="text-xs font-bold text-[#3E2723]">사장님께 이 화면을 보여주세요</p>
          </div>
        </div>

        {/* Masked User feedback */}
        <div className="text-center">
          <span className="text-[11px] text-[#8D7B73] font-medium">
            쿠폰 수령자 번호: {maskedPhone}
          </span>
          <p className="text-[11px] text-emerald-700 font-bold mt-1">
            ※ 다음 카드가 새로 시작되었어요!
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onStartNewCard}
          className="w-full py-4 bg-[#4A6741] text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-transform cursor-pointer"
          style={{ backgroundColor: activeColor }}
          id="start-new-card-btn"
        >
          새 카드 시작하기
        </button>

        <button
          onClick={onResetPhone}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          id="celebration-exit-btn"
        >
          완료 후 메인으로
        </button>
      </div>
    </div>
  );
};
