import React, { useState } from "react";
import { Check, Info, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";
import { Store } from "../types";

interface TermsConsentProps {
  store: Store;
  phone: string;
  name?: string;
  onSubmit: (marketingConsent: boolean) => void;
  isLoading: boolean;
  onBack: () => void;
}

export const TermsConsent: React.FC<TermsConsentProps> = ({
  store,
  phone,
  onSubmit,
  isLoading,
  onBack,
}) => {
  const [requiredAgreed, setRequiredAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [showRequiredDetails, setShowRequiredDetails] = useState(false);
  const [showMarketingDetails, setShowMarketingDetails] = useState(false);

  const brandColor = store.brandColor || "#15803d";

  const handleAllAgreed = () => {
    if (requiredAgreed && marketingAgreed) {
      setRequiredAgreed(false);
      setMarketingAgreed(false);
    } else {
      setRequiredAgreed(true);
      setMarketingAgreed(true);
    }
  };

  const formattedPhone = phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");

  const handleSubmit = () => {
    if (!requiredAgreed) return;
    onSubmit(marketingAgreed);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <div 
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${brandColor}15` }}
        >
          <ShieldCheck className="w-8 h-8" style={{ color: brandColor }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" id="terms-heading">
          첫 방문을 환영합니다!
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          고객님의 번호 <span className="font-semibold text-gray-800">{formattedPhone}</span>은<br />
          리봇 디지털 스탬프 서비스의 신규 번호입니다.<br />
          이용을 위해 아래 약관에 동의해 주세요.
        </p>
      </div>

      <div className="space-y-4" id="terms-checkbox-list">
        {/* All Agreement Button */}
        <button
          type="button"
          onClick={handleAllAgreed}
          className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer text-left"
          id="agree-all-btn"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                requiredAgreed && marketingAgreed
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-gray-300 text-transparent"
              }`}
              style={{
                backgroundColor: requiredAgreed && marketingAgreed ? brandColor : undefined,
                borderColor: requiredAgreed && marketingAgreed ? brandColor : undefined,
              }}
            >
              <Check className="w-4 h-4 stroke-[3px]" />
            </div>
            <span className="text-base font-bold text-gray-800">약관 전체 동의하기</span>
          </div>
        </button>

        <hr className="border-gray-100" />

        {/* Required Agreement */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRequiredAgreed(!requiredAgreed)}
              className="flex items-center gap-3 py-2 text-left cursor-pointer flex-1"
              id="agree-required-btn"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  requiredAgreed
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-gray-300 text-transparent animate-pulse"
                }`}
                style={{
                  backgroundColor: requiredAgreed ? brandColor : undefined,
                  borderColor: requiredAgreed ? brandColor : undefined,
                }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                <span className="font-bold text-emerald-600" style={{ color: brandColor }}>[필수]</span> 서비스 이용 약관 동의
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowRequiredDetails(!showRequiredDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="서비스 이용약관 보기"
              id="toggle-required-details"
            >
              {showRequiredDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {showRequiredDetails && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 leading-relaxed max-h-24 overflow-y-auto">
              <p className="font-semibold mb-1">제1조 (목적)</p>
              본 약관은 리봇 스탬프 서비스가 제공하는 모바일 디지털 적립 혜택의 이용조건 및 절차를 규정합니다.
              <p className="font-semibold mt-2 mb-1">제2조 (개인정보 수집)</p>
              수집 항목: 휴대전화 번호, 이름(선택).<br />
              목적: 스탬프 카드 개설, 방문 적립 실적 기록 및 리워드 쿠폰 식별.<br />
              보유 기간: 서비스 해지 시 또는 최종 적립일로부터 5년까지 보관됩니다.
            </div>
          )}
        </div>

        {/* Optional Agreement */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMarketingAgreed(!marketingAgreed)}
              className="flex items-center gap-3 py-2 text-left cursor-pointer flex-1"
              id="agree-optional-btn"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  marketingAgreed
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-gray-300 text-transparent"
                }`}
                style={{
                  backgroundColor: marketingAgreed ? brandColor : undefined,
                  borderColor: marketingAgreed ? brandColor : undefined,
                }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                <span className="font-bold text-gray-400">[선택]</span> 마케팅 정보 수신 및 알림 동의
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowMarketingDetails(!showMarketingDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="마케팅 동의약관 보기"
              id="toggle-optional-details"
            >
              {showMarketingDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {showMarketingDetails && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 leading-relaxed max-h-24 overflow-y-auto">
              <p className="font-semibold mb-1">제1조 (목적)</p>
              매장의 신메뉴 출시, 할인 이벤트 및 이탈 방지를 위한 재방문 장려 리마인더 등 모바일 알림 톡 및 마케팅 정보를 수신합니다.
              <p className="font-semibold mt-2 mb-1">제2조 (철회)</p>
              동의하지 않으셔도 스탬프 적립은 제한 없이 정상 제공되며, 원하시는 경우 마이페이지 또는 스탬프 내역을 통해 언제든 철회할 수 있습니다.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={handleSubmit}
          disabled={!requiredAgreed || isLoading}
          className="w-full text-white font-bold py-4 rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-base"
          style={{
            backgroundColor: requiredAgreed && !isLoading ? brandColor : undefined,
          }}
          id="confirm-terms-btn"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              등록 처리 중...
            </>
          ) : (
            "동의하고 스탬프 적립하기"
          )}
        </button>

        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold py-3.5 rounded-2xl transition-colors cursor-pointer text-sm"
          id="terms-back-btn"
        >
          전화번호 입력으로 돌아가기
        </button>
      </div>

      <div className="mt-6 flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          동의 후 매장 스탬프가 1개 적립되며, 쿠폰 달성 현황을 즉시 실시간 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
};
