import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductReviewForm from "./components/ProductReviewForm";

const parseOrderDate = (dateString) => {
  if (!dateString) return null;
  // LocalDateTime from the backend has no offset; new records are stored as UTC.
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(dateString);
  const date = new Date(hasTimezone ? dateString : `${dateString}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const OrderHistoryPage = ({ API_BASE_URL }) => {
  const ORDERS_PER_PAGE = 10;
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingOrderId, setRetryingOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancellationError, setCancellationError] = useState("");
  const [cancellationErrorOrderId, setCancellationErrorOrderId] = useState(null);
  const [checkingPaymentOrderId, setCheckingPaymentOrderId] = useState(null);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState("");
  const [paymentCheckMessageOrderId, setPaymentCheckMessageOrderId] =
    useState(null);
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

      try {
        const reviewResponse = await fetch(`${API_BASE_URL}/api/reviews/mine`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();
          setMyReviews(Array.isArray(reviewData) ? reviewData : []);
        }
      } catch (reviewError) {
        console.warn("Could not load existing product reviews:", reviewError);
      }
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
  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.trim().toLowerCase();
    const isNumericSearch = /^\d+$/.test(search);
    const matchesSearch =
      !search ||
      (isNumericSearch
        ? String(order.id).includes(search)
        : (order.orderNumber || "").toLowerCase().includes(search));
    const matchesPayment =
      paymentFilter === "ALL" ||
      (order.paymentStatus || "").toUpperCase() === paymentFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (order.status || "PENDING").toUpperCase() === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });
  const filteredTotalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    if (filteredTotalPages > 0 && currentPage > filteredTotalPages) {
      setCurrentPage(filteredTotalPages);
    }
  }, [currentPage, filteredTotalPages]);

  useEffect(() => {
    if (!hasUnpaidPendingOrder) return undefined;

    const poll = window.setInterval(loadOrders, 5000);
    const stopPolling = window.setTimeout(
      () => window.clearInterval(poll),
      120000,
    );
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
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${order.id}/payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ck_token")}`,
          },
        },
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Could not reopen the payment link.");
      }
      const payment = await response.json();
      if (!payment.paymentUrl)
        throw new Error("Billplz did not return a payment link.");
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      setPaymentError(
        error.message || "Could not start payment. Please try again.",
      );
      setRetryingOrderId(null);
    }
  };

  const cancelOrder = async (order) => {
    setCancellingOrderId(order.id);
    setCancellationError("");
    setCancellationErrorOrderId(order.id);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/orders/${order.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ck_token")}`,
          },
        },
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Could not cancel this order.");
      }
      await loadOrders();
      setOrderToCancel(null);
    } catch (error) {
      setCancellationError(
        error.message || "Could not cancel this order. Please try again.",
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    if (!orderToCancel || cancellingOrderId !== null) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOrderToCancel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [orderToCancel, cancellingOrderId]);

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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ck_token")}`,
          },
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.message || "Could not verify payment with Billplz.",
        );
      }
      await loadOrders();
      if (result.paymentStatus?.toUpperCase() === "PAID") {
        setPaymentCheckMessage("");
      } else {
        setPaymentCheckMessage(
          result.message || "Billplz still shows this payment as unpaid.",
        );
      }
    } catch (error) {
      setPaymentError(
        error.message || "Could not verify payment. Please try again.",
      );
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

        {orders.length > 0 && (
          <section
            aria-label="Search and filter orders"
            className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:grid-cols-3"
          >
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Search order
              <input
                type="search"
                value={orderSearch}
                onChange={(event) => {
                  setOrderSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Order ID or number"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none transition focus:border-blue-400"
              />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Payment status
              <select
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none transition focus:border-blue-400"
              >
                <option value="ALL">All payments</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Order status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none transition focus:border-blue-400"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
          </section>
        )}

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
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-200/60 bg-white p-12 text-center shadow-sm">
            <h3 className="text-lg font-black text-[#1d1d1f]">NO MATCHING ORDERS</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try a different search or adjust the status filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setOrderSearch("");
                setPaymentFilter("ALL");
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className="mt-5 rounded-full bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#0077ed]"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleOrders.map((order) => (
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
                      <div key={item.id || index} className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-medium text-gray-700 py-1.5">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                            <span className="font-bold text-[#1d1d1f]">
                              {item.productName || item.product?.name || "Product"}
                            </span>
                            <span className="text-gray-400 font-medium text-[11px] bg-gray-100 px-2 py-0.5 rounded-full">
                              x {item.quantity || 1}
                            </span>
                          </div>
                          <span className="font-bold text-[#1d1d1f]">
                            RM{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                        {item.productId &&
                          ["COMPLETED", "DELIVERED"].includes(order.status?.toUpperCase()) &&
                          order.paymentStatus?.toUpperCase() === "PAID" && (
                            <ProductReviewForm
                              API_BASE_URL={API_BASE_URL}
                              order={order}
                              item={item}
                              reviewed={myReviews.some(
                                (review) => review.orderId === order.id && review.productId === item.productId,
                              )}
                              onSubmitted={(review) => setMyReviews((current) => [review, ...current])}
                            />
                          )}
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
                {paymentError &&
                  retryingOrderId === null &&
                  paymentErrorOrderId === order.id && (
                    <p
                      role="alert"
                      className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
                    >
                      {paymentError}
                    </p>
                  )}
                {paymentCheckMessage &&
                  paymentCheckMessageOrderId === order.id && (
                    <p
                      role="status"
                      className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700"
                    >
                      {paymentCheckMessage}
                    </p>
                  )}
                {cancellationError && cancellationErrorOrderId === order.id && (
                  <p
                    role="alert"
                    className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
                  >
                    {cancellationError}
                  </p>
                )}
                {order.status?.toUpperCase() === "PENDING" &&
                  order.paymentStatus?.toUpperCase() !== "PAID" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                      {order.paymentExpiresAt &&
                      (parseOrderDate(order.paymentExpiresAt)?.getTime() ??
                        0) <= Date.now() ? (
                        <p className="text-xs font-bold text-rose-600">
                          Payment window expired. Verify the payment before
                          creating another order.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Payment is due within 30 minutes. Failed payments can
                          be retried before expiry.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            checkingPaymentOrderId === order.id ||
                            retryingOrderId === order.id ||
                            cancellingOrderId === order.id
                          }
                          onClick={() => reconcilePayment(order)}
                          className="rounded-full border border-gray-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-wider text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          {checkingPaymentOrderId === order.id
                            ? "Checking…"
                            : "Verify payment"}
                        </button>
                        {(!order.paymentExpiresAt ||
                          (parseOrderDate(order.paymentExpiresAt)?.getTime() ??
                            0) > Date.now()) && (
                          <button
                            type="button"
                            disabled={
                              checkingPaymentOrderId === order.id ||
                              retryingOrderId === order.id ||
                              cancellingOrderId === order.id
                            }
                            onClick={() => retryPayment(order)}
                            className="rounded-full bg-[#0071e3] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-[#0077ed] disabled:opacity-50"
                          >
                            {retryingOrderId === order.id
                              ? "Opening payment…"
                              : "Pay now / Retry"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={
                            checkingPaymentOrderId === order.id ||
                            retryingOrderId === order.id ||
                            cancellingOrderId === order.id
                          }
                          onClick={() => {
                            setCancellationError("");
                            setCancellationErrorOrderId(order.id);
                            setOrderToCancel(order);
                          }}
                          className="rounded-full border border-rose-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-wider text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          {cancellingOrderId === order.id
                            ? "Cancelling…"
                            : "Cancel order"}
                        </button>
                      </div>
                    </div>
                  )}
                {order.shippingCarrier && order.trackingNumber && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm">
                    <p className="font-bold text-gray-800">Shipment details</p>
                    <p className="mt-2 text-gray-600">
                      Carrier: {order.shippingCarrier}
                    </p>
                    <p className="text-gray-600">
                      Tracking number:{" "}
                      <span className="font-mono font-bold">
                        {order.trackingNumber}
                      </span>
                    </p>
                    {order.shippedAt && (
                      <p className="text-xs text-gray-500">
                        Shipped: {formatDate(order.shippedAt)}
                      </p>
                    )}
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block font-bold text-blue-700 underline"
                      >
                        Track package
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filteredTotalPages > 1 && (
              <nav
                aria-label="Order history pages"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 border border-gray-200/60 shadow-sm"
              >
                <p className="text-xs font-medium text-gray-500">
                  Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1}
                  {"–"}
                  {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span aria-live="polite" className="text-xs font-bold text-gray-500">
                    Page {currentPage} of {filteredTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(filteredTotalPages, page + 1))}
                    disabled={currentPage === filteredTotalPages}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
      {orderToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              cancellingOrderId !== orderToCancel.id
            ) {
              setOrderToCancel(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            aria-describedby="cancel-order-description"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="p-7 sm:p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="m19 6-1 14H6L5 6" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </div>
              <h2
                id="cancel-order-title"
                className="text-xl font-black tracking-tight text-[#1d1d1f]"
              >
                Cancel Order #{orderToCancel.id}?
              </h2>
              <p
                id="cancel-order-description"
                className="mt-3 text-sm leading-6 text-gray-500"
              >
                This will cancel your unpaid order and release its reserved
                stock. You can’t undo this action.
              </p>
              {cancellationError &&
                cancellationErrorOrderId === orderToCancel.id && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700"
                  >
                    {cancellationError}
                  </p>
                )}
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={cancellingOrderId === orderToCancel.id}
                onClick={() => setOrderToCancel(null)}
                className="rounded-full border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep order
              </button>
              <button
                type="button"
                disabled={cancellingOrderId === orderToCancel.id}
                onClick={() => cancelOrder(orderToCancel)}
                className="rounded-full bg-rose-600 px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancellingOrderId === orderToCancel.id
                  ? "Cancelling…"
                  : "Confirm cancellation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
