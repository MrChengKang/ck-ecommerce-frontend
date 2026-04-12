import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";

function CheckoutPage({ cart, isPending, onCheckout, user }) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    name: localStorage.getItem("ck_username") || "",
    email: localStorage.getItem("ck_email") || "",
    address: "",
    paymentMethod: "credit_card",
  });

  useEffect(() => {
    if (user && user.address) {
      setFormData((prev) => ({
        ...prev,
        address: user.address,
        name: user.username || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const showTerms = (e) => {
    e.preventDefault();
    alert(
      "1. Goods sold are not refundable.\n2. Delivery takes 3-5 working days.\n3. CK STORE reserves all rights.",
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (cart.length === 0) return <Navigate to="/" replace />;

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* 左側：客戶填寫區 */}
      <div className="space-y-12">
        <header>
          <Link
            to="/"
            className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors"
          >
            ← Back to Shop
          </Link>
          <h1 className="text-5xl font-black italic tracking-tighter mt-4 uppercase">
            Checkout.
          </h1>
        </header>

        {/* 1. 客戶資訊 */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-600">
            01. Shipping Information
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="RECIPIENT NAME"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <textarea
            placeholder="FULL SHIPPING ADDRESS (STREET, CITY, POSTCODE)"
            className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-black font-bold h-32 transition-all outline-none"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
          <textarea
            placeholder="DELIVERY NOTES (OPTIONAL) E.g., 'Leave at lobby', 'Rings bell'"
            value={formData.notes || ""}
            className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-black font-bold h-20 transition-all outline-none"
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </section>

        {/* 2. 支付方式 */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-600">
            02. Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "credit_card", label: "Credit Card", icon: "💳" },
              {
                id: "tng",
                label: "TnG eWallet",
                // 💡 確保這是一個可以直接開啟的圖片網址
                icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Touch_%27n_Go_eWallet_logo.svg/1200px-Touch_%27n_Go_eWallet_logo.svg.png",
              },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() =>
                  setFormData({ ...formData, paymentMethod: method.id })
                }
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                  formData.paymentMethod === method.id
                    ? "border-black bg-black text-white shadow-xl scale-105"
                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                {/* 💡 判斷 icon 是網址還是文字 */}
                {method.icon.startsWith("http") ? (
                  <img
                    src={method.icon}
                    alt={method.label}
                    className={`h-8 w-auto object-contain ${formData.paymentMethod === method.id ? "" : "grayscale"}`}
                  />
                ) : (
                  <span className="text-2xl">{method.icon}</span>
                )}

                <span className="font-black text-[10px] uppercase tracking-widest">
                  {method.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div
          className={`flex items-center gap-2 py-0 px-2 rounded-xl transition-all ${
            !agreed ? "bg-amber-50" : "bg-transparent" // 💡 沒勾時顯示淡黃色背景，提醒用戶這裡要看
          }`}
        >
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 accent-black rounded cursor-pointer"
          />
          <label htmlFor="terms" className="text-gray-400 font-bold text-xs">
            I have read and agree to the{" "}
            <span
              onClick={showTerms}
              className="text-black underline cursor-help ml-1"
            >
              Terms and Conditions
            </span>
            .
          </label>
        </div>

        <button
          onClick={() => onCheckout(formData)}
          disabled={isPending || !formData.address || !formData.name || !agreed}
          className={`w-full py-4 rounded-full font-black text-lg transition-all active:scale-95 ${
            isPending || !formData.address || !formData.name || !agreed
              ? "bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed shadow-none"
              : "bg-black text-white hover:bg-gray-800 shadow-xl shadow-black/20"
          }`}
        >
          {isPending
            ? "PROCESSING..."
            : !agreed
              ? "PLEASE AGREE TO TERMS"
              : `CONFIRM & PAY RM${totalPrice.toFixed(2)}`}
        </button>
      </div>

      {/* 右側：訂單清單摘要 */}
      <div className="lg:sticky lg:top-32 h-fit bg-gray-50 rounded-[50px] p-12 space-y-8">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">
          Order Summary.
        </h2>
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-6 items-center">
              <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden shadow-sm">
                <img
                  src={item.imageUrl}
                  className="w-full h-full object-cover"
                  alt={item.name}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[10px] uppercase tracking-tight">
                  {item.name}
                </h3>
                <p className="text-gray-400 text-[10px] font-bold">
                  QTY: {item.quantity}
                </p>
              </div>
              <span className="font-black italic">
                RM{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-8 space-y-4">
          <div className="flex justify-between text-gray-400 font-bold text-[10px] uppercase tracking-widest">
            <span>Shipping</span>
            <span>FREE</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm font-black uppercase italic">Total</span>
            <span className="text-5xl font-black italic tracking-tighter">
              RM{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
