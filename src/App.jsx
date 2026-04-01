import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

// --- 1. 商品詳情頁 ---
function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  useEffect(() => {
    fetch(`http://localhost:8080/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => console.error("Error fetching detail:", err));
  }, [id]);
  if (!product)
    return <div className="p-10 text-center text-gray-400">Loading...</div>;
  return (
    <div className="max-w-6xl mx-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full rounded-3xl shadow-2xl object-cover h-[500px]"
      />
      <div>
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">
          {product.name}
        </h1>
        <p className="text-blue-600 text-3xl font-bold mb-6">
          ${product.price}
        </p>
        <div className="border-t border-b py-6 mb-8">
          <p className="text-gray-600 text-lg">{product.description}</p>
        </div>
        <button
          onClick={() => addToCart(product)}
          className="w-full bg-black text-white py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all active:scale-95"
        >
          ADD TO CART
        </button>
        <Link to="/" className="block text-center mt-6 text-gray-400 underline">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}

// --- 2. 首頁 ---
function Home({
  products,
  filteredProducts,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
}) {
  const categories = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  return (
    <main className="max-w-7xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-4 pl-12 border-2 border-gray-100 rounded-2xl outline-none focus:border-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-bold text-xs uppercase ${selectedCategory === cat ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {filteredProducts.map((product) => (
          <Link
            to={`/product/${product.id}`}
            key={product.id}
            className="group"
          >
            <div className="overflow-hidden rounded-2xl bg-gray-200 aspect-square mb-4">
              <img
                src={product.imageUrl}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold uppercase">{product.name}</h3>
                <p className="text-sm text-gray-400">{product.category}</p>
              </div>
              <p className="font-black">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

// 統計卡片組件
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
        className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-xl shadow-lg`}
      >
        {icon}
      </div>
    </div>
  );
}

// --- 4. 側邊欄 (修正 isLoggedIn 接收) ---
function CartSidebar({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  isLoggedIn,
}) {
  const navigate = useNavigate();
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const handleCheckout = () => {
    if (!isLoggedIn) {
      onClose();
      navigate("/login");
    } else {
      alert("Proceeding to payment...");
    }
  };
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[400px] bg-white z-[70] shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-xl font-black italic">YOUR CART</h2>
            <button onClick={onClose}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">
                <img
                  src={item.imageUrl}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold uppercase text-sm">{item.name}</h3>
                  <p className="text-blue-600 font-bold">${item.price}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => updateQuantity(item.id, -1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-black mb-4">
              <span>TOTAL</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest"
            >
              {isLoggedIn ? "Checkout Now" : "Login to Checkout"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- 5. 登入頁面 ---
function Login({ setIsLoggedIn, setUserRole }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json(); // 👈 先轉成 JSON

      if (response.ok) {
        // 這裡要跟 Java 回傳的 Key 對應
        localStorage.setItem("ck_token", data.token);
        localStorage.setItem("ck_role", data.role); // 👈 確保 Java 有 response.put("role", ...)

        setIsLoggedIn(true);
        setUserRole(data.role);

        alert("Login Successful!");
        if (data.role === "ADMIN") {
          navigate("/admin"); // 👈 老闆登入直接送去後台
        } else {
          navigate("/"); // 👈 一般用戶送回首頁
        }
      } else {
        // 如果後端回傳 401，顯示後端給的錯誤訊息
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("Server Error! 請檢查 Java 後端是否有紅線。");
    }
  };
  return (
    <div className="max-w-md mx-auto mt-20 p-10 border rounded-3xl shadow-xl">
      <h2 className="text-3xl font-black mb-6 italic">LOGIN</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-4 bg-gray-100 rounded-xl"
          placeholder="USERNAME"
          onChange={(e) =>
            setCredentials({ ...credentials, username: e.target.value })
          }
        />
        <input
          className="w-full p-4 bg-gray-100 rounded-xl"
          type="password"
          placeholder="PASSWORD"
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
        />
        <button className="w-full bg-black text-white py-4 rounded-full font-bold uppercase">
          Sign In
        </button>
      </form>
    </div>
  );
}

// --- 6. 主程式 ---
export default function App() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("ck_cart")) || [],
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("ck_token"),
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem("ck_role") || "",
  );

  // 🚨 這裡就是你要加的 fetchData 邏輯
  const fetchData = () => {
    fetch("http://localhost:8080/api/products")
      .then((res) => res.json())
      .then((data) => {
        console.log("資料已同步更新:", data); // 方便你 Debug 看有沒有跑
        setProducts(data);
      })
      .catch((err) => console.error("抓取資料失敗:", err));
  };

  // 這裡確保一進網頁就會抓第一次資料
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("ck_cart", JSON.stringify(cart));
  }, [cart]);

  // addToCart 邏輯保持不變...
  const addToCart = (product) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === product.id);
      if (exist)
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || p.category === selectedCategory),
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-gray-900 relative">
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          updateQuantity={(id, d) =>
            setCart((prev) =>
              prev.map((i) =>
                i.id === id
                  ? { ...i, quantity: Math.max(1, i.quantity + d) }
                  : i,
              ),
            )
          }
          removeFromCart={(id) =>
            setCart((prev) => prev.filter((i) => i.id !== id))
          }
          isLoggedIn={isLoggedIn}
        />

        <nav className="border-b px-8 py-5 flex justify-between items-center sticky top-0 bg-white z-50">
          <Link to="/" className="text-2xl font-black italic">
            CK STORE.
          </Link>
          <div className="flex items-center space-x-6 text-xs font-bold uppercase">
            <Link to="/">Home</Link>
            {isLoggedIn && userRole === "ADMIN" && (
              <Link to="/admin" className="text-red-500">
                Admin
              </Link>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => {
                  localStorage.removeItem("ck_token");
                  localStorage.removeItem("ck_role");
                  setIsLoggedIn(false);
                  setUserRole("");
                  alert("Logged Out");
                }}
              >
                Logout
              </button>
            ) : (
              <Link to="/login">Login</Link>
            )}
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-black text-white px-5 py-2 rounded-full"
            >
              CART ({cart.reduce((a, b) => a + b.quantity, 0)})
            </button>
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <Home
                products={products}
                filteredProducts={filteredProducts}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            }
          />
          <Route
            path="/product/:id"
            element={<ProductDetail addToCart={addToCart} />}
          />
          <Route
            path="/admin"
            element={
              /* 🚨 這裡 refreshData 成功接收了 fetchData */
              <AdminDashboard products={products} refreshData={fetchData} />
            }
          />
          <Route
            path="/login"
            element={
              <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
