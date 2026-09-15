import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getImageUrl = (url) => {
  if (!url) return "";
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

function CheckoutPage({ cart, setCart, isPending, onCheckout, user }) {
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [stockWarnings, setStockWarnings] = useState([]);
  const [isValidatingStock, setIsValidatingStock] = useState(true);

  const [formData, setFormData] = useState({
    name: localStorage.getItem("ck_username") || "",
    email: localStorage.getItem("ck_email") || "",
    address: "",
    notes: "",
    paymentMethod: "credit_card",
  });

  // 1. 同步使用者基本資料
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

  // 2. 進入頁面時進行庫存二次微校驗
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
              // 💡 關鍵修復：轉成 String() 避免型態不同 (字串 vs 數字) 比對失敗
              const fresh = latestProducts.find(
                (p) => String(p.id) === String(item.id),
              );

              if (fresh) {
                const freshStock = Number(fresh.stockQuantity);

                // 情況 A：已經完全沒庫存（<= 0）
                if (isNaN(freshStock) || freshStock <= 0) {
                  warnings.push(
                    `"${item.name}" sold out and has been removed from your cart.`,
                  );
                  continue;
                }

                // 情況 B：購物車數量大於最新庫存
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
                  // 情況 C：庫存正常，同步最新 stockQuantity
                  updatedCart.push({
                    ...item,
                    stockQuantity: freshStock,
                  });
                }
              } else {
                // 找不到商品資料時保留原樣
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
  const handlePay = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert("Please fill in Recipient Name and Shipping Address!");
      return;
    }
    onCheckout(formData);
  };

  const showTerms = (e) => {
    e.preventDefault();
    alert(
      "1. Goods sold are non-refundable.\n2. Delivery within 3-5 business days.\n3. CK STORE holds full rights to order updates.",
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (cart.length === 0) return <Navigate to="/" replace />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      {/* 庫存變動警告 Banner */}
      {stockWarnings.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
          <p className="font-black text-amber-800 text-xs uppercase tracking-wider">
            ⚠️ Stock Updated Notice
          </p>
          {stockWarnings.map((warn, index) => (
            <p key={index} className="text-xs text-amber-700 font-bold">
              • {warn}
            </p>
          ))}
        </div>
      )}

      {isValidatingStock ? (
        <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-gray-400">
          Verifying Stock Availability...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 左側：客戶填寫區 */}
          <div className="space-y-4">
            <header>
              <Link
                to="/"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black"
              >
                ← Back to Shop
              </Link>
              <h1 className="text-3xl font-black italic tracking-tighter mt-1 uppercase">
                Checkout.
              </h1>
            </header>

            {/* 01. Shipping Information */}
            <section className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">
                01. Shipping Information
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="RECIPIENT NAME"
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <textarea
                placeholder="FULL SHIPPING ADDRESS (STREET, CITY, POSTCODE)"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs h-16 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-black"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="DELIVERY NOTES (OPTIONAL) E.g., 'Leave at lobby'"
                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </section>

            {/* 02. Payment Method */}
            <section className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">
                02. Payment Method
              </h2>
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
                    className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      formData.paymentMethod === method.id
                        ? "border-black bg-black text-white shadow-md"
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    {method.icon.startsWith("http") ? (
                      <img
                        src={method.icon}
                        alt={method.label}
                        className={`h-5 w-auto object-contain ${formData.paymentMethod === method.id ? "" : "grayscale"}`}
                      />
                    ) : (
                      <span className="text-base">{method.icon}</span>
                    )}
                    <span className="font-black text-[10px] uppercase tracking-widest">
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>

              {formData.paymentMethod === "credit_card" && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2">
                  <input
                    type="text"
                    placeholder="CARD NUMBER"
                    maxLength="19"
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs font-bold"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="EXP (MM/YY)"
                      maxLength="5"
                      className="p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs font-bold"
                    />
                    <input
                      type="password"
                      placeholder="CVC"
                      maxLength="4"
                      className="p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {formData.paymentMethod === "tng" && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 shadow-sm shrink-0 flex items-center justify-center">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CKSTORE_PAY"
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs">
                    <p className="text-black font-black">
                      Scan to Pay via TnG App
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold">
                      Auto-verifies upon payment.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 條款與結帳按鈕 */}
            <div className="space-y-2.5">
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${!agreed ? "bg-amber-50" : ""}`}
              >
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-3.5 h-3.5 accent-black rounded cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className="text-gray-500 font-bold text-[11px] cursor-pointer"
                >
                  I agree to the{" "}
                  <span
                    onClick={showTerms}
                    className="text-black underline cursor-pointer"
                  >
                    Terms and Conditions
                  </span>
                </label>
              </div>

              <button
                onClick={handlePay}
                disabled={isPending || !agreed}
                className={`w-full py-3 rounded-full font-black text-sm tracking-wider uppercase transition-all ${
                  isPending || !agreed
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900 shadow-md active:scale-95"
                }`}
              >
                {isPending
                  ? "PROCESSING..."
                  : !agreed
                    ? "PLEASE AGREE TO TERMS"
                    : `CONFIRM & PAY RM${totalPrice.toFixed(2)}`}
              </button>
            </div>
          </div>

          {/* 右側：Order Summary 摘要卡片 */}
          <div className="lg:sticky lg:top-12 h-fit bg-gray-50 rounded-[40px] p-8 lg:p-10 space-y-6 border border-gray-100">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
              Order Summary.
            </h2>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100/50"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <img
                      src={getImageUrl(item.imageUrl)}
                      className="w-full h-full object-cover"
                      alt={item.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-xs uppercase tracking-tight truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-gray-400 text-[10px] font-extrabold">
                        QTY: {item.quantity}
                      </p>
                      {/* 即時庫存不足警示標籤 */}
                      {item.stockQuantity !== undefined &&
                        item.stockQuantity <= 3 && (
                          <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">
                            Only {item.stockQuantity} left!
                          </span>
                        )}
                    </div>
                  </div>
                  <span className="font-black italic text-sm">
                    RM{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between text-gray-400 font-extrabold text-[11px] uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="text-black">RM{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-extrabold text-[11px] uppercase tracking-wider">
                <span>Shipping Fee</span>
                <span className="text-emerald-600 font-black">FREE</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-end">
                <span className="text-xs font-black uppercase italic tracking-wider">
                  Total Amount
                </span>
                <span className="text-4xl font-black italic tracking-tighter text-black">
                  RM{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
