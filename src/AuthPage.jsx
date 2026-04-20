import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const AuthInput = ({
  type,
  placeholder,
  value,
  onChange,
  isPasswordField,
  showPassword,
  setShowPassword,
}) => (
  <div className="relative w-full group">
    <input
      type={isPasswordField ? (showPassword ? "text" : "password") : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold transition-all focus:bg-gray-100 border border-transparent focus:border-gray-200"
    />

    {/* 💡 使用 Lucide Icon 替換 Emoji */}
    {isPasswordField && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
      >
        {showPassword ? (
          <EyeOff size={20} strokeWidth={2.5} />
        ) : (
          <Eye size={20} strokeWidth={2.5} />
        )}
      </button>
    )}
  </div>
);

export default function AuthPage({ setIsLoggedIn, setUserRole }) {
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
  const [showPassword, setShowPassword] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("ck_remember_user");
    if (savedUser) {
      setFormData((prev) => ({ ...prev, username: savedUser }));
      setRememberMe(true);
    }

    const token = localStorage.getItem("ck_token");
    const role = localStorage.getItem("ck_role");

    if (token && role && role.toUpperCase() === "ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  // 2. 前端驗證邏輯
  const validateForm = () => {
    if (!isLogin) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return "INVALID EMAIL FORMAT";

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
      if (!passwordRegex.test(formData.password))
        return "PASSWORD TOO WEAK (8+ chars, Upper & Lower case)";

      if (formData.password !== confirmPassword)
        return "PASSWORDS DO NOT MATCH!";
    }
    return null;
  };

  // 3. 處理 登入/註冊
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (response.ok) {
        if (isLogin) {
          if (rememberMe)
            localStorage.setItem("ck_remember_user", formData.username);
          else localStorage.removeItem("ck_remember_user");

          localStorage.setItem("ck_token", data.token);
          localStorage.setItem("ck_role", data.role);
          localStorage.setItem("ck_user_id", data.id);
          localStorage.setItem("ck_email", data.email);

          setIsExiting(true);

          setTimeout(() => {
            setIsLoggedIn(true);
            setUserRole(data.role);
            data.role === "ADMIN"
              ? navigate("/admin", { replace: true })
              : navigate("/", { replace: true });
          }, 500);
        } else {
          alert("Registration Success!");
          setIsLogin(true);
        }
      } else {
        const errorMessages = {
          USERNAME_ALREADY_EXISTS: "Username taken!",
          EMAIL_ALREADY_REGISTERED: "Email in use!",
          INVALID_CREDENTIALS: "Wrong username/email or password.",
        };
        setError(
          errorMessages[data] ||
            (typeof data === "string" ? data : "AUTH_FAILED"),
        );
      }
    } catch (err) {
      setError("Server Error! Backend might be down.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 處理 忘記密碼
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
      setIsLoading(false);
    }
  };

  // 💡 提取共用的按鈕樣式
  const primaryBtnClass =
    "w-full bg-black text-white py-5 rounded-full font-black uppercase flex items-center justify-center gap-2 mt-4 hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50";

  // --- 5. 渲染 ---
  return (
    <div
      className={`min-h-[80vh] flex items-center justify-center p-6 transition-all duration-500 ${
        isExiting ? "opacity-0 scale-90 blur-sm" : "opacity-100 scale-100"
      }`}
    >
      <div className="w-full max-w-[420px] bg-white border border-gray-100 p-12 rounded-[45px] shadow-2xl transition-all">
        <h2 className="text-4xl font-black italic uppercase mb-10 text-center tracking-tighter">
          {isForgotPassword ? "Reset" : isLogin ? "Sign In" : "Register"}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-[10px] font-bold text-center uppercase tracking-widest border border-red-100 animate-pulse">
            {error}
          </div>
        )}

        {isForgotPassword ? (
          /* 忘記密碼表單 */
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            {step === 1 ? (
              <AuthInput
                type="email"
                placeholder="EMAIL"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            ) : (
              <>
                <AuthInput
                  type="text"
                  placeholder="6-DIGIT OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <AuthInput
                  type="password"
                  placeholder="NEW PASSWORD"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <AuthInput
                  type="password"
                  placeholder="CONFIRM NEW PASSWORD"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </>
            )}
            <button disabled={isLoading} className={primaryBtnClass}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : step === 1 ? (
                "Send Code"
              ) : (
                "Reset"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setStep(1);
                setError("");
              }}
              className="w-full mt-4 text-[10px] font-black uppercase text-gray-400"
            >
              Back
            </button>
          </form>
        ) : (
          /* 登入/註冊表單 */
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              type="text"
              placeholder={isLogin ? "USERNAME OR EMAIL" : "USERNAME"}
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
            {!isLogin && (
              <AuthInput
                type="email"
                placeholder="EMAIL"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            )}
            <AuthInput
              type="password"
              placeholder="PASSWORD"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              isPasswordField={true} // 👈 告訴組件這是密碼框
              showPassword={showPassword} // 👈 傳入狀態
              setShowPassword={setShowPassword} // 👈 傳入修改狀態的函數
            />
            {!isLogin && (
              <AuthInput
                type="password"
                placeholder="CONFIRM PASSWORD"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isPasswordField={true}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}

            <button disabled={isLoading} className={primaryBtnClass}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                "Login"
              ) : (
                "Register Now"
              )}
            </button>

            {isLogin && (
              <div className="flex items-center justify-between mt-6 px-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <div
                    className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-colors ${rememberMe ? "bg-black border-black text-white" : "border-gray-200 group-hover:border-black"}`}
                  >
                    {rememberMe && <span className="text-[10px]">✓</span>}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">
                    Remember
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError("");
                  }}
                  className="text-[10px] font-black text-gray-400 uppercase hover:text-black transition-colors"
                >
                  Forgot?
                </button>
              </div>
            )}
          </form>
        )}

        {!isForgotPassword && (
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="w-full mt-10 text-gray-400 text-[10px] font-black uppercase underline underline-offset-8 hover:text-black transition-colors"
          >
            {isLogin ? "Need account? Sign Up" : "Member? Sign In"}
          </button>
        )}
      </div>
    </div>
  );
}
