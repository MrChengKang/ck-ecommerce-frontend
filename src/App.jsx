import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  Navigate,
} from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import AuthPage from "./AuthPage";
import CheckoutPage from "./CheckoutPage";
import ProfileSidebar from "./ProfileSidebar";

const API_BASE_URL = "http://localhost:8080";

// --- 1. 商品詳情頁 ---
function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => console.error("Error:", err));
  }, [id]);

  if (!product)
    return (
      <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest italic">
        Loading...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-700">
      <div className="overflow-hidden rounded-[40px] shadow-2xl bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-[550px] object-cover hover:scale-105 transition-transform duration-1000"
        />
      </div>
      <div className="flex flex-col justify-center">
        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter italic text-gray-900">
          {product.name}
        </h1>
        <p className="text-blue-600 text-3xl font-black mb-8 italic">
          RM{product.price}
        </p>
        <div className="border-y border-gray-100 py-10 mb-8">
          <p className="text-gray-500 leading-relaxed text-lg font-medium">
            {product.description}
          </p>
        </div>
        <button
          disabled={product.stockQuantity <= 0}
          onClick={() => addToCart(product)}
          className={`w-full py-6 rounded-full font-black text-xl transition-all active:scale-95 shadow-2xl shadow-black/20 uppercase tracking-tighter ${
            product.stockQuantity <= 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {product.stockQuantity <= 0 ? (
            <span className="flex items-center justify-center gap-2">
              <span className="opacity-50">🚫</span> SOLD OUT
            </span>
          ) : (
            "ADD TO CART"
          )}
        </button>
        <Link
          to="/"
          className="block text-center mt-8 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-black transition-colors"
        >
          ← BACK TO SHOP
        </Link>
      </div>
    </div>
  );
}

function CheckoutSuccess() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mb-8 shadow-lg shadow-green-100">
        ✓
      </div>
      <h1 className="text-5xl font-black italic tracking-tighter mb-4">
        THANK YOU!
      </h1>
      <p className="text-gray-400 font-medium max-w-md mb-10">
        Your order has been placed successfully. We'll send you a confirmation
        email shortly.
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-black text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all"
      >
        Back to Shopping
      </button>
    </div>
  );
}

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
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
        <div className="relative w-full md:w-[450px] group">
          <input
            type="text"
            placeholder="SEARCH SOMETHING..."
            className="w-full p-5 pl-14 bg-gray-50 border-none rounded-3xl outline-none focus:ring-2 focus:ring-black/5 font-black transition-all placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
            🔍
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 transform active:scale-90 ${
                selectedCategory === cat
                  ? "bg-black text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] scale-105"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14">
        {filteredProducts.length > 0 ? (
          <>
            {filteredProducts.map((product) => (
              <Link
                to={`/product/${product.id}`}
                key={product.id}
                className="group"
              >
                <div className="overflow-hidden rounded-[45px] bg-gray-50 aspect-[4/5] mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  <img
                    src={product.imageUrl}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000"
                    alt={product.name}
                  />
                </div>
                <div className="flex justify-between items-start px-4">
                  <div>
                    <h3 className="font-black uppercase text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">
                      {product.category}
                    </p>
                  </div>
                  <p className="font-black text-xl italic">RM{product.price}</p>
                </div>
              </Link>
            ))}
          </>
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 animate-pulse">
            <span className="text-6xl">📦</span>
            <p className="text-gray-400 font-black uppercase tracking-widest">
              No products found in "{selectedCategory}"
            </p>
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-xs font-black underline underline-offset-4 hover:text-blue-600"
            >
              VIEW ALL PRODUCTS
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function CartSidebar({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  isLoggedIn,
  onCheckout,
  isPending,
}) {
  const navigate = useNavigate();
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const processCheckout = () => {
    onClose();
    navigate("/checkout");
  };
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-500 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[480px] bg-white z-[70] shadow-2xl transition-transform duration-700 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full p-10">
          <div className="flex justify-between items-center border-b border-gray-50 pb-8 mb-8">
            <h2 className="text-3xl font-black italic tracking-tighter">
              MY CART
            </h2>
            <button
              onClick={onClose}
              className="text-xl hover:rotate-90 transition-transform p-2"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <span className="text-8xl grayscale opacity-30">🛒</span>
                <p className="font-black text-gray-300 uppercase tracking-widest">
                  Your cart is empty
                </p>
                <button
                  onClick={onClose}
                  className="text-xs font-black underline underline-offset-8 hover:text-blue-600 transition-colors"
                >
                  START EXPLORING →
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-6 items-center bg-gray-50/50 p-5 rounded-[30px] border border-gray-50"
                >
                  <img
                    src={item.imageUrl}
                    className="w-24 h-24 object-cover rounded-2xl shadow-lg"
                    alt={item.name}
                  />
                  <div className="flex-1">
                    <h3 className="font-black uppercase text-[10px] tracking-tight mb-1 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-blue-600 font-black text-base italic">
                      RM{item.price}
                    </p>
                    <div className="flex items-center gap-5 mt-4">
                      <div className="flex items-center bg-white rounded-full border border-gray-100 px-3 py-1.5 gap-4 shadow-sm">
                        <button
                          className="w-4 h-4 flex items-center justify-center font-bold text-gray-400 hover:text-black"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="text-xs font-black w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          className="w-4 h-4 flex items-center justify-center font-bold text-gray-400 hover:text-black"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="ml-auto text-[9px] font-black text-red-300 uppercase tracking-widest hover:text-red-500 transition-colors"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-50 pt-10 mt-6">
            <div className="flex justify-between font-black mb-10 text-3xl tracking-tighter italic">
              <span>TOTAL</span>
              <span>RM{totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={processCheckout}
              disabled={isPending || cart.length === 0}
              className={`w-full py-6 rounded-full font-black text-xl tracking-widest transition-all active:scale-95 shadow-2xl ${
                isPending || cart.length === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" // 💡 禁用狀態：灰色
                  : "bg-black text-white hover:bg-gray-800 shadow-black/20" // 💡 正常狀態：黑底白字
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin text-2xl">⏳</span>{" "}
                  PROCESSING...
                </span>
              ) : isLoggedIn ? (
                "PROCEED TO CHECKOUT"
              ) : (
                "LOGIN TO CHECKOUT"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: localStorage.getItem("ck_username") || "",
    email: localStorage.getItem("ck_email") || "",
    profilePic: "",
    address: "",
    phoneNo: "",
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("ck_cart")) || [],
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("ck_token"),
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem("ck_role") || "",
  );

  const handleLogout = (showMsg = true) => {
    const keysToRemove = ["ck_token", "ck_role", "ck_username", "ck_email"];
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    setIsLoggedIn(false);
    setUserRole("");

    if (showMsg) {
      alert("Logout Success!");
    }
    navigate("/login", { replace: true });
  };

  const fetchData = () => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  };

  const fetchOrders = () => {
    if (userRole.toUpperCase() === "ADMIN") {
      fetch(`${API_BASE_URL}/api/orders`)
        .then((res) => res.json())
        .then((data) => setOrders(data));
    }
  };

  const handleOpenProfile = async () => {
    const token = localStorage.getItem("ck_token");

    if (!isLoggedIn || !token) {
      alert("Please login first!");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        handleLogout(false);
        return;
      }

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsProfileOpen(true);
      } else {
        alert("Failed to fetch profile details.");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      alert("Server connection error.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("ck_token");
    if (isLoggedIn && token) {
      fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Unauthorized");
        })
        .then((data) => setUser(data))
        .catch((err) => console.error("Fetch user error:", err));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchData();
    fetchOrders();
  }, [userRole]);
  useEffect(() => {
    localStorage.setItem("ck_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === product.id);
      if (exist)
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleCheckout = async (formData) => {
    if (cart.length === 0) return;
    setIsPending(true);

    const orderData = {
      customerId: localStorage.getItem("ck_user_id"),
      customerName: formData.name,
      customerEmail: formData.email,
      shippingAddress: formData.address,
      paymentMethod: formData.paymentMethod,
      totalAmount: cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      items: cart.map((item) => ({
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        productId: item.id,
      })),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        setCart([]);
        fetchOrders();
        navigate("/success");
      } else {
        const msg = await res.text();
        alert("Checkout Failed: " + msg);
      }
    } catch (err) {
      alert("Server Error");
    } finally {
      setIsPending(false);
    }
  };

  const isAdminPath = window.location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {!isAdminPath && (
        <nav className="border-b border-gray-50 px-12 py-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-50">
          <Link to="/" className="text-3xl font-black italic tracking-tighter">
            CK STORE.
          </Link>
          <div className="flex items-center space-x-10 text-[10px] font-black uppercase tracking-[0.25em]">
            <Link to="/">Home</Link>
            <button onClick={handleOpenProfile}>Profile</button>
            {isLoggedIn && userRole.toUpperCase() === "ADMIN" && (
              <Link to="/admin" className="text-red-500">
                Admin
              </Link>
            )}

            {isLoggedIn ? (
              <button
                onClick={() => handleLogout(true)}
                className="hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
            )}
            <button
              key={cart.length}
              onClick={() => setIsCartOpen(true)}
              className="bg-black text-white px-8 py-3 rounded-full shadow-xl flex items-center gap-3"
            >
              CART <span className="bg-white/20 w-px h-3" />{" "}
              <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            </button>
          </div>
        </nav>
      )}

      {/* 這裡是傳遞給側邊欄的 Props */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        isLoggedIn={isLoggedIn}
        onCheckout={handleCheckout}
        isPending={isPending}
        updateQuantity={(id, d) =>
          setCart((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i,
            ),
          )
        }
        removeFromCart={(id) =>
          setCart((prev) => prev.filter((i) => i.id !== id))
        }
      />

      <Routes>
        <Route
          path="/"
          element={
            <Home
              products={products}
              filteredProducts={products.filter((p) => {
                const matchesSearch = p.name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
                const matchesCategory =
                  selectedCategory === "All" || p.category === selectedCategory;
                return matchesSearch && matchesCategory;
              })}
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
        <Route path="/success" element={<CheckoutSuccess />} />
        <Route
          path="/admin/*"
          element={
            isLoggedIn && userRole.toUpperCase() === "ADMIN" ? (
              <AdminDashboard
                products={products}
                orders={orders}
                refreshData={() => {
                  fetchData();
                  fetchOrders();
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AuthPage
                setIsLoggedIn={setIsLoggedIn}
                setUserRole={setUserRole}
              />
            )
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              cart={cart}
              isPending={isPending}
              onCheckout={handleCheckout}
              user={user}
            />
          }
        />
      </Routes>
      <ProfileSidebar
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        setUser={setUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
