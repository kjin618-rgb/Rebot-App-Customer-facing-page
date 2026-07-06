import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface InvalidStoreScreenProps {
  onSelectStore: (code: string) => void;
}

export const InvalidStoreScreen: React.FC<InvalidStoreScreenProps> = ({ onSelectStore }) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center" id="invalid-store-view">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mb-5 shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-bold text-[#3E2723]" id="invalid-store-heading">매장을 찾을 수 없습니다</h3>
      <p className="text-sm text-[#8D7B73] mt-3 leading-relaxed">
        스캔하신 QR 코드의 매장 정보가 유효하지 않거나 비활성화된 서비스 코드입니다.<br />
        매장 직원에게 문의하시거나 다시 시도해 주세요.
      </p>

      {/* Visual Store switcher list inside mobile */}
      <div className="w-full bg-[#F5F2EB] border border-[#E5E2DA] rounded-2xl p-4 mt-8 space-y-2 text-left">
        <span className="text-[10px] font-bold text-[#8D7B73] uppercase tracking-wider block mb-1">
          데모 매장 선택해보기:
        </span>
        {["cafe-rebot", "sweet-bakery"].map((code) => (
          <button
            key={code}
            onClick={() => onSelectStore(code)}
            className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-orange-50 border border-[#E5E2DA] rounded-xl text-xs font-semibold text-[#3E2723] transition-colors cursor-pointer"
          >
            <span>{code === "cafe-rebot" ? "🌲 리봇 베이커리" : "🥐 달콤 베이커리"}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8D7B73]" />
          </button>
        ))}
      </div>
    </div>
  );
};
