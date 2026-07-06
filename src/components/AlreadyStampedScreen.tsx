import React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Store } from "../types";
import { StampGrid } from "./StampGrid";

interface AlreadyStampedScreenProps {
  store: Store;
  maskedPhone: string;
  currentStamps: number;
  stampGoal: number;
  lastStampedAt: string | null;
  activeColor: string;
  onResetPhone: () => void;
}

export const AlreadyStampedScreen: React.FC<AlreadyStampedScreenProps> = ({
  store,
  maskedPhone,
  currentStamps,
  stampGoal,
  lastStampedAt,
  activeColor,
  onResetPhone,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in" id="already-stamped-container">
      <div className="space-y-4">
        {/* Warning Header */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start" id="already-stamped-warning">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">오늘 이미 적립하셨습니다</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              리봇 디지털 스탬프는 매장 정책상 1일 1회만 적립이 가능합니다. 내일 다시 방문하여 스탬프를 적립해 주세요!
            </p>
          </div>
        </div>

        {/* Stamp status is shown below */}
        <div className="bg-[#F5F2EB] rounded-2xl px-4 py-3 flex justify-between items-center" id="phone-ribbon">
          <span className="text-xs font-bold text-[#8D7B73] tracking-wide">고객 정보</span>
          <span className="text-sm font-bold text-[#3E2723] block tracking-wide">
            {maskedPhone}
          </span>
        </div>

        <StampGrid
          store={store}
          currentStamps={currentStamps}
          stampGoal={stampGoal}
          newStampAdded={false}
        />

        {lastStampedAt && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-[#8D7B73] font-medium inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              오늘 적립 시각: {new Date(lastStampedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onResetPhone}
        className="w-full mt-6 py-4 bg-[#4A6741] text-white font-bold rounded-2xl shadow-lg hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        style={{ backgroundColor: activeColor }}
        id="already-stamped-confirm-btn"
      >
        확인 완료
      </button>
    </div>
  );
};
