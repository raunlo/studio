import React from "react";
import { useTranslation } from "react-i18next";

export const LoginButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  
  return (
    <button
      className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 font-bold text-base overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <span className="relative z-10 flex items-center gap-2">
        🚀 {t('auth.signIn')}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
      </span>
    </button>
  );
};
