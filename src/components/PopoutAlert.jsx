import React from "react";

function PopoutAlert({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
}) {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "✓",
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      case "error":
        return {
          icon: "✕",
          iconBg: "bg-rose-50 text-rose-600 border-rose-200",
          btnBg: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "warning":
        return {
          icon: "!",
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      default:
        return {
          icon: "i",
          iconBg: "bg-blue-50 text-[#0071e3] border-blue-200",
          btnBg: "bg-[#0071e3] hover:bg-[#0077ed] text-white",
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* 毛玻璃背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 彈窗卡片本體 */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white/50 text-center transform transition-all animate-in zoom-in-95 duration-200">
        {/* 頂部 Icon */}
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-lg mx-auto mb-4 ${config.iconBg}`}
        >
          {config.icon}
        </div>

        {/* 標題與內文 */}
        {title && (
          <h3 className="text-base font-bold text-[#1d1d1f] tracking-tight mb-2">
            {title}
          </h3>
        )}
        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
          {message}
        </p>

        {/* 按鈕區域 */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleConfirm}
            className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 cursor-pointer ${config.btnBg}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default PopoutAlert;
