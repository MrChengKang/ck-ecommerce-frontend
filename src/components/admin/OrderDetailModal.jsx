import React, { useEffect, useState } from "react";

const API_BASE_URL = "https://ck-ecommerce-backend.onrender.com";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  if (url.includes("localhost:8080")) {
    return url.replace("http://localhost:8080", API_BASE_URL);
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default function OrderDetailModal({ order, onClose, onUpdateShipment }) {
  const [shippingCarrier, setShippingCarrier] = useState(
    order?.shippingCarrier || "",
  );
  const [trackingNumber, setTrackingNumber] = useState(
    order?.trackingNumber || "",
  );
  const [trackingUrl, setTrackingUrl] = useState(order?.trackingUrl || "");
  const [savingShipment, setSavingShipment] = useState(false);
  const [shipmentMessage, setShipmentMessage] = useState("");

  useEffect(() => {
    setShippingCarrier(order?.shippingCarrier || "");
    setTrackingNumber(order?.trackingNumber || "");
    setTrackingUrl(order?.trackingUrl || "");
    setShipmentMessage("");
  }, [
    order?.id,
    order?.shippingCarrier,
    order?.trackingNumber,
    order?.trackingUrl,
  ]);

  if (!order) return null;

  const canUpdateShipment =
    order.paymentStatus?.toUpperCase() === "PAID" &&
    ["PROCESSING", "SHIPPED"].includes(order.status?.toUpperCase());

  const saveShipment = async (event) => {
    event.preventDefault();
    setSavingShipment(true);
    setShipmentMessage("");

    const saved = await onUpdateShipment(order.id, {
      shippingCarrier,
      trackingNumber,
      trackingUrl,
    });

    setSavingShipment(false);
    setShipmentMessage(
      saved ? "Shipment details saved." : "Could not save shipment details.",
    );
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Order Details
            </p>
            <h2 className="text-2xl font-black italic tracking-tighter">
              #{order.id ? order.id.toString().slice(-6) : "N/A"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xl hover:rotate-90 transition-transform"
          >
            ✕
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
          {/* Items Loop */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">
              Items Purchased
            </h3>
            {Array.isArray(order.items) &&
              order.items.map((item, idx) => {
                const rawImg = item.imageUrl || item.product?.imageUrl || "";
                const name =
                  item.productName || item.product?.name || "Product";
                const price = Number(item.price || 0);
                const quantity = Number(item.quantity || 1);

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl"
                  >
                    {/* 💡 使用 getImageUrl 轉轉換路徑 */}
                    <img
                      src={getImageUrl(rawImg)}
                      className="w-16 h-16 object-cover rounded-xl shadow-sm bg-gray-200"
                      alt={name}
                    />
                    <div className="flex-1">
                      <h4 className="font-black text-sm uppercase">{name}</h4>
                      <p className="text-xs text-gray-400 font-bold">
                        QTY: {quantity} × RM{price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-black italic">
                      RM{(price * quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            {canUpdateShipment && (
              <section className="space-y-4 border-t border-gray-100 pt-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">
                    Shipment
                  </h3>
                  {order.shippedAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      Shipped at:{" "}
                      {new Date(`${order.shippedAt}Z`).toLocaleString()}
                    </p>
                  )}
                </div>

                <form onSubmit={saveShipment} className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500">
                    Shipping carrier
                    <input
                      required
                      maxLength={80}
                      value={shippingCarrier}
                      onChange={(event) =>
                        setShippingCarrier(event.target.value)
                      }
                      placeholder="J&T Express"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                    />
                  </label>

                  <label className="block text-xs font-bold text-gray-500">
                    Tracking number
                    <input
                      required
                      maxLength={120}
                      value={trackingNumber}
                      onChange={(event) =>
                        setTrackingNumber(event.target.value)
                      }
                      placeholder="Enter tracking number"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                    />
                  </label>

                  <label className="block text-xs font-bold text-gray-500">
                    Tracking URL (optional)
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(event) => setTrackingUrl(event.target.value)}
                      placeholder="https://courier.example/track"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3">
                    <p role="status" className="text-xs text-emerald-700">
                      {shipmentMessage}
                    </p>
                    <button
                      type="submit"
                      disabled={savingShipment}
                      className="rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {savingShipment
                        ? "Saving…"
                        : order.status?.toUpperCase() === "SHIPPED"
                          ? "Update shipment"
                          : "Save and mark shipped"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>

        <div className="p-8 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="bg-black text-white px-10 py-3 rounded-full font-black uppercase text-xs tracking-widest"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
