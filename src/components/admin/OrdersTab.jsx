import React from "react";
import { ShoppingCart } from "lucide-react";

export default function OrdersTab({
  orders,
  handleUpdateStatus,
  setSelectedOrder,
  handleDeleteOrder,
  getStatusStyles,
}) {
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
                <div className="truncate">
                  <p className="text-xs font-black uppercase tracking-tight truncate">
                    {order.customerName}
                  </p>
                  <p className="text-[10px] text-gray-300 font-bold truncate">
                    {order.customerEmail}
                  </p>
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
                  className={`appearance-none border-none px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all outline-none shadow-sm text-center ${getStatusStyles(order.status)}`}
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
    </div>
  );
}
