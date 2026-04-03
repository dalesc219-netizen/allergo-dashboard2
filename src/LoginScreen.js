import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const LoginScreen = ({ isLocked, onUnlock }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === "996633") {
      onUnlock("admin");
    } else if (password === "885522") {
      onUnlock("editor");
    } else if (password === "774411") {
      onUnlock("viewer");
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className={`login-overlay${!isLocked ? " hidden" : ""}${error ? " shake" : ""}`} style={{ zIndex: 9999 }}>
      <div className="login-card">
        <ShieldCheck size={56} style={{ color: "var(--accent)", marginBottom: 15 }} />
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Доступ закрыт</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Введите пароль для просмотра данных</p>
        <input
          type="password" className="password-input" placeholder="••••••" inputMode="numeric" maxLength={6}
          value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus
        />
        <div className={`error-text${error ? " show" : ""}`}>Извините, неверный пароль 😔</div>
        <button className="login-btn" onClick={handleLogin}>Войти</button>
      </div>
    </div>
  );
};

export default LoginScreen;