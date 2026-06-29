import React from "react";
import { Store } from "../types";
import { Coffee, ArrowLeft } from "lucide-react";

interface HeaderProps {
  store: Store | null;
  onResetPhone?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  store,
  onResetPhone,
  showBackButton = false,
  onBack,
}) => {
  const brandColor = store?.brandColor || "#15803d"; // Default to emerald green

  return (
    <header className="w-full bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-3">
        {showBackButton && onBack ? (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer"
            aria-label="뒤로 가기"
            id="header-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}

        {store ? (
          <div className="flex items-center gap-3">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={`${store.storeName} 로고`}
                className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-2xs"
                referrerPolicy="no-referrer"
                id="store-logo-img"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-2xs"
                style={{ backgroundColor: brandColor }}
                id="store-default-logo"
              >
                <Coffee className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-base font-semibold text-gray-900 tracking-tight" id="store-title">
                {store.storeName}
              </h1>
              <span className="text-xs text-gray-500 font-medium">Rebot 디지털 스탬프</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-gray-200 rounded-sm" />
              <div className="h-3 w-16 bg-gray-100 rounded-sm" />
            </div>
          </div>
        )}
      </div>

      {onResetPhone && (
        <button
          onClick={onResetPhone}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium border border-gray-200 hover:border-gray-300 rounded-full px-3 py-1 transition-colors cursor-pointer"
          id="header-logout-btn"
        >
          번호 변경
        </button>
      )}
    </header>
  );
};
