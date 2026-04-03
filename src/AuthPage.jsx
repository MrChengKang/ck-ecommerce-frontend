import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage({ setIsLoggedIn, setUserRole }) {
  // --- 1. 狀態定義 ---
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // --- 2. Remember Me 載入 ---
  useEffect(() => {
    const savedUser = localStorage.getItem("ck_remember_user");
    if (savedUser) {
      setFormData((prev) => ({ ...prev, username: savedUser }));
      setRememberMe(true);
    }
  }, []);

  // --- 3. 處理 登入/註冊 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    if (!isLogin) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("INVALID EMAIL FORMAT");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError("PASSWORD TOO WEAK (8+ chars, Upper & Lower case)");
        return;
      }
      if (formData.password !== confirmPassword) {
        setError("PASSWORDS DO NOT MATCH!");
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      let data =
        contentType && contentType.includes("application/json")
          ? await response.json()
          : await response.text();

      if (response.ok) {
        if (isLogin) {
          if (rememberMe)
            localStorage.setItem("ck_remember_user", formData.username);
          else localStorage.removeItem("ck_remember_user");

          localStorage.setItem("ck_token", data.token);
          localStorage.setItem("ck_role", data.role);
          setIsLoggedIn(true);
          setUserRole(data.role);
          alert("Welcome back, CK BOSS!");
          data.role === "ADMIN" ? navigate("/admin") : navigate("/");
        } else {
          alert("Registration Success! Please Login.");
          setIsLogin(true);
        }
      } else {
        const rawError = typeof data === "string" ? data : "AUTH_FAILED";
        const errorMessages = {
          USERNAME_ALREADY_EXISTS: "Username taken!",
          EMAIL_ALREADY_REGISTERED: "Email in use!",
          INVALID_CREDENTIALS: "Wrong username/email or password.",
          PASSWORD_TOO_WEAK: "Need 8+ chars, Upper & Lower case",
        };
        setError(errorMessages[rawError] || rawError);
      }
    } catch (err) {
      setError("Server Error! Backend might be down.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. 處理 忘記密碼 ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (step === 2 && newPassword !== confirmPassword) {
      setError("PASSWORDS DO NOT MATCH!");
      return;
    }

    setIsLoading(true);
    const endpoint =
      step === 1 ? "/api/auth/forgot-password" : "/api/auth/reset-password";
    const body =
      step === 1
        ? { email: formData.email }
        : { email: formData.email, otp, newPassword };

    try {
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const msg = await res.text();
      if (res.ok) {
        if (step === 1) {
          alert("OTP Sent! Check your email.");
          setStep(2);
        } else {
          alert("Password updated!");
          setIsForgotPassword(false);
          setIsLogin(true);
          setStep(1);
        }
      } else {
        setError(msg);
      }
    } catch (err) {
      setError("Server error during reset.");
    } finally {
      setIsLoading(false); // 🚨 修正這裡的大括號
    }
  };

  // --- 5. 渲染 ---
  if (isForgotPassword) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-white border border-gray-100 p-12 rounded-[45px] shadow-2xl transition-all">
          <h2 className="text-3xl font-black italic uppercase mb-6 tracking-tighter">
            Reset Password
          </h2>
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-[10px] font-bold text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            {step === 1 ? (
              <input
                type="email"
                placeholder="EMAIL"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            ) : (
              <>
                <input
                  type="text"
                  placeholder="6-DIGIT OTP"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="NEW PASSWORD"
                  className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold"
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="CONFIRM NEW PASSWORD"
                  className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </>
            )}
            <button
              disabled={isLoading}
              className="w-full bg-black text-white py-5 rounded-full font-black uppercase flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : step === 1 ? (
                "Send Code"
              ) : (
                "Reset"
              )}
            </button>
          </form>
          <button
            onClick={() => {
              setIsForgotPassword(false);
              setStep(1);
              setError("");
            }}
            className="w-full mt-6 text-[10px] font-black uppercase text-gray-400"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white border border-gray-100 p-12 rounded-[45px] shadow-2xl transition-all text-center">
        <h2 className="text-4xl font-black italic uppercase mb-10">
          {isLogin ? "Sign In" : "Register"}
        </h2>
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-[10px] font-bold uppercase">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <input
            type="text"
            placeholder={isLogin ? "USERNAME OR EMAIL" : "USERNAME"}
            value={formData.username || ""}
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
          {!isLogin && (
            <input
              type="email"
              placeholder="EMAIL"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          )}
          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="CONFIRM"
              className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          <button
            disabled={isLoading}
            className="w-full bg-black text-white py-5 rounded-full font-black uppercase flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isLogin ? (
              "Login"
            ) : (
              "Register Now"
            )}
          </button>
        </form>
        {isLogin && (
          <div className="flex items-center justify-between mt-4 px-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <div
                className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${rememberMe ? "bg-black text-white" : "border-gray-200"}`}
              >
                {rememberMe && "✓"}
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase">
                Remember
              </span>
            </label>
            <button
              onClick={() => {
                setIsForgotPassword(true);
                setError("");
              }}
              className="text-[10px] font-black text-gray-400 uppercase"
            >
              Forgot?
            </button>
          </div>
        )}
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="mt-10 text-gray-400 text-[10px] font-black uppercase underline underline-offset-4"
        >
          {isLogin ? "Need account? Sign Up" : "Member? Sign In"}
        </button>
      </div>
    </div>
  );
}
