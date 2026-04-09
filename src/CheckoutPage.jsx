import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";

function CheckoutPage({ cart, isPending, onCheckout }) {
  const navigate = useNavigate();

  // 💡 自動從本地存儲抓取用戶資料，讓用戶少填一點
  const [formData, setFormData] = useState({
    name: localStorage.getItem("ck_username") || "",
    email: localStorage.getItem("ck_email") || "",
    address: "",
    paymentMethod: "credit_card",
  });

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // 🛡️ 安全機制：如果購物車是空的，直接踢回首頁
  if (cart.length === 0) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
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
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="RECIPIENT NAME"
              className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold transition-all"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <textarea
              placeholder="FULL SHIPPING ADDRESS (STREET, CITY, POSTCODE)"
              className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold h-32 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
        </section>

        {/* 2. 支付方式 */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-600">
            02. Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "credit_card", label: "Credit Card", icon: "💳" },
              { id: "tng", label: "TnG eWallet", icon: "📱" },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() =>
                  setFormData({ ...formData, paymentMethod: method.id })
                }
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                  formData.paymentMethod === method.id
                    ? "border-black bg-black text-white shadow-xl scale-105"
                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="font-black text-[10px] uppercase tracking-widest">
                  {method.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={() => onCheckout(formData)}
          disabled={isPending || !formData.address || !formData.name}
          className={`w-full py-7 rounded-full font-black text-xl shadow-2xl transition-all active:scale-95 ${
            isPending || !formData.address || !formData.name
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800 shadow-black/20"
          }`}
        >
          {isPending
            ? "PROCESSING..."
            : `CONFIRM & PAY $${totalPrice.toFixed(2)}`}
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
                ${(item.price * item.quantity).toFixed(2)}
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
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
