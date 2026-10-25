import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

const parseOrderDate = (dateString) => {
  if (!dateString) return null;
  // LocalDateTime from the backend has no offset; new records are stored as UTC.
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateString);
  const date = new Date(hasTimezone ? dateString : `${dateString}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const OrderHistoryPage = ({ API_BASE_URL }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingOrderId, setRetryingOrderId] = useState(null);
  const [checkingPaymentOrderId, setCheckingPaymentOrderId] = useState(null);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState("");
  const [paymentCheckMessageOrderId, setPaymentCheckMessageOrderId] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [paymentErrorOrderId, setPaymentErrorOrderId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem("ck_token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      const sortedOrders = data.sort(
        (a, b) =>
          (parseOrderDate(b.orderDate)?.getTime() ?? 0) -
          (parseOrderDate(a.orderDate)?.getTime() ?? 0),
      );
      setOrders(sortedOrders);
      setLoadError("");
    } catch (error) {
      console.error("Refresh order history failed:", error);
      setLoadError("Could not refresh payment status. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const hasUnpaidPendingOrder = orders.some(
    (order) =>
      order.status?.toUpperCase() === "PENDING" &&
      order.paymentStatus?.toUpperCase() !== "PAID",
  );

  useEffect(() => {
    if (!hasUnpaidPendingOrder) return undefined;

    const poll = window.setInterval(loadOrders, 5000);
    const stopPolling = window.setTimeout(() => window.clearInterval(poll), 120000);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(stopPolling);
    };
  }, [hasUnpaidPendingOrder, loadOrders]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadOrders();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadOrders]);

  const retryPayment = async (order) => {
    setRetryingOrderId(order.id);
    setPaymentError("");
    setPaymentErrorOrderId(order.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ck_token")}` },
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Could not reopen the payment link.");
      }
      const payment = await response.json();
      if (!payment.paymentUrl) throw new Error("Billplz did not return a payment link.");
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      setPaymentError(error.message || "Could not start payment. Please try again.");
      setRetryingOrderId(null);
    }
  };

  const reconcilePayment = async (order) => {
    setCheckingPaymentOrderId(order.id);
    setPaymentError("");
    setPaymentErrorOrderId(order.id);
    setPaymentCheckMessage("");
    setPaymentCheckMessageOrderId(order.id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${order.id}/payment/reconcile`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("ck_token")}` },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not verify payment with Billplz.");
      }
      await loadOrders();
      if (result.paymentStatus?.toUpperCase() === "PAID") {
        setPaymentCheckMessage("");
      } else {
        setPaymentCheckMessage(result.message || "Billplz still shows this payment as unpaid.");
      }
    } catch (error) {
      setPaymentError(error.message || "Could not verify payment. Please try again.");
    } finally {
      setCheckingPaymentOrderId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = parseOrderDate(dateString);
    if (!date) return "N/A";
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
      case "PROCESSING":
        return "bg-violet-50 text-violet-600 border-violet-200";
      default:
        return "bg-amber-50 text-amber-600 border-amber-200";
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    switch ((paymentStatus || "").toUpperCase()) {
      case "PAID":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "UNPAID":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "FAILED":
      case "REFUNDED":
        return "bg-rose-50 text-rose-600 border-rose-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
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
            {loadError && (
              <p role="alert" className="mt-2 text-xs font-bold text-rose-600">
                {loadError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasUnpaidPendingOrder && (
              <span className="hidden sm:inline text-[10px] font-bold text-gray-400">
                Checking payment updates…
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadOrders();
              }}
              disabled={refreshing}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <span className="px-4 py-1.5 bg-white rounded-full text-xs font-bold text-gray-500 border border-gray-200/80 shadow-sm">
              {orders.length} {orders.length === 1 ? "RECORD" : "RECORDS"}
            </span>
          </div>
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

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3.5 py-1 text-[10px] font-black tracking-widest rounded-full border uppercase ${getStatusBadge(
                        order.status,
                      )}`}
                    >
                      {order.status || "Pending"}
                    </span>
                    <span
                      className={`px-3.5 py-1 text-[10px] font-black tracking-widest rounded-full border uppercase ${getPaymentStatusBadge(
                        order.paymentStatus,
                      )}`}
                    >
                      Payment: {order.paymentStatus || "N/A"}
                    </span>
                  </div>
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
                {paymentError && retryingOrderId === null && paymentErrorOrderId === order.id && (
                  <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
                    {paymentError}
                  </p>
                )}
                {paymentCheckMessage && paymentCheckMessageOrderId === order.id && (
                  <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                    {paymentCheckMessage}
                  </p>
                )}
                {order.status?.toUpperCase() === "PENDING" &&
                  order.paymentStatus?.toUpperCase() !== "PAID" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                      {order.paymentExpiresAt &&
                      (parseOrderDate(order.paymentExpiresAt)?.getTime() ?? 0) <= Date.now() ? (
                        <p className="text-xs font-bold text-rose-600">
                          Payment window expired. Verify the payment before creating another order.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Payment is due within 30 minutes. Failed payments can be retried before expiry.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={checkingPaymentOrderId === order.id || retryingOrderId === order.id}
                          onClick={() => reconcilePayment(order)}
                          className="rounded-full border border-gray-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          {checkingPaymentOrderId === order.id ? "Checking…" : "Verify payment"}
                        </button>
                        {(!order.paymentExpiresAt ||
                          (parseOrderDate(order.paymentExpiresAt)?.getTime() ?? 0) > Date.now()) && (
                            <button
                              type="button"
                              disabled={checkingPaymentOrderId === order.id || retryingOrderId === order.id}
                              onClick={() => retryPayment(order)}
                              className="rounded-full bg-[#0071e3] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-[#0077ed] disabled:opacity-50"
                            >
                              {retryingOrderId === order.id ? "Opening payment…" : "Pay now / Retry"}
                            </button>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
