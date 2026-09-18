import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);

  // 取得目前 Token
  const token = localStorage.getItem("ck_token");

  // 1. 從後端載入 Wishlist
  const fetchWishlist = async () => {
    const currentToken = localStorage.getItem("ck_token");
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  // 💡 關鍵修正：當 token 改變時自動發動
  useEffect(() => {
    const currentToken = localStorage.getItem("ck_token");
    if (currentToken) {
      fetchWishlist();
    } else {
      // 💡 當 Token 消失（登出狀態）時，立刻清空願望清單 State 與快取
      setWishlistItems([]);
      localStorage.removeItem("ck_wishlist");
    }
  }, [token]); // 監聽 token 變動

  // 手動重置（提供給 handleLogout 呼叫備用）
  const resetWishlist = () => {
    setWishlistItems([]);
    localStorage.removeItem("ck_wishlist");
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product) => {
    const currentToken = localStorage.getItem("ck_token");
    if (!currentToken) {
      alert("Please sign in to save items to your wishlist!");
      return;
    }

    const exists = isInWishlist(product.id);
    setWishlistItems((prev) =>
      exists
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product],
    );

    try {
      await fetch(`${API_BASE_URL}/api/wishlist/toggle/${product.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      fetchWishlist();
    }
  };

  const clearWishlist = async () => {
    const currentToken = localStorage.getItem("ck_token");
    setWishlistItems([]);
    localStorage.removeItem("ck_wishlist");

    if (!currentToken) return;

    try {
      await fetch(`${API_BASE_URL}/api/wishlist`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
    } catch (err) {
      console.error("Failed to clear wishlist:", err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        resetWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
