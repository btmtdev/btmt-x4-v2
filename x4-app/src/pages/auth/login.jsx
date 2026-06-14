import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth";



export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) {
      toast.warning(t("USERNAME_REQUIRED"));
      return;
    }
    if (!password) {
      toast.warning(t("PASSWORD_REQUIRED"));
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      const u = data.user;
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        key: u.key,
        auth_mode: u.auth_mode,
        display_name_th: u.display_name_th,
        display_name_en: u.display_name_en,
        ad_username: u.ad_username,
      }));
      navigate("/");
    } catch (err) {
      const msg = t(`ERROR.${err.code}`, "");
      toast.error(msg || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h1 className="text-xl font-semibold mb-1">{t("SIGN_IN")}</h1>
        <p className="text-xs text-muted-foreground mb-4">
          {t("SIGN_IN_DESC")}
        </p>
        <Input
          type="text"
          placeholder={t("USERNAME")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <Input
          type="password"
          placeholder={t("PASSWORD")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <svg className="animate-spin size-4 mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
          {loading ? t("SIGNING_IN") : t("SIGN_IN")}
        </Button>
        <div className="text-center pt-1">
          <Link
            to="/auth/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            {t("FORGOT_PASSWORD")}
          </Link>
        </div>
      </form>
    </div>
  );
}
