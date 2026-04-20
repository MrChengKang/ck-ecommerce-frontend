import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart } from "lucide-react";

export default function OrdersTab({
  orders,
  setOrders,
  handleUpdateStatus,
  setSelectedOrder,
  handleDeleteOrder,
  getStatusStyles,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page = 0) => {
    try {
      // 加上 size=5 確保每頁 5 筆
      const response = await axios.get(`/api/orders?page=${page}&size=5`);

      if (response.data) {
        const content = response.data.content || response.data || [];
        if (typeof setOrders === "function") {
          setOrders(content);
        }

        const total = response.data.totalPages;

        if (total !== undefined) {
          setTotalPages(total);
        } else {
          console.warn("後端沒回傳 totalPages，請檢查後端 Controller");

          if (content.length === 5) setTotalPages(currentPage + 2);
        }
      }
    } catch (error) {
      console.error("抓取失敗:", error);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    console.log("Copied:", text);
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      PENDING: "bg-amber-50 text-amber-600 border-amber-200",
      PAID: "bg-blue-50 text-blue-600 border-blue-200",
      SHIPPED: "bg-indigo-50 text-indigo-600 border-indigo-200",
      DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-200",
      CANCELLED: "bg-rose-50 text-rose-600 border-rose-200",
    };
    return `border px-3 py-1 rounded-full text-[9px] font-bold uppercase ${styles[status] || "bg-gray-100"}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-black">
            Orders Tracking
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Monitor your sales performance
          </p>
        </div>
      </div>

      {/* 💡 標題列 */}
      <div className="grid grid-cols-6 px-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        <div className="col-span-1">ID / Date</div>
        <div className="col-span-2">Customer</div>
        <div className="col-span-1 text-center">Amount</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-right pr-4">Action</div>
      </div>

      {/* 💡 內容列 */}
      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-6 items-center px-10 py-6 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-[35px] transition-all hover:shadow-xl hover:shadow-gray-100/50 group"
            >
              {/* 01. ID & Date */}
              <div className="col-span-1">
                <p className="font-black text-sm tracking-tighter">
                  #ID-{order.id.toString().slice(-4)}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                  {order.orderDate?.split("T")[0] || "2026-04-13"}
                </p>
              </div>

              {/* 02. Customer */}
              <div className="col-span-2 flex items-center gap-3">
                <div className="truncate w-full group">
                  {" "}
                  {/* 💡 加上 group 可以在 hover 時顯示按鈕 */}
                  <p className="text-xs font-black uppercase tracking-tight truncate">
                    {order.customerName}
                  </p>
                  <p className="text-[10px] text-gray-300 font-bold truncate">
                    {order.customerEmail}
                  </p>
                  {/* 收件地址區塊 */}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1 truncate max-w-[150px]">
                      <span className="text-[9px] text-blue-400">📍</span>
                      <p className="text-[10px] text-gray-400 font-medium truncate italic">
                        {order.shippingAddress || "No address"}
                      </p>
                    </div>

                    {/* 💡 2. 修正後的複製按鈕與 SVG */}
                    {order.shippingAddress && (
                      <button
                        onClick={() => handleCopy(order.shippingAddress)}
                        className="p-1 hover:bg-gray-200 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Copy Address"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3 w-3 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          {/* 修正後的路徑格式 */}
                          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                          <rect
                            x="9"
                            y="9"
                            width="11"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 03. Amount */}
              <div className="col-span-1 text-center font-black italic text-blue-600 tracking-tighter">
                RM{order.totalAmount?.toFixed(2)}
              </div>

              {/* 04. Status Select */}
              <div className="col-span-1 flex justify-center">
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  className={`appearance-none text-center cursor-pointer transition-all outline-none ${getStatusBadgeStyle(order.status)}`}
                  style={{
                    textAlignLast: "center",
                    minWidth: "110px",
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* 05. Action */}
              <div className="col-span-1 flex justify-end items-center gap-4">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="px-6 py-2 bg-white text-black border border-gray-100 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-20 flex flex-col items-center">
            <ShoppingCart size={48} className="mb-4" />
            <p className="font-black italic uppercase tracking-widest">
              No orders found.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-12 mb-8">
        <button
          disabled={currentPage === 0}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed shadow-sm hover:shadow-lg"
        >
          ← Prev
        </button>

        <div className="flex items-center px-6 py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="font-black italic text-[10px] tracking-widest text-black">
            {currentPage + 1} <span className="text-gray-300 mx-1">/</span>{" "}
            {totalPages}
          </span>
        </div>

        <button
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed shadow-sm hover:shadow-lg"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
