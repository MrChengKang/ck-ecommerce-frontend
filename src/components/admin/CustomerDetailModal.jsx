export default function CustomerDetailModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-10 text-center bg-gray-50/50 border-b border-gray-100">
          <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center text-3xl font-black mx-auto mb-4 border-4 border-white shadow-xl">
            {customer.username?.[0].toUpperCase() || "U"}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">
            {customer.username}
          </h2>
          <p className="text-xs text-gray-400 font-bold mt-1 tracking-widest">
            {customer.email}
          </p>
        </div>

        {/* Stats */}
        <div className="p-10 grid grid-cols-2 gap-6">
          <div className="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100/50 text-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
              Total Orders
            </p>
            <p className="text-3xl font-black italic tracking-tighter text-blue-600">
              {customer.totalOrders} <span className="text-xs">Times</span>
            </p>
          </div>
          <div className="bg-green-50/50 p-6 rounded-[30px] border border-green-100/50 text-center">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-black italic tracking-tighter text-green-600">
              RM{customer.totalSpent?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="px-10 pb-10 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-gray-300 uppercase tracking-widest">
              Customer ID
            </span>
            <span className="font-bold text-gray-500">#{customer.id}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-gray-300 uppercase tracking-widest">
              Account Status
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full font-black text-[9px]">
              ACTIVE
            </span>
          </div>
        </div>

        <div className="p-8 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="bg-black text-white px-10 py-3 rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-lg"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
