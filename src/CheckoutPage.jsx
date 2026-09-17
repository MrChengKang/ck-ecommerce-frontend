import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import PopoutAlert from "./components/PopoutAlert";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getImageUrl = (url) => {
  if (!url) return "https://via.placeholder.com/150?text=No+Image";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (
      url.includes("localhost:8080") &&
      API_BASE_URL !== "http://localhost:8080"
    ) {
      return url.replace("http://localhost:8080", API_BASE_URL);
    }
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
};

function CheckoutPage({
  cart,
  setCart,
  isPending,
  setIsPending,
  onCheckout,
  user,
}) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [isValidatingStock, setIsValidatingStock] = useState(true);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const [formData, setFormData] = useState({
    name: localStorage.getItem("ck_username") || "",
    email: localStorage.getItem("ck_email") || "",
    address: "",
    notes: "",
    paymentMethod: "credit_card",
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  // 同步使用者資料
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        address: user.address || prev.address,
        name: user.username || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // 庫存二次微校驗
  useEffect(() => {
    const checkLatestStock = async () => {
      try {
        setIsValidatingStock(true);

        const res = await fetch(`${API_BASE_URL}/api/products`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const latestProducts = await res.json();

        let warnings = [];

        if (setCart) {
          setCart((prevCart) => {
            const updatedCart = [];

            for (const item of prevCart) {
              const fresh = latestProducts.find(
                (p) => String(p.id) === String(item.id),
              );

              if (fresh) {
                const freshStock = Number(fresh.stockQuantity);

                if (isNaN(freshStock) || freshStock <= 0) {
                  warnings.push(
                    `"${item.name}" sold out and has been removed from your cart.`,
                  );
                  continue;
                }

                if (item.quantity > freshStock) {
                  warnings.push(
                    `"${item.name}" has limited stock. The quantity has been adjusted to the available amount.`,
                  );
                  updatedCart.push({
                    ...item,
                    quantity: freshStock,
                    stockQuantity: freshStock,
                  });
                } else {
                  updatedCart.push({
                    ...item,
                    stockQuantity: freshStock,
                  });
                }
              } else {
                updatedCart.push(item);
              }
            }

            return [...updatedCart];
          });
        }

        setStockWarnings(warnings);
      } catch (err) {
        console.error("Stock verification error:", err);
      } finally {
        setIsValidatingStock(false);
      }
    };

    if (cart.length > 0) {
      checkLatestStock();
    } else {
      setIsValidatingStock(false);
    }
  }, []);

  const handlePay = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
      showAlert(
        "Missing Information",
        "Please fill in Recipient Name and Shipping Address!",
        "warning",
      );
      return;
    }

    if (!agreed) {
      showAlert(
        "Terms & Conditions",
        "Please agree to the Terms and Conditions to proceed.",
        "warning",
      );
      return;
    }

    try {
      if (setIsPending) setIsPending(true);
      const isSuccess = await onCheckout(formData);

      if (isSuccess !== false) {
        navigate("/success", { replace: true });
      }
    } catch (err) {
      console.error("Pay trigger error:", err);
    } finally {
      if (setIsPending) setIsPending(false);
    }
  };

  const showTerms = (e) => {
    e.preventDefault();
    showAlert(
      "Terms & Conditions",
      "1. Goods sold are non-refundable.\n2. Delivery within 3-5 business days.\n3. CK STORE holds full rights to order updates.",
      "info",
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (
      cart.length === 0 &&
      !isPending &&
      window.location.pathname === "/checkout"
    ) {
      navigate("/", { replace: true });
    }
  }, [cart, isPending, navigate]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-28 lg:pb-12 pt-6">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* 返回按鈕與標題 */}
        <header className="mb-6">
          <Link
            to="/"
            className="text-xs font-bold text-gray-400 hover:text-black transition-colors mb-1 inline-block cursor-pointer uppercase tracking-widest"
          >
            ← Back to Shop
          </Link>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1d1d1f] tracking-tight uppercase italic">
            CHECKOUT.
          </h1>
        </header>

        {/* 庫存提示 */}
        {stockWarnings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1 backdrop-blur-sm">
            <p className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️</span> Stock Updated Notice
            </p>
            {stockWarnings.map((warn, index) => (
              <p key={index} className="text-xs text-amber-700 font-medium">
                • {warn}
              </p>
            ))}
          </div>
        )}

        {isValidatingStock ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Verifying Stock Availability...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 左側：配送與付款資訊 */}
            <div className="lg:col-span-7 space-y-5">
              {/* 01. Shipping Information */}
              <section className="bg-white rounded-3xl p-5 lg:p-6 border border-gray-200/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#0071e3]">
                    01. Shipping Information
                  </h2>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Required *
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none text-xs font-medium text-[#1d1d1f]"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email"
                      className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none text-xs font-medium text-[#1d1d1f]"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                    Full Shipping Address
                  </label>
                  <textarea
                    placeholder="Street, City, Postcode, State"
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none text-xs font-medium text-[#1d1d1f] h-16 resize-none"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                    Delivery Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., 'Leave package at front door'"
                    className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-xl border border-transparent focus:border-[#0071e3] focus:bg-white transition-all outline-none text-xs font-medium text-[#1d1d1f]"
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </section>

              {/* 02. Payment Method */}
              <section className="bg-white rounded-3xl p-5 lg:p-6 border border-gray-200/60 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#0071e3]">
                    02. Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "credit_card", label: "Credit Card", icon: "💳" },
                    {
                      id: "tng",
                      label: "TnG eWallet",
                      icon: "https://play-lh.googleusercontent.com/1VCK1Y4OepXSWXxikNP_gHI7NCPrx8uT8Z4e3nffpaLStea3AEc6Rv5K_IN0L6e973RIq1EJN29W1Q2K2NZkVA",
                    },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, paymentMethod: method.id })
                      }
                      className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        formData.paymentMethod === method.id
                          ? "border-[#0071e3] bg-blue-50/40 text-[#0071e3] shadow-sm font-bold"
                          : "border-gray-200/70 text-gray-500 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {method.icon.startsWith("http") ? (
                        <img
                          src={method.icon}
                          alt={method.label}
                          className={`h-4 w-auto object-contain ${
                            formData.paymentMethod === method.id
                              ? ""
                              : "grayscale opacity-70"
                          }`}
                        />
                      ) : (
                        <span className="text-sm">{method.icon}</span>
                      )}
                      <span className="text-xs uppercase tracking-wider font-bold">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>

                {formData.paymentMethod === "credit_card" && (
                  <div className="p-3.5 bg-[#f5f5f7] rounded-2xl border border-gray-200/50 space-y-2.5">
                    <input
                      type="text"
                      placeholder="CARD NUMBER"
                      maxLength="19"
                      className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-xl font-mono text-xs font-bold focus:border-[#0071e3] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="EXP (MM/YY)"
                        maxLength="5"
                        className="px-3 py-2 bg-white border border-gray-200/80 rounded-xl font-mono text-xs font-bold focus:border-[#0071e3] outline-none"
                      />
                      <input
                        type="password"
                        placeholder="CVC"
                        maxLength="4"
                        className="px-3 py-2 bg-white border border-gray-200/80 rounded-xl font-mono text-xs font-bold focus:border-[#0071e3] outline-none"
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === "tng" && (
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/80 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-sm shrink-0 flex items-center justify-center border border-blue-100">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CKSTORE_PAY"
                        alt="QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="text-[#1d1d1f] font-bold">
                        Scan to Pay via TnG App
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Auto-verifies upon payment completion.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* 右側：Order Summary 卡片 (桌機版固定在右上視窗，無需捲動) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <div className="bg-white rounded-3xl p-5 lg:p-6 border border-gray-200/60 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">
                    Order Summary
                  </h2>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
                  </span>
                </div>

                {/* 商品縮圖列表 */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 items-center p-1.5 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl overflow-hidden shrink-0 border border-gray-200/60 flex items-center justify-center p-1">
                        <img
                          src={getImageUrl(item.imageUrl)}
                          className="w-full h-full object-contain"
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs text-[#1d1d1f] truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-400 text-[10px] font-medium">
                            QTY: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-[#1d1d1f]">
                        RM{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 費率小計 */}
                <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#1d1d1f]">
                      RM{totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Shipping Fee</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Total Amount
                    </span>
                    <span className="text-xl font-black italic tracking-tight text-[#1d1d1f]">
                      RM{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 💡 核心亮點：結帳按鈕與條款直接放在右側 Sticky 區域，桌機畫面上永遠可直接點擊！ */}
                <div className="pt-2 space-y-3 hidden lg:block">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
                      !agreed
                        ? "bg-amber-50/80 border border-amber-200/60"
                        : "bg-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="terms-desktop"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 accent-[#0071e3] rounded cursor-pointer"
                    />
                    <label
                      htmlFor="terms-desktop"
                      className="text-gray-500 font-medium text-[11px] cursor-pointer select-none"
                    >
                      I agree to{" "}
                      <span
                        onClick={showTerms}
                        className="text-[#0071e3] font-bold underline cursor-pointer"
                      >
                        Terms & Conditions
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isPending}
                    className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md active:scale-98 cursor-pointer ${
                      isPending
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        : !agreed
                          ? "bg-gray-800 text-white hover:bg-black"
                          : "bg-[#0071e3] hover:bg-[#0077ed] text-white"
                    }`}
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        PROCESSING...
                      </span>
                    ) : (
                      `CONFIRM & PAY RM${totalPrice.toFixed(2)}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 💡 手機板專屬：螢幕底部固定懸浮列 (Sticky Bottom Bar)，手機版使用者也完全不需往下捲 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 p-4 z-40 shadow-2xl">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms-mobile"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-[#0071e3] rounded cursor-pointer"
              />
              <label
                htmlFor="terms-mobile"
                className="text-[11px] font-medium text-gray-500"
              >
                Agree to{" "}
                <span
                  onClick={showTerms}
                  className="text-[#0071e3] underline font-bold"
                >
                  Terms
                </span>
              </label>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase block font-bold">
                Total
              </span>
              <span className="text-base font-black italic text-[#1d1d1f]">
                RM{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isPending || !agreed}
            className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-98 cursor-pointer ${
              isPending || !agreed
                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-[#0071e3] text-white"
            }`}
          >
            {isPending
              ? "PROCESSING..."
              : !agreed
                ? "AGREE TERMS TO PAY"
                : "CONFIRM & PAY"}
          </button>
        </div>
      </div>

      {/* 自訂 PopoutAlert */}
      <PopoutAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}

export default CheckoutPage;
