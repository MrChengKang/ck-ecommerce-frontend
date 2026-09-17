import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const OrderHistoryPage = ({ API_BASE_URL }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("ck_token");
    fetch(`${API_BASE_URL}/api/orders/my-orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch orders");
        return res.json();
      })
      .then((data) => {
        // 將最新訂單排在最前面
        const sortedOrders = data.sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate),
        );
        setOrders(sortedOrders);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [API_BASE_URL]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 根據狀態渲染 Apple 風格精緻 Badge
  const getStatusBadge = (status) => {
    const s = status ? status.toUpperCase() : "PENDING";
    switch (s) {
      case "COMPLETED":
      case "DELIVERED":
      case "PAID":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "SHIPPED":
        return "bg-sky-50 text-sky-600 border-sky-200";
      default:
        return "bg-amber-50 text-amber-600 border-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black tracking-widest text-gray-400 uppercase">
          Loading Order History...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 頂部 Header 區塊 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-xs font-bold text-gray-400 hover:text-black transition-colors mb-2 block cursor-pointer uppercase tracking-widest"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-black italic tracking-tight uppercase text-[#1d1d1f]">
              ORDER HISTORY.
            </h2>
          </div>
          <span className="px-4 py-1.5 bg-white rounded-full text-xs font-bold text-gray-500 border border-gray-200/80 shadow-sm">
            {orders.length} {orders.length === 1 ? "RECORD" : "RECORDS"}
          </span>
        </div>

        {/* 訂單內容區塊 */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200/60 shadow-sm space-y-4 my-8">
            <span className="text-5xl block mb-2">🛍️</span>
            <h3 className="text-xl font-black text-[#1d1d1f] tracking-tight uppercase">
              NO ORDERS FOUND
            </h3>
            <p className="text-xs font-medium text-gray-400 max-w-sm mx-auto">
              Currently, there are no order records under this account.
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-block px-8 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-full transition-all shadow-sm cursor-pointer uppercase tracking-wider"
              >
                START SHOPPING
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-6"
              >
                {/* 頂部資訊：ID、日期、Status Badge */}
                <div className="flex flex-wrap justify-between items-center pb-6 border-b border-gray-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-[#1d1d1f]">
                        Order #{order.id}
                      </span>
                      {order.orderNumber && (
                        <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-md">
                          {order.orderNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      Placed on {formatDate(order.orderDate)}
                    </p>
                  </div>

                  <span
                    className={`px-3.5 py-1 text-[10px] font-black tracking-widest rounded-full border uppercase ${getStatusBadge(
                      order.status,
                    )}`}
                  >
                    {order.status || "Pending"}
                  </span>
                </div>

                {/* 商品列表 */}
                <div className="space-y-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex justify-between items-center text-xs font-medium text-gray-700 py-1.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                          <span className="font-bold text-[#1d1d1f]">
                            {item.productName ||
                              item.product?.name ||
                              "Product"}
                          </span>
                          <span className="text-gray-400 font-medium text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">
                            x {item.quantity || 1}
                          </span>
                        </div>
                        <span className="font-bold text-[#1d1d1f]">
                          RM
                          {((item.price || 0) * (item.quantity || 1)).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic font-medium">
                      No item details available.
                    </p>
                  )}
                </div>

                {/* 底部總價 */}
                <div className="flex justify-between items-center border-t border-gray-100 pt-5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Total Amount
                  </span>
                  <span className="text-2xl font-black italic tracking-tight text-[#1d1d1f]">
                    RM{Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
