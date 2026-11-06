"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  User, 
  Globe, 
  TrendingDown, 
  Menu, 
  X, 
  BriefcaseBusiness, 
  Plane, 
  Compass, 
  LogOut 
} from "lucide-react";
import styles from "@/styles/Navbar.module.css";
import { supabase } from "@/lib/supabaseClient";

// Links visíveis apenas para visitantes públicos
const publicLinks = [
  { href: "/", label: "Descobrir", icon: Compass },
  { href: "/vitrine", label: "Vitrine", badge: "Exemplo", icon: Sparkles },
  { href: "/radar", label: "Radar", icon: TrendingDown },
];

// Links visíveis quando a pessoa está logada
const authenticatedLinks = [
  { href: "/", label: "Descobrir", icon: Compass },
  { href: "/vitrine", label: "Vitrine", badge: "Exemplo", icon: Sparkles },
  { href: "/package", label: "Meu Pacote", icon: BriefcaseBusiness },
  { href: "/my-trips", label: "Minhas Viagens", icon: Plane },
  { href: "/radar", label: "Radar", icon: TrendingDown },
];

export const Navbar = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Estado real do Supabase
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Verifica sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const meta = session.user.user_metadata || {};
        setUserName(meta.full_name || meta.name || session.user.email?.split("@")[0] || "Usuário");
        setUserAvatar(meta.avatar_url || meta.picture || null);
      } else {
        setIsLoggedIn(false);
        setUserName("");
        setUserAvatar(null);
      }
    });

    // 2. Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const meta = session.user.user_metadata || {};
        setUserName(meta.full_name || meta.name || session.user.email?.split("@")[0] || "Usuário");
        setUserAvatar(meta.avatar_url || meta.picture || null);
      } else {
        setIsLoggedIn(false);
        setUserName("");
        setUserAvatar(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginGoogle = () => {
    setLoading(true);
    const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    window.location.href = `/api/auth/login/google?next=${encodeURIComponent(next)}`;
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserName("");
      setUserAvatar(null);
    } catch (err: any) {
      alert("Erro ao sair: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const navLinks = isLoggedIn ? authenticatedLinks : publicLinks;

  const getInitials = (name: string) => {
    if (!name) return "GT";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* LOGO */}
        <Link href="/" className={styles.logo} aria-label="GarimpaTrip Início">
          <span className={styles.logoIcon}>
            <Compass size={22} strokeWidth={2.4} />
          </span>
          <span className={styles.logoText}>
            Garimpa<span className={styles.logoHighlight}>Trip</span>
          </span>
        </Link>

        {/* NAVEGAÇÃO CENTRAL (DESKTOP) */}
        <nav className={styles.desktopNav} aria-label="Navegação principal">
          {navLinks.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href;
            return (
              <Link 
                key={href} 
                href={href} 
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {Icon && <Icon className={styles.linkIcon} size={16} aria-hidden="true" />}
                <span>{label}</span>
                {badge && <span className={styles.badge}>{badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* AÇÕES DIREITA (DESKTOP) */}
        <div className={styles.actions}>
          <button type="button" className={styles.langBtn} aria-label="Idioma: português do Brasil">
            <Globe size={15} aria-hidden="true" />
            <span>PT-BR</span>
          </button>

          {!isLoggedIn ? (
            <button 
              type="button" 
              className={styles.loginBtn}
              onClick={handleLoginGoogle}
              disabled={loading}
              title="Entrar com sua conta Google"
            >
              <User size={16} aria-hidden="true" />
              <span>{loading ? "Conectando..." : "Entrar com Google"}</span>
            </button>
          ) : (
            <div className={styles.userArea}>
              <div className={styles.userBadge} title={`Conectado como: ${userName}`}>
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className={styles.userAvatar} />
                ) : (
                  <span className={styles.userAvatar}>{getInitials(userName)}</span>
                )}
                <span className={styles.userName}>{userName}</span>
              </div>
              <button 
                type="button" 
                className={styles.logoutBtn} 
                onClick={handleLogout}
                disabled={loading}
                title="Desconectar do GarimpaTrip"
              >
                <LogOut size={15} aria-hidden="true" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* BOTÃO MOBILE */}
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* PAINEL MOBILE */}
      {menuOpen && (
        <div className={styles.mobilePanel}>
          <nav className={styles.mobileNav} aria-label="Navegação mobile">
            <div className={styles.modeIndicator}>
              Status: <strong>{isLoggedIn ? `Logado como ${userName}` : "Visitante (Sem login)"}</strong>
            </div>

            {navLinks.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                <div className={styles.mobileLinkContent}>
                  {Icon && <Icon size={18} className={styles.linkIcon} />}
                  <span>{label}</span>
                </div>
                {badge && <span className={styles.badge}>{badge}</span>}
              </Link>
            ))}

            <div className={styles.mobileDivider} />

            <div className={styles.mobileActions}>
              <button type="button" className={styles.langBtn}>
                <Globe size={16} /> <span>PT-BR</span>
              </button>

              {!isLoggedIn ? (
                <button 
                  type="button" 
                  className={styles.loginBtn}
                  onClick={() => {
                    handleLoginGoogle();
                    setMenuOpen(false);
                  }}
                  disabled={loading}
                >
                  <User size={16} /> <span>{loading ? "Conectando..." : "Entrar com Google"}</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  className={styles.loginBtn}
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  disabled={loading}
                >
                  <LogOut size={16} /> <span>Sair ({userName})</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
