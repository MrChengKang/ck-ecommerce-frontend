import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  ChevronRight,
  Search,
  Bell,
} from "lucide-react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./cropImage";
import CustomerDetailModal from "./components/admin/CustomerDetailModal";
import OrderDetailModal from "./components/admin/OrderDetailModal";
import ProductsTab from "./components/admin/ProductsTab";
import OrdersTab from "./components/admin/OrdersTab";
import CustomersTab from "./components/admin/CustomersTab";
import StatCard from "./components/admin/StatCard";

const API_BASE_URL = "https://ck-ecommerce-backend.onrender.com";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const cleanPath = url.replace(/^https?:\/\/[^\/]+/, "");
  return `${API_BASE_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

export default function AdminDashboard({
  products,
  orders: initialOrders = [],
  refreshData,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    imageUrl: "",
    description: "",
    stockQuantity: 0,
  });

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [isCropping, setIsCropping] = useState(false);
  const [croppedImagePreview, setCroppedImagePreview] = useState(null);

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenueTrend: [],
  });

  const [orders, setOrders] = useState(initialOrders);

  // 1. 根據 URL 動態更新 Header 的 activeTab 標題
  useEffect(() => {
    const path = location.pathname.split("/").pop();
    if (path && path !== "admin") {
      setActiveTab(path);
    }
  }, [location.pathname]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ck_token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const token = localStorage.getItem("ck_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setCustomers(data.content);
        } else {
          setCustomers(data);
        }
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname.includes("customers")) {
      fetchCustomers();
    }
  }, [location.pathname]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Fetch categories failed", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchOrders = async (page = 0, size = 5) => {
    try {
      const token = localStorage.getItem("ck_token");

      const res = await fetch(
        `${API_BASE_URL}/api/orders?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setOrders(data.content || data);
      }
    } catch (err) {
      console.error("Fetch orders failed", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        setNewCategoryName("");
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: "DELETE",
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  // --- 圖片處理 ---
  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      const previewUrl = URL.createObjectURL(croppedBlob);
      setCroppedImagePreview(previewUrl);

      const file = new File([croppedBlob], "product.jpg", {
        type: "image/jpeg",
      });
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/products/upload`, {
        method: "POST",
        body: formData,
      });
      const url = await res.text();
      setNewProduct({ ...newProduct, imageUrl: url });
      setIsCropping(false);
    } catch (e) {
      console.error(e);
    }
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setIsCropping(false);
    setImage(null);
    setEditingId(null);
    if (croppedImagePreview) {
      URL.revokeObjectURL(croppedImagePreview);
      setCroppedImagePreview(null);
    }
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      description: product.description,
      stockQuantity: product.stockQuantity,
    });
    setCroppedImagePreview(product.imageUrl);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    const token = localStorage.getItem("ck_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("🗑️ Delete successful!");
        if (refreshData) refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ck_token");
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_BASE_URL}/api/products/${editingId}`
      : `${API_BASE_URL}/api/products`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
        }),
      });

      if (response.ok) {
        alert(editingId ? "✅ Edit successful!" : "✅ Upload successful!");
        closeProductModal();
        if (refreshData) refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("ck_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (typeof setOrders === "function") {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === orderId ? { ...order, status: newStatus } : order,
            ),
          );
        }
      }
    } catch (err) {
      console.error("Update status failed:", err);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS ORDER? 🚨"))
      return;

    const token = localStorage.getItem("ck_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("🗑️ ORDER DELETED SUCCESSFULLY!");
        if (refreshData) refreshData();
      } else {
        const errorMsg = await res.text();
        alert("DELETE FAILED: " + errorMsg);
      }
    } catch (err) {
      console.error("Delete order error:", err);
      alert("SERVER CONNECTION ERROR");
    }
  };

  const handleLogout = () => {
    if (window.confirm("ARE YOU SURE YOU WANT TO LOGOUT?")) {
      localStorage.removeItem("ck_token");
      localStorage.removeItem("ck_user");
      alert("LOGOUT SUCCESSFUL. SEE YOU SOON, BOSS! 🫡");
      window.location.href = "/login";
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "products",
      label: "Products",
      path: "/admin/products",
      icon: <Package size={20} />,
    },
    {
      id: "orders",
      label: "Orders",
      path: "/admin/orders",
      icon: <ShoppingCart size={20} />,
    },
    {
      id: "customers",
      label: "Customers",
      path: "/admin/customers",
      icon: <Users size={20} />,
    },
  ];

  const getStatusStyles = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-700 border-amber-200",
      PAID: "bg-blue-100 text-blue-700 border-blue-200",
      SHIPPED: "bg-purple-100 text-purple-700 border-purple-200",
      DELIVERED: "bg-green-100 text-green-700 border-green-200",
      CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-500 border-gray-200";
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black italic">
              CK
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">
              Admin Panel
            </h1>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname.includes(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 
          ${
            isActive
              ? "bg-black text-white shadow-lg shadow-black/10"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
                >
                  <div className="flex items-center gap-4 font-bold text-sm">
                    {item.icon}
                    {item.label}
                  </div>
                  {isActive && (
                    <ChevronRight size={14} className="opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-4 text-gray-400 font-bold text-sm w-full px-4 py-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all duration-300"
          >
            <div className="group-hover:rotate-12 transition-transform">
              <LogOut size={20} />
            </div>
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-28 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-50">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-black">
                {activeTab}
              </h2>
              <span className="bg-black text-white text-[8px] px-2 py-0.5 rounded-full font-bold">
                V2.0
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                System Live •{" "}
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Press / to search anything..."
              className="w-80 bg-gray-100/50 border-none rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all group">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full group-hover:scale-125 transition-transform" />
            </button>

            <div className="w-[1px] h-10 bg-gray-100" />

            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                  CK_BOSS
                </p>
                <p className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">
                  Master Controller
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-0.5 shadow-sm group-hover:shadow-md transition-all">
                <div className="w-full h-full rounded-[14px] overflow-hidden border-2 border-white">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=CK&backgroundColor=b6e3f4"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-10">
          <div className="bg-white rounded-[40px] border border-gray-100 p-10 min-h-[600px] shadow-sm animate-in fade-in duration-700">
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />

              <Route
                path="dashboard"
                element={
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {stats && (
                      <>
                        <StatCard
                          title="Total Revenue"
                          value={`RM${(stats.totalRevenue || 0).toLocaleString()}`}
                          data={stats.revenueTrend || []}
                          icon="💰"
                          color="bg-blue-50 text-blue-600"
                          grow="+12%"
                        />
                        <StatCard
                          title="Total Orders"
                          value={stats.totalOrders}
                          data={stats.orderTrend || []}
                          icon="📦"
                          color="bg-orange-50 text-orange-600"
                          grow="+5%"
                        />
                        <StatCard
                          title="Products"
                          value={stats.totalProducts}
                          data={stats.productTrend || []}
                          icon="👕"
                          color="bg-purple-50 text-purple-600"
                          grow="Stable"
                        />
                        <StatCard
                          title="Customers"
                          value={stats.totalCustomers}
                          data={stats.customerTrend || []}
                          icon="👥"
                          color="bg-green-50 text-green-600"
                          grow="+18%"
                        />
                      </>
                    )}
                  </div>
                }
              />

              <Route
                path="products"
                element={
                  <ProductsTab
                    products={products}
                    loading={loading}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setIsCatModalOpen={setIsCatModalOpen}
                    setEditingId={setEditingId}
                    setNewProduct={setNewProduct}
                    setCroppedImagePreview={setCroppedImagePreview}
                    setIsModalOpen={setIsModalOpen}
                    openEditModal={openEditModal}
                    handleDeleteProduct={handleDeleteProduct}
                  />
                }
              />

              <Route
                path="orders"
                element={
                  <OrdersTab
                    orders={orders}
                    loading={loading}
                    setOrders={setOrders}
                    handleUpdateStatus={handleUpdateStatus}
                    setSelectedOrder={setSelectedOrder}
                    handleDeleteOrder={handleDeleteOrder}
                    getStatusStyles={getStatusStyles}
                  />
                }
              />

              <Route
                path="customers"
                element={
                  <CustomersTab
                    customers={customers}
                    loading={loading}
                    setSelectedCustomer={setSelectedCustomer}
                  />
                }
              />
            </Routes>
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCatModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[30px] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black italic uppercase mb-6">
              Manage Categories
            </h3>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs"
                placeholder="New..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                onClick={handleAddCategory}
                className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black"
              >
                ADD
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {Array.isArray(categories) &&
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group text-xs font-bold uppercase"
                  >
                    <span>{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-400 opacity-0 group-hover:opacity-100 transition-all font-black"
                    >
                      DELETE
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeProductModal}
          />
          <div className="relative bg-white w-full max-w-md rounded-[35px] shadow-2xl p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-black italic uppercase mb-6">
              {editingId ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Name"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm"
                  value={newProduct.name || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
                <input
                  type="number"
                  required
                  placeholder="Price"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm"
                  value={newProduct.price || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm"
                  value={newProduct.category || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                >
                  <option value="">Category</option>
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  required
                  placeholder="Stock"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm"
                  value={newProduct.stockQuantity || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stockQuantity: e.target.value,
                    })
                  }
                />
              </div>
              {!newProduct.imageUrl && (
                <p className="text-[11px] text-red-400 font-bold mt-2 text-center italic">
                  * Please upload and save a product image first
                </p>
              )}

              {isCropping ? (
                <div className="relative w-full h-[300px] min-h-[300px] bg-gray-900 rounded-2xl overflow-hidden mb-4 shadow-inner border border-gray-700">
                  <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1 / 1}
                    onCropChange={setCrop}
                    onCropComplete={(croppedArea, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels);
                    }}
                    onZoomChange={setZoom}
                    objectFit="contain"
                    style={{
                      containerStyle: {
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      },
                      cropAreaStyle: {
                        border: "2px solid white",
                      },
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCropSave}
                    className="absolute bottom-4 right-4 bg-black text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase z-[120] hover:bg-gray-800 border border-white/20 active:scale-95"
                  >
                    Save Crop
                  </button>
                </div>
              ) : (
                <div className="relative mb-4">
                  {croppedImagePreview || newProduct.imageUrl ? (
                    <div className="relative group overflow-hidden rounded-2xl border-2 border-gray-100 shadow-inner">
                      <img
                        src={
                          croppedImagePreview ||
                          getImageUrl(newProduct.imageUrl)
                        }
                        alt="Product preview"
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <label
                        htmlFor="file-upload"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white font-black uppercase text-xs tracking-widest bg-black/50 px-4 py-2 rounded-lg">
                          Change Image
                        </span>
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center w-full p-4 rounded-xl border-2 border-dashed cursor-pointer bg-gray-50 border-gray-100 text-gray-400"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Choose Image
                      </span>
                    </label>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                </div>
              )}

              <textarea
                placeholder="Description"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm h-20 resize-none"
                value={newProduct.description || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="flex-1 py-3 font-black text-gray-400 uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
                >
                  {editingId ? "Update" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
