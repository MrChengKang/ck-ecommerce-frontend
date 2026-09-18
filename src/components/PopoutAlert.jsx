import React from "react";

export default function PopoutAlert({
  isOpen,
  title,
  message,
  type = "info",
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  // Icon 與主題顏色配色
  const config = {
    success: {
      bgColor: "bg-emerald-50 border-emerald-200/80 text-emerald-600",
      btnColor: "bg-black hover:bg-gray-800 text-white",
      icon: "✓",
    },
    error: {
      bgColor: "bg-rose-50 border-rose-200/80 text-rose-600",
      btnColor: "bg-rose-600 hover:bg-rose-700 text-white",
      icon: "✕",
    },
    warning: {
      bgColor: "bg-amber-50 border-amber-200/80 text-amber-600",
      btnColor: "bg-black hover:bg-gray-800 text-white",
      icon: "!",
    },
    info: {
      bgColor: "bg-blue-50 border-blue-200/80 text-blue-600",
      btnColor: "bg-[#0071e3] hover:bg-[#0077ed] text-white",
      icon: "i",
    },
  }[type] || {
    bgColor: "bg-gray-50 border-gray-200 text-gray-600",
    btnColor: "bg-black hover:bg-gray-800 text-white",
    icon: "i",
  };

  const handleButtonClick = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200">
        {/* 精緻 Icon 圈圈 */}
        <div
          className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center text-xl font-bold mb-4 ${config.bgColor}`}
        >
          {config.icon}
        </div>

        {/* 標題與內文 */}
        <h3 className="text-lg font-black text-[#1d1d1f] tracking-tight uppercase mb-2">
          {title}
        </h3>
        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
          {message}
        </p>

        {/* Apple 圓角按鈕 */}
        <button
          type="button"
          onClick={handleButtonClick}
          className={`w-full py-3.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-200 active:scale-98 shadow-sm cursor-pointer ${config.btnColor}`}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
