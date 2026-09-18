import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function CartSidebar({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  isLoggedIn,
  onCheckout,
  isPending,
}) {
  const navigate = useNavigate();

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const getImageUrl = (picPath) => {
    if (!picPath) return "https://via.placeholder.com/150?text=No+Image";
    if (picPath.startsWith("http://") || picPath.startsWith("https://"))
      return picPath;
    return `${API_BASE_URL}${picPath}`;
  };

  const handleStartShopping = () => {
    if (onClose) onClose();
    navigate("/");
  };

  const processCheckout = () => {
    onClose();
    if (isLoggedIn) {
      navigate("/checkout");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      {/* 蘋果風格背景毛玻璃遮罩 */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-md z-[60] transition-opacity duration-300 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={onClose}
      />

      {/* 側邊欄抽屜 */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[460px] bg-[#f5f5f7] z-[70] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header 區塊 */}
        <div className="flex justify-between items-center px-6 py-5 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">
              Shopping Cart
            </h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 購物車列表內容 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center my-12">
              <span className="text-6xl mb-2 opacity-40">🛒</span>
              <h3 className="text-base font-bold text-[#1d1d1f]">
                Your cart is empty
              </h3>
              <p className="text-xs text-gray-400 max-w-xs font-medium">
                Explore our catalog and add your favorite tech gear to the bag.
              </p>
              <button
                onClick={handleStartShopping}
                className="mt-2 px-6 py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-all cursor-pointer uppercase tracking-wider"
              >
                START SHOPPING →
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-3xl border border-gray-200/60 shadow-sm flex items-center gap-4 transition-all"
              >
                {/* 商品圖片 */}
                <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-2">
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 商品名稱、價格與操作 */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-[#1d1d1f] truncate leading-tight">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer p-1"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs font-extrabold text-[#0071e3] mt-1 italic">
                    RM{item.price}
                  </p>

                  {/* 數量控制 */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Quantity
                    </span>
                    <div className="flex items-center gap-3 bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-gray-200/50">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="text-xs font-bold text-gray-500 hover:text-black disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer disabled:cursor-not-allowed w-4 text-center"
                      >
                        −
                      </button>
                      <span className="text-xs font-bold text-[#1d1d1f] w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= (item.stockQuantity ?? 10)}
                        className="text-xs font-bold text-gray-500 hover:text-black disabled:opacity-30 disabled:hover:text-gray-500 cursor-pointer disabled:cursor-not-allowed w-4 text-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部 Summary 與 Checkout 區域 */}
        {cart.length > 0 && (
          <div className="p-6 bg-white/80 backdrop-blur-md border-t border-gray-200/60 space-y-4 sticky bottom-0">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Amount
              </span>
              <span className="text-2xl font-black text-[#1d1d1f] italic tracking-tight">
                RM{totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={processCheckout}
              disabled={isPending}
              className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-98 cursor-pointer ${
                isPending
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-[#0071e3] hover:bg-[#0077ed] text-white"
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  PROCESSING...
                </span>
              ) : isLoggedIn ? (
                "PROCEED TO CHECKOUT →"
              ) : (
                "LOGIN TO CHECKOUT"
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartSidebar;
