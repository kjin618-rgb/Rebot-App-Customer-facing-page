import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface NetworkErrorScreenProps {
  onRetry: () => void;
}

export const NetworkErrorScreen: React.FC<NetworkErrorScreenProps> = ({ onRetry }) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center" id="network-error-view">
      <div className="w-16 h-16 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-center mb-5 shadow-xs">
        <AlertOctagon className="w-8 h-8 text-rose-600 animate-bounce" />
      </div>
      <h3 className="text-xl font-bold text-[#3E2723]" id="network-error-heading">연결 상태가 좋지 않습니다</h3>
      <p className="text-sm text-[#8D7B73] mt-3 leading-relaxed">
        네트워크 접속이 원활하지 않아 스탬프 정보를 수신할 수 없습니다. 일시적인 현상일 수 있으니 아래 재시도 버튼을 눌러주세요.
      </p>
      <button
        onClick={onRetry}
        className="w-full mt-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        id="retry-network-btn"
      >
        <RefreshCw className="w-4 h-4" />
        다시 시도하기
      </button>
    </div>
  );
};
