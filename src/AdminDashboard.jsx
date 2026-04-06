import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./cropImage";

// --- 小組件 ---
function StatCard({ title, value, icon, color, grow }) {
  return (
    <div className="bg-white p-8 rounded-[35px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-xl`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg">
          {grow}
        </span>
      </div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
        {title}
      </p>
      <p className="text-3xl font-black italic tracking-tighter">{value}</p>
    </div>
  );
}

function ActivityItem({ user, action, time }) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black">
        {user[0]}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-800">
          {user} <span className="font-normal text-gray-400">{action}</span>
        </p>
        <p className="text-[9px] text-gray-300 font-bold uppercase mt-0.5">
          {time}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard({ products, refreshData }) {
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

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const [isCropping, setIsCropping] = useState(false);
  const [croppedImagePreview, setCroppedImagePreview] = useState(null);

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [editingId, setEditingId] = useState(null);

  // --- 分類與數據邏輯 ---
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/categories");
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

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    try {
      const res = await fetch("http://localhost:8080/api/categories", {
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
      await fetch(`http://localhost:8080/api/categories/${id}`, {
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

      // 💡 【新增】建立一個臨時的本地 URL 用於前端預覽
      const previewUrl = URL.createObjectURL(croppedBlob);
      setCroppedImagePreview(previewUrl);

      const file = new File([croppedBlob], "product.jpg", {
        type: "image/jpeg",
      });
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8080/api/products/upload", {
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
    if (croppedImagePreview) {
      URL.revokeObjectURL(croppedImagePreview);
      setCroppedImagePreview(null);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ck_token");
    try {
      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
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
        alert("✅ UPLOAD SUCCESS!");
        setIsModalOpen(false);
        setNewProduct({
          name: "",
          price: "",
          category: "",
          imageUrl: "",
          description: "",
          stockQuantity: 0,
        });
        if (refreshData) refreshData();
      }
    } catch (err) {
      console.error(err);
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
    setCroppedImagePreview(product.imageUrl); // 顯示原本的照片
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    const token = localStorage.getItem("ck_token");
    try {
      const res = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("🗑️ Delete successful!");
        refreshData();
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
      ? `http://localhost:8080/api/products/${editingId}`
      : "http://localhost:8080/api/products";

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
        setIsModalOpen(false);
        setEditingId(null);
        if (refreshData) refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "products", label: "Products", icon: <Package size={20} /> },
    { id: "orders", label: "Orders", icon: <ShoppingCart size={20} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-gray-800 font-sans">
      {/* 1. Sidebar */}
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
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === item.id ? "bg-black text-white shadow-lg shadow-black/10" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
              >
                <div className="flex items-center gap-4 font-bold text-sm">
                  {item.icon}
                  {item.label}
                </div>
                {activeTab === item.id && (
                  <ChevronRight size={14} className="opacity-50" />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-gray-50">
          <button className="flex items-center gap-4 text-red-400 font-bold text-sm w-full px-4 py-2 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
              {activeTab}
            </h2>
            <p className="text-[10px] font-black text-gray-300 uppercase mt-1">
              CK Management System
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-tighter">
                CK_BOSS
              </p>
              <p className="text-[10px] font-bold text-green-500 uppercase">
                Super Admin
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=CK"
                alt="avatar"
              />
            </div>
          </div>
        </header>

        <main className="p-10">
          <div className="bg-white rounded-[40px] border border-gray-100 p-10 min-h-[600px] shadow-sm animate-in fade-in duration-700">
            {activeTab === "dashboard" && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Revenue"
                    value="$12,840"
                    icon="💰"
                    color="bg-blue-50 text-blue-600"
                    grow="+12%"
                  />
                  <StatCard
                    title="Total Orders"
                    value="156"
                    icon="📦"
                    color="bg-orange-50 text-orange-600"
                    grow="+5%"
                  />
                  <StatCard
                    title="Products"
                    value={products.length}
                    icon="👕"
                    color="bg-purple-50 text-purple-600"
                    grow="Stable"
                  />
                  <StatCard
                    title="Customers"
                    value="89"
                    icon="👥"
                    color="bg-green-50 text-green-600"
                    grow="+18%"
                  />
                </div>
                {/* ... 其他 Dashboard 內容 ... */}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                    Products List
                  </h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCatModalOpen(true)}
                      className="bg-white text-black border border-gray-200 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Manage Categories
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewProduct({
                          name: "",
                          price: "",
                          category: "",
                          imageUrl: "",
                          description: "",
                          stockQuantity: 0,
                        });
                        setCroppedImagePreview(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 shadow-lg active:scale-95 transition-all"
                    >
                      + Add Product
                    </button>
                  </div>
                </div>
                {/* 表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-gray-400 text-[10px] font-black uppercase px-4">
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr
                          key={p.id}
                          className="bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all rounded-3xl"
                        >
                          {/* 第一列：Product */}
                          <td className="px-6 py-4 rounded-l-[25px]">
                            <div className="flex items-center gap-4">
                              <img
                                src={p.imageUrl}
                                className="w-12 h-12 object-cover rounded-xl shadow-sm"
                                alt=""
                              />
                              <span className="font-bold text-sm uppercase">
                                {p.name}
                              </span>
                            </div>
                          </td>

                          {/* 第二列：Category */}
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black bg-white px-3 py-1.5 rounded-full border border-gray-100 uppercase">
                              {p.category || "General"}
                            </span>
                          </td>

                          {/* 💡 第三列：Price (你之前漏掉這段了！) */}
                          <td className="px-6 py-4 font-black italic text-blue-600">
                            ${p.price}
                          </td>

                          {/* 第四列：Actions */}
                          <td className="px-6 py-4 text-right rounded-r-[25px]">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-2 text-gray-300 hover:text-black transition-all"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 text-gray-300 hover:text-red-500 transition-all"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- 🚨 MODALS (移至最外層) 🚨 --- */}

      {/* 1. Category Modal */}
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
              {categories.map((cat) => (
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

      {/* 2. Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
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
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
                <input
                  type="number"
                  required
                  placeholder="Price"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm"
                  value={newProduct.category}
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
                  value={newProduct.stockQuantity}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stockQuantity: e.target.value,
                    })
                  }
                />
              </div>

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
                      /* 💡 加上這行強制讓裁切區域顯示 */
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
                  {croppedImagePreview ? (
                    // 💡 【新增】如果有了裁切後的預覽圖，就顯示它
                    <div className="relative group overflow-hidden rounded-2xl border-2 border-gray-100 shadow-inner">
                      <img
                        src={croppedImagePreview}
                        alt="Cropped preview"
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* 懸停時顯示「更換圖片」按鈕 */}
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
                    // 原本的「Choose Image」藍色/灰色按鈕樣式
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center w-full p-4 rounded-xl border-2 border-dashed cursor-pointer ${newProduct.imageUrl ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-100 text-gray-400"}`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {newProduct.imageUrl
                            ? "✓ Image Prepared (Click to Change)"
                            : "Choose Image"}
                        </span>
                      </label>
                    </>
                  )}

                  {/* 💡 為了能夠點擊圖片更換，需要確保 input file 依然存在 */}
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
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 font-black text-gray-400 uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-black text-white py-3 rounded-full font-black shadow-xl active:scale-95 transition-all uppercase text-[10px]"
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
