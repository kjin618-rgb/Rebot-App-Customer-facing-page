import React from "react";
import { Coffee } from "lucide-react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-6" id="skeleton-view">
      <div className="w-16 h-16 bg-[#F5F2EB] rounded-2xl animate-pulse flex items-center justify-center">
        <Coffee className="w-8 h-8 text-[#8D7B73]/30" />
      </div>
      <div className="space-y-3 w-full text-center">
        <div className="h-5 w-1/2 bg-[#F5F2EB] rounded-md mx-auto animate-pulse" />
        <div className="h-4 w-3/4 bg-[#F5F2EB] rounded-md mx-auto animate-pulse" />
      </div>
      <div className="bg-white border border-[#E5E2DA] rounded-3xl p-6 w-full space-y-4 shadow-sm">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-full bg-[#F5F2EB] animate-pulse" />
          ))}
        </div>
        <div className="h-8 bg-[#F5F2EB] rounded-xl w-full animate-pulse mt-4" />
      </div>
      <p className="text-xs text-[#8D7B73] animate-pulse">QR 매장 정보를 읽어오고 있습니다...</p>
    </div>
  );
};
