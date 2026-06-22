import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth";

function StepWizard({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i + 1 <= current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 flex-1 ${i + 1 < current ? "bg-primary" : "bg-muted"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MobileInput({ value, onChange, placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 6)
      formatted = raw.slice(0, 3) + "-" + raw.slice(3);
    else if (raw.length > 6)
      formatted = raw.slice(0, 3) + "-" + raw.slice(3, 6) + "-" + raw.slice(6);
    onChange(raw, formatted);
  }

  return (
    <Input
      ref={ref}
      type="tel"
      placeholder={placeholder}
      required
      value={value}
      onChange={handleChange}
    />
  );
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [mobileMasked, setMobileMasked] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [mobileFormatted, setMobileFormatted] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerifyUsername(e) {
    e.preventDefault();
    if (!username.trim()) {
      toast.warning(t("USERNAME_REQUIRED"));
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyUsername(username);
      setMobileMasked(res.mobile_masked);
      setStep(2);
    } catch (err) {
      toast.error(t(`ERROR.${err.code}`, "") || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMobile(e) {
    e.preventDefault();
    if (!mobileNo || mobileNo.length < 10) {
      toast.warning(t("MOBILE_REQUIRED"));
      return;
    }
    setLoading(true);
    try {
      await authService.verifyMobile(username, mobileNo);
      setStep(3);
    } catch (err) {
      toast.error(t(`ERROR.${err.code}`, "") || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!newPassword) {
      toast.warning(t("PASSWORD_REQUIRED"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning(t("PASSWORD_MISMATCH"));
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(username, mobileNo, newPassword);
      setStep(4);
    } catch (err) {
      toast.error(t(`ERROR.${err.code}`, "") || err.message);
    } finally {
      setLoading(false);
    }
  }

  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (step !== 4) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timeout = setTimeout(() => navigate("/auth/login"), 5000);
    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [step, navigate]);

  if (step === 4)
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">{t("PASSWORD_RESET_SUCCESS")}</h2>
        <p className="text-sm text-muted-foreground mb-10">
          {t("REDIRECT_COUNTDOWN", { sec: countdown })}
        </p>
        <Link to="/auth/login">
          <Button className="w-full">{t("BACK_TO_LOGIN")}</Button>
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("FORGOT_PASSWORD_TITLE")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("FORGOT_PASSWORD_DESC")}
      </p>

      <StepWizard current={step} total={3} />

      {step === 1 && (
        <form onSubmit={handleVerifyUsername} className="space-y-3">
          <Input
            type="text"
            placeholder={t("USERNAME")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("PROCESSING") : t("NEXT")}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyMobile} className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("MOBILE_HINT")}</p>
          <MobileInput
            placeholder={`0XX-XXX-${mobileMasked.slice(-4)}`}
            value={mobileFormatted}
            onChange={(raw, fmt) => {
              setMobileNo(raw);
              setMobileFormatted(fmt);
            }}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("PROCESSING") : t("NEXT")}
          </Button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleReset} className="space-y-3">
          <Input
            type="password"
            placeholder={t("NEW_PASSWORD")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoFocus
          />
          <Input
            type="password"
            placeholder={t("CONFIRM_PASSWORD")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("PROCESSING") : t("RESET_PASSWORD")}
          </Button>
        </form>
      )}

      <div className="text-center">
        <Link to="/auth/login" className="text-sm text-primary hover:underline">
          {t("BACK_TO_LOGIN")}
        </Link>
      </div>
    </div>
  );
}
