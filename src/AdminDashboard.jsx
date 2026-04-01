import { useState } from "react";

// 統計卡片組件 (小組件也可以順便搬過來)
function StatCard({ title, value, color, icon }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <div
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-xl shadow-lg text-white`}
      >
        {icon}
      </div>
    </div>
  );
}

export default function AdminDashboard({ products, refreshData }) {
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    category: "",
    stockQuantity: 0,
  });
  const [uploading, setUploading] = useState(false);

  // 統計數據
  const totalProducts = products.length;
  const totalStock = products.reduce(
    (sum, p) => sum + (p.stockQuantity || 0),
    0,
  );
  const avgPrice = totalProducts
    ? (products.reduce((sum, p) => sum + p.price, 0) / totalProducts).toFixed(2)
    : 0;

  // 上傳圖片
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/products/upload",
        { method: "POST", body: formData },
      );
      const imageUrl = await response.text();
      setNewProduct({ ...newProduct, imageUrl: imageUrl });
      alert("Image Uploaded!");
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  // --- 新增商品功能 ---
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8080/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    }).then((res) => {
      if (res.ok) {
        // 🚨 關鍵在這裡！通知父組件：資料改了，去重抓一次！
        refreshData();

        setNewProduct({
          name: "",
          price: "",
          description: "",
          imageUrl: "",
          category: "",
          stockQuantity: 0,
        });
        alert("Product Added!");
      }
    });
  };

  // --- 刪除商品功能 ---
  const handleDelete = (id) => {
    if (window.confirm("Delete this item?")) {
      fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
      }).then((res) => {
        if (res.ok) {
          // 🚨 關鍵在這裡！刪完後立刻重刷名單
          refreshData();
          alert("Deleted!");
        }
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          Store Management System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Items"
          value={totalProducts}
          color="bg-blue-600"
          icon="📦"
        />
        <StatCard
          title="Total Stock"
          value={totalStock}
          color="bg-black"
          icon="🔢"
        />
        <StatCard
          title="Avg. Price"
          value={`$${avgPrice}`}
          color="bg-green-600"
          icon="💰"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-3xl shadow-sm border space-y-4 sticky top-24"
          >
            <h3 className="text-xl font-black mb-4 uppercase italic">
              Quick Add
            </h3>
            <input
              className="w-full p-3 border rounded-xl"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              required
            />
            <input
              className="w-full p-3 border rounded-xl"
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
              required
            />
            <select
              className="w-full p-3 border rounded-xl"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Accessories">Accessories</option>
            </select>
            <textarea
              className="w-full p-3 border rounded-xl"
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />
            <div className="border-2 border-dashed p-4 rounded-xl text-center">
              <input
                type="file"
                onChange={handleFileUpload}
                className="text-xs w-full"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
            >
              {uploading ? "UPLOADING..." : "PUBLISH PRODUCT"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-5 text-xs font-black uppercase text-gray-400">
                    Product
                  </th>
                  <th className="p-5 text-xs font-black uppercase text-gray-400">
                    Price
                  </th>
                  <th className="p-5 text-xs font-black uppercase text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-5 flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        alt=""
                      />
                      <span className="font-bold text-sm uppercase">
                        {p.name}
                      </span>
                    </td>
                    <td className="p-5 font-black">${p.price}</td>
                    <td className="p-5">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-500 font-black text-xs uppercase underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
