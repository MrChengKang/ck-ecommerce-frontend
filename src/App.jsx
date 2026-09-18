import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import PopoutAlert from "./components/PopoutAlert";
import OrderHistoryPage from "./OrderHistoryPage";
import AdminDashboard from "./AdminDashboard";
import AuthPage from "./AuthPage";
import ProductDetail from "./components/ProductDetail";
import CheckoutPage from "./CheckoutPage";
import ProfileSidebar from "./ProfileSidebar";
import Navbar from "./components/Navbar";
import ProductGrid from "./components/ProductGrid";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import { WishlistProvider, useWishlist } from "./context/WishlistContext";
import WishlistPage from "./pages/Wishlist";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

function CheckoutSuccess() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 py-12 animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-200/80 flex items-center justify-center text-4xl mb-6 shadow-sm">
        ✓
      </div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
        ORDER CONFIRMED
      </span>
      <h1 className="text-3xl lg:text-4xl font-black text-[#1d1d1f] italic tracking-tight uppercase mb-3">
        THANK YOU FOR YOUR ORDER.
      </h1>
      <p className="text-xs font-medium text-gray-500 max-w-sm mb-8 leading-relaxed">
        Your payment was processed successfully. We've received your order and
        are preparing it for delivery.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate("/orders")}
          className="w-full py-3.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider shadow-sm"
        >
          VIEW ORDER HISTORY
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 bg-white hover:bg-gray-50 text-[#1d1d1f] border border-gray-200 text-xs font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider shadow-sm"
        >
          CONTINUE SHOPPING
        </button>
      </div>
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
    <ProductGrid
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      categories={categories}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      filteredProducts={filteredProducts}
      getImageUrl={getImageUrl}
    />
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
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const { resetWishlist } = useWishlist();

  const handleLogout = (showMsg = true) => {
    const keysToRemove = ["ck_token", "ck_role", "ck_username", "ck_email"];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    resetWishlist();

    setIsLoggedIn(false);
    setUserRole("");

    if (showMsg) {
      showAlert("Logged Out", "You have been logged out successfully.", "info");
    }
    navigate("/login", { replace: true });
  };

  const fetchData = () => {
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Fetch products error:", err));
  };

  const fetchOrders = () => {
    if (userRole.toUpperCase() === "ADMIN") {
      fetch(`${API_BASE_URL}/api/orders`)
        .then((res) => res.json())
        .then((data) => setOrders(data))
        .catch((err) => console.error("Fetch orders error:", err));
    }
  };

  const handleOpenProfile = async () => {
    const token = localStorage.getItem("ck_token");

    if (!isLoggedIn || !token) {
      showAlert(
        "Login Required",
        "Please log in to view your profile.",
        "warning",
      );
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
        showAlert("Session Expired", "Please log in again.", "warning", () =>
          handleLogout(false),
        );
        return;
      }

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsProfileOpen(true);
      } else {
        showAlert("Failed to fetch profile details.", "", "error");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      showAlert(
        "Connection Error",
        "Unable to connect to the server.",
        "error",
      );
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

          if (res.status === 401 || res.status === 403) {
            throw new Error("TOKEN_EXPIRED");
          }
          throw new Error("SERVER_ERROR");
        })
        .then((data) => setUser(data))
        .catch((err) => {
          console.error("Fetch user error:", err.message);

          if (
            err.message === "TOKEN_EXPIRED" ||
            err.message === "Unauthorized"
          ) {
            localStorage.removeItem("ck_token");
            setIsLoggedIn(false);
            setUser(null);
          }
        });
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
    setIsPending(false);
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

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  const handleCheckout = async (formData) => {
    if (cart.length === 0) return;
    setIsPending(true);

    const token = localStorage.getItem("ck_token");
    const rawUserId = localStorage.getItem("ck_user_id");

    const orderData = {
      customerId: rawUserId ? Number(rawUserId) : null,
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
        imageUrl: getImageUrl(item.imageUrl),
        productId: item.id,
      })),
    };

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        setCart([]);
        localStorage.removeItem("ck_cart");

        try {
          if (typeof fetchOrders === "function") fetchOrders();
          if (typeof fetchData === "function") fetchData();
        } catch (e) {
          console.warn("Background fetch warning:", e);
        }

        setIsPending(false);
        navigate("/success", { replace: true });
        return true;
      } else {
        const msg = await res.text();
        showAlert("Checkout Failed", msg || "Please try again.", "error");
        return false;
      }
    } catch (err) {
      console.error("Checkout Exception:", err);
      showAlert(
        "Server Connection Error",
        "Unable to connect to the server.",
        "error",
      );
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const isAdminPath = window.location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased flex flex-col justify-between">
      <div className="flex-grow">
        <Navbar
          isAdminPath={isAdminPath}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          handleOpenProfile={handleOpenProfile}
          handleLogout={handleLogout}
          setIsCartOpen={setIsCartOpen}
          cart={cart}
        />

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
                i.id === id
                  ? {
                      ...i,
                      quantity: Math.min(
                        i.stockQuantity ?? 10,
                        Math.max(1, i.quantity + d),
                      ),
                    }
                  : i,
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
                    selectedCategory === "All" ||
                    p.category === selectedCategory;
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
            path="/wishlist"
            element={
              <WishlistPage getImageUrl={getImageUrl} addToCart={addToCart} />
            }
          />

          <Route
            path="/orders"
            element={
              isLoggedIn ? (
                <OrderHistoryPage API_BASE_URL={API_BASE_URL} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

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
                setCart={setCart}
                isPending={isPending}
                setIsPending={setIsPending}
                onCheckout={handleCheckout}
                user={user}
              />
            }
          />
        </Routes>
      </div>

      {!isAdminPath && <Footer />}

      <ProfileSidebar
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        setUser={setUser}
      />
      <PopoutAlert
        isOpen={alertConfig.isOpen}
        onClose={() => {
          if (typeof alertConfig.onConfirm === "function") {
            alertConfig.onConfirm();
          }
          setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WishlistProvider>
        <AppContent />
      </WishlistProvider>
    </BrowserRouter>
  );
}
