import React from "react";

export default function CustomersTab({
  customers,
  loading,
  setSelectedCustomer,
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-black">
            Customer Database
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Connected to Live Production Server
          </p>
        </div>
      </div>

      <div className="grid grid-cols-6 px-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        <div className="col-span-2">Client Identity</div>
        <div className="col-span-1 text-center">Orders</div>
        <div className="col-span-1 text-center">Total Revenue</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1 text-right pr-4">Action</div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 font-black text-gray-200 animate-pulse text-4xl italic">
            LOADING DATABASE...
          </div>
        ) : customers.length > 0 ? (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="grid grid-cols-6 items-center px-10 py-6 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-[35px] transition-all hover:shadow-xl hover:shadow-gray-100/50 group"
            >
              <div className="col-span-2 flex items-center gap-4">
                <div className="truncate">
                  <p className="font-black text-sm uppercase tracking-tight truncate">
                    {customer.username || "Unknown User"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold truncate">
                    {customer.email}
                  </p>
                </div>
              </div>

              <div className="col-span-1 text-center">
                <span className="font-black text-sm text-gray-700">
                  {customer.totalOrders || 0}
                </span>
                <span className="text-[8px] text-gray-300 font-black uppercase ml-1">
                  Times
                </span>
              </div>

              <div className="col-span-1 text-center font-black italic text-blue-600 tracking-tighter text-base">
                RM{(customer.totalSpent || 0).toFixed(2)}
              </div>

              <div className="col-span-1 flex justify-center">
                <span
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    customer.isActive !== false
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-red-50 text-red-600 border-red-100"
                  }`}
                >
                  {customer.isActive !== false ? "ACTIVE" : "BANNED"}
                </span>
              </div>

              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => setSelectedCustomer(customer)}
                  className="px-6 py-2 bg-white text-black border border-gray-100 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-black hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[35px] border-2 border-dashed border-gray-100">
            <p className="font-black text-gray-300 uppercase italic tracking-widest">
              No customers found in database
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
