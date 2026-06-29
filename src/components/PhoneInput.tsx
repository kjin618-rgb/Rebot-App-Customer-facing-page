import React, { useState, useEffect } from "react";
import { Sparkles, Phone, User as UserIcon } from "lucide-react";
import { Store } from "../types";

interface PhoneInputProps {
  store: Store;
  onSubmit: (phone: string, name: string) => void;
  savedPhone?: string;
  isLoading: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  store,
  onSubmit,
  savedPhone = "",
  isLoading,
}) => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const brandColor = store.brandColor || "#15803d";

  // Pre-fill saved phone and apply formatting
  useEffect(() => {
    if (savedPhone) {
      setPhone(formatPhoneNumber(savedPhone));
    }
  }, [savedPhone]);

  // Format utility: 01012345678 -> 010-1234-5678
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/[^0-9]/g, "");
    
    // Limit to 11 digits max
    if (digitsOnly.length <= 11) {
      setPhone(formatPhoneNumber(digitsOnly));
      setError("");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phone.replace(/[^0-9]/g, "");
    
    if (digitsOnly.length !== 11) {
      setError("올바른 휴대전화 번호 11자리를 입력해주세요.");
      return;
    }

    if (!digitsOnly.startsWith("010")) {
      setError("010으로 시작하는 번호를 입력해주세요.");
      return;
    }

    onSubmit(digitsOnly, name);
  };

  const rawDigits = phone.replace(/[^0-9]/g, "");
  const isValid = rawDigits.length === 11 && rawDigits.startsWith("010");

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <span 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 tracking-wide"
          style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          방문해 주셔서 감사합니다!
        </span>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" id="welcome-heading">
          스탬프 적립을 시작합니다
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {store.storeName}의 특별한 단골 혜택!<br />
          전화번호 입력만으로 간편하게 스탬프를 모으세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="stamp-request-form">
        <div className="space-y-1.5">
          <label htmlFor="phone-number-input" className="text-sm font-semibold text-gray-700 block">
            휴대전화 번호 <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Phone className="w-5 h-5" />
            </span>
            <input
              id="phone-number-input"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${
                error ? "border-rose-500 focus:ring-rose-200" : "border-gray-200 focus:ring-emerald-100"
              } rounded-2xl text-lg font-semibold text-gray-800 placeholder-gray-300 focus:border-current focus:ring-4 focus:outline-hidden transition-all duration-200`}
              style={{
                borderColor: error ? "#f43f5e" : !phone ? "#e5e7eb" : isValid ? brandColor : "#cbd5e1"
              }}
              required
              aria-required="true"
            />
          </div>
          {error ? (
            <p className="text-xs font-medium text-rose-500 mt-1" id="phone-error-msg">{error}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">입력하신 번호는 본인 식별 및 적립 안내용으로만 사용됩니다.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name-input" className="text-sm font-semibold text-gray-700 block">
            이름 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <UserIcon className="w-5 h-5" />
            </span>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="이름 (선택)"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-base font-medium text-gray-800 placeholder-gray-300 focus:border-current focus:ring-4 focus:ring-emerald-500/10 focus:outline-hidden transition-all duration-200"
              style={{
                borderColor: name ? brandColor : "#e5e7eb"
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full mt-2 text-white font-bold py-4 rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-base"
          style={{
            backgroundColor: isValid && !isLoading ? brandColor : undefined,
          }}
          id="submit-stamp-btn"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              적립 요청 중...
            </>
          ) : (
            "스탬프 적립하기"
          )}
        </button>
      </form>
    </div>
  );
};
