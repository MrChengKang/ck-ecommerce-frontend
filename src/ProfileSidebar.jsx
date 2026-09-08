import React, { useState, useRef } from "react";

function ProfileSidebar({ isOpen, onClose, user, setUser, onOpenLoginModal }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 💡 用於觸發隱藏的檔案選擇器
  const fileInputRef = useRef(null);

  // 取得 JWT Token 助手函數
  const getAuthHeader = () => {
    const token = localStorage.getItem("ck_token"); // 替換為你的 Token key 名稱
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  // 處理 401 未授權（未登入或 Token 過期）
  const handleUnauthorized = () => {
    alert("Please log in first!");
    onClose();
    if (onOpenLoginModal) onOpenLoginModal();
  };

  // 1. 處理檔案選擇與上傳
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      // 💡 改打 /me/upload-avatar，且附帶 JWT Authorization Header
      const res = await fetch(
        "https://ck-ecommerce-backend.onrender.com/api/users/me/upload-avatar",
        {
          method: "POST",
          headers: {
            ...authHeader,
          },
          body: formData,
        },
      );

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, profilePic: data.url });
        alert("Avatar uploaded!");
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // 2. 儲存 Profile 修改
  const handleSave = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSaving(true);
    try {
      // 💡 改打 /me Endpoint
      const res = await fetch(
        "https://ck-ecommerce-backend.onrender.com/api/users/me",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify(user),
        },
      );

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (res.ok) {
        alert("Profile updated successfully!");
        localStorage.setItem("ck_username", user?.username || "");
      } else {
        const errorMsg = await res.text();
        alert("Update failed: " + errorMsg);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Server connection error");
    } finally {
      setIsSaving(false);
    }
  };

  // 🛡️ 如果 user 物件未帶入時的安全回退機制
  const currentUser = user || {};

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-500 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={onClose}
      />

      {/* 側邊欄 */}
      <div
        className={`fixed right-0 top-0 h-full w-[400px] bg-white z-[70] shadow-2xl transition-transform duration-700 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-8 space-y-8 animate-in fade-in duration-1000">
          <div className="flex justify-between items-center border-b border-gray-50 pb-6">
            <h2 className="text-2xl font-black italic uppercase">Account.</h2>
            <button
              onClick={onClose}
              className="text-lg hover:rotate-90 transition-transform p-2"
            >
              ✕
            </button>
          </div>

          {/* 📸 照片上傳區域 */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="group relative w-24 h-24 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={
                  currentUser.profilePic ||
                  `https://api.dicebear.com/8.x/initials/svg?seed=${currentUser.username || "User"}`
                }
                className={`w-full h-full rounded-full object-cover border-2 border-black ${
                  isUploading ? "animate-pulse opacity-50" : ""
                }`}
                alt="avatar"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-black uppercase">
                {isUploading ? "..." : "Edit"}
              </div>
            </div>
            {/* 隱藏的檔案選擇 input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* 📝 表單區域 */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar text-xs">
            <div>
              <label className="text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <input
                type="text"
                value={currentUser.username || ""}
                onChange={(e) =>
                  setUser({ ...currentUser, username: e.target.value })
                }
                className="w-full p-4 bg-gray-50 rounded-2xl border-none"
              />
            </div>
            <div>
              <label className="text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">
                Contact
              </label>
              <input
                type="text"
                value={currentUser.phoneNo || ""}
                onChange={(e) =>
                  setUser({ ...currentUser, phoneNo: e.target.value })
                }
                className="w-full p-4 bg-gray-50 rounded-2xl border-none"
              />
            </div>
            <div>
              <label className="text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">
                Address
              </label>
              <textarea
                value={currentUser.address || ""}
                onChange={(e) =>
                  setUser({ ...currentUser, address: e.target.value })
                }
                className="w-full p-4 bg-gray-50 rounded-2xl border-none h-24 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-5 bg-black text-white rounded-full font-black uppercase text-sm tracking-widest hover:bg-gray-800 transition-all"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

export default ProfileSidebar;
