import React from "react";
import { Trophy, Sparkles } from "lucide-react";
import { Store } from "../types";

interface StampGridProps {
  store: Store;
  currentStamps: number;
  stampGoal: number;
  newStampAdded?: boolean; // If true, animate the newly added stamp
  lastStampedAt: string | null;
}

// 스탬프 도장에 새길 날짜: 좁은 원형 칸에 맞춰 MM.DD로 축약
const formatStampDate = (iso: string) => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
};

export const StampGrid: React.FC<StampGridProps> = ({
  store,
  currentStamps,
  stampGoal,
  newStampAdded = false,
  lastStampedAt,
}) => {
  const brandColor = store.brandColor || "#4A6741"; // Use store brand color or default to Warm Organic green
  const maxStamps = stampGoal;

  return (
    <div className="space-y-4" id="stamp-grid-container">
      {/* Stamp Card Board */}
      <div
        className="bg-white border border-[#E5E2DA] rounded-3xl p-6 shadow-xs relative overflow-hidden"
        id="stamp-card-board"
      >
        {/* Card Decorative background texture */}
        <div className="absolute inset-0 opacity-2 pointer-events-none bg-[radial-gradient(#4A6741_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Stamps Grid */}
        <div
          className="grid gap-3 relative z-10"
          style={{
            gridTemplateColumns: `repeat(${maxStamps <= 6 ? 3 : maxStamps <= 10 ? 5 : 4}, minmax(0, 1fr))`,
          }}
          id="stamps-grid"
        >
          {Array.from({ length: maxStamps }).map((_, index) => {
            const stampNumber = index + 1;
            const isFilled = stampNumber <= currentStamps;
            const isLatest = isFilled && stampNumber === currentStamps && newStampAdded;
            const isMostRecentStamp = isFilled && stampNumber === currentStamps && !!lastStampedAt;
            const isRewardPosition = stampNumber === maxStamps;
            const rotationDeg = stampNumber % 2 === 0 ? 6 : -6;

            if (isRewardPosition) {
              // Reward Stamp Slot (Last item)
              return (
                <div
                  key={index}
                  className={`aspect-square rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    isFilled
                      ? "bg-[#F27D26] text-white ring-4 ring-[#FDFCF8] shadow-md scale-105"
                      : "bg-[#F5F2EB] border-2 border-dashed border-[#F27D26]/40 text-[#F27D26]"
                  }`}
                  id={`stamp-slot-${stampNumber}`}
                >
                  {isFilled ? (
                    <div className="animate-pulse flex items-center justify-center">
                      <Trophy className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                  ) : (
                    <Trophy className="w-5 h-5" />
                  )}
                  {/* Goal label indicator */}
                  <span className="absolute -bottom-1 text-[8px] font-bold uppercase tracking-wider bg-white border border-[#E5E2DA] text-[#8D7B73] px-1 rounded-sm scale-90">
                    GIFT
                  </span>
                </div>
              );
            }

            // Normal Stamp Slot
            return (
              <div
                key={index}
                className={`aspect-square rounded-full flex items-center justify-center relative transition-all duration-300 bg-[#F5F2EB] border border-[#E5E2DA] ${
                  isFilled ? "" : "text-[#8D7B73]/30"
                } ${isLatest ? "animate-bounce" : ""}`}
                id={`stamp-slot-${stampNumber}`}
              >
                {isFilled ? (
                  <div
                    className="absolute inset-[10%] rounded-full flex items-center justify-center"
                    style={{
                      border: `2px solid ${brandColor}`,
                      opacity: 0.8,
                      mixBlendMode: "multiply",
                      transform: `rotate(${rotationDeg}deg)`,
                    }}
                  >
                    <div
                      className="absolute inset-[3px] rounded-full"
                      style={{ border: `1px solid ${brandColor}` }}
                    />
                    {isMostRecentStamp && lastStampedAt && (
                      <span
                        className="font-black tracking-tighter"
                        style={{
                          color: brandColor,
                          fontFamily: "monospace",
                          fontSize: "9px",
                          transform: `rotate(${-rotationDeg}deg)`,
                        }}
                      >
                        {formatStampDate(lastStampedAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-semibold tracking-tighter" style={{ fontFamily: "monospace" }}>
                    {stampNumber}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Counter Info & Progress Bar */}
        <div className="border-t border-dashed border-[#E5E2DA] mt-6 pt-5 flex items-center justify-between" id="stamps-progress-summary">
          <div>
            <p className="text-xs text-[#8D7B73] font-medium tracking-tight">현재 모은 스탬프</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold tracking-tight" style={{ color: brandColor }} id="current-stamps-count">
                {currentStamps}
              </span>
              <span className="text-sm text-[#8D7B73] font-semibold">/</span>
              <span className="text-sm text-[#8D7B73] font-bold" id="goal-stamps-count">{maxStamps}개</span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#8D7B73]">
              <Sparkles className="w-3 h-3 text-[#F27D26]" />
              {maxStamps - currentStamps === 0 ? "목표 완료!" : `남은 스탬프: ${maxStamps - currentStamps}개`}
            </span>
            <p className="text-[10px] text-[#8D7B73] mt-1.5 tracking-tight font-medium">
              혜택: {store.rewardDescription}
            </p>
          </div>
        </div>

        {/* Visual progress line */}
        <div className="w-full bg-[#F5F2EB] h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min((currentStamps / maxStamps) * 100, 100)}%`,
              backgroundColor: currentStamps === maxStamps ? "#F27D26" : brandColor
            }}
          />
        </div>
      </div>
    </div>
  );
};
