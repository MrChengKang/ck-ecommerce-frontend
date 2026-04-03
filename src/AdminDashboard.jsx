import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// 1. 小組件：側邊欄項目 (按鈕或連結)
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-black text-white shadow-lg"
          : "text-gray-500 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="uppercase tracking-widest text-xs">{label}</span>
    </button>
  );
}

// 2. 小組件：頂部標題欄 (Top Header)
function AdminHeader({ adminName, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">
          CK STORE.
        </h1>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          Store Management System
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-gray-400 uppercase">
          Welcome,
        </span>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
            {adminName[0].toUpperCase()}
          </div>
          <span className="font-bold text-sm uppercase">{adminName}</span>
        </div>
        <button
          onClick={onLogout}
          className="text-gray-400 hover:text-red-500 text-xs font-bold uppercase"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

// 3. 主 Layout 組件
export default function AdminLayout({ products, refreshData }) {
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("ck_token");
    localStorage.removeItem("ck_role");
    alert("Logged Out");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ⬅️ 固定在左側的側邊欄 (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col sticky top-0 h-screen">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl mx-auto mb-3 flex items-center justify-center text-3xl">
            🏬
          </div>
          <p className="font-black text-sm uppercase">CK Admin</p>
          <p className="text-xs text-gray-400">Main Store</p>
        </div>

        <nav className="flex-1 space-y-3">
          <SidebarItem
            icon="📊"
            label="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
          />
          <SidebarItem
            icon="📦"
            label="Products"
            active={activePage === "products"}
            onClick={() => setActivePage("products")}
          />
          <SidebarItem
            icon="📜"
            label="Orders"
            active={activePage === "orders"}
            onClick={() => setActivePage("orders")}
          />
          <SidebarItem
            icon="👥"
            label="Customers"
            active={activePage === "customers"}
            onClick={() => setActivePage("customers")}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <Link
            to="/"
            className="text-gray-400 hover:text-black text-xs font-bold uppercase flex items-center gap-2"
          >
            ← Back to Shop Front
          </Link>
        </div>
      </aside>

      {/* ➡️ 右側主要內容區域 (Main Content) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader adminName="ck_boss" onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-10">
          {/* 這裡根據 activePage 切換不同的組件 */}
          {activePage === "dashboard" && (
            <div>
              {/* 把你原本 `AdminDashboard` 裡的統計卡片和表格搬到這裡 */}
              <h2 className="text-2xl font-black mb-8 italic uppercase">
                Overview
              </h2>
              {/* 這裡放統計卡片和 Quick Add 表單 */}
              {/* 這裡放商品清單表格 */}
            </div>
          )}
          {activePage === "products" && (
            <div>Product Management Page (Coming Soon)</div>
          )}
          {activePage === "orders" && (
            <div>Order Management Page (Coming Soon)</div>
          )}
        </main>
      </div>
    </div>
  );
}
