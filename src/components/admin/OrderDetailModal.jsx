export default function OrderDetailModal({ order, onClose }) {
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
              #{order.id.toString().slice(-6)}
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
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl"
              >
                <img
                  src={item.imageUrl}
                  className="w-16 h-16 object-cover rounded-xl shadow-sm"
                  alt=""
                />
                <div className="flex-1">
                  <h4 className="font-black text-sm uppercase">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-gray-400 font-bold">
                    QTY: {item.quantity} × RM{item.price}
                  </p>
                </div>
                <p className="font-black italic">
                  RM{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
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
