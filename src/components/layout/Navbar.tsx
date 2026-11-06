"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  User,
  TrendingDown,
  Menu,
  X,
  BriefcaseBusiness,
  Plane,
  Compass,
  LogOut,
} from "lucide-react";
import styles from "@/styles/Navbar.module.css";
import { useAuth } from "@/hooks/useAuth";

// Links visiveis apenas para visitantes publicos
const publicLinks = [
  { href: "/", label: "Descobrir", icon: Compass },
  { href: "/vitrine", label: "Vitrine", badge: "Exemplo", icon: Sparkles },
  { href: "/radar", label: "Radar", icon: TrendingDown },
];

// Links visiveis quando a pessoa esta logada
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
  const { user, loading, signIn, signOut } = useAuth();

  const isLoggedIn = Boolean(user);
  const meta = user?.user_metadata || {};
  const userName =
    meta.full_name || meta.name || user?.email?.split("@")[0] || "Usuario";
  const userAvatar = (meta.avatar_url || meta.picture || null) as string | null;

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
        <Link href="/" className={styles.logo} aria-label="GarimpaTrip Inicio">
          <span className={styles.logoIcon}>
            <Compass size={22} strokeWidth={2.4} />
          </span>
          <span className={styles.logoText}>
            Garimpa<span className={styles.logoHighlight}>Trip</span>
          </span>
        </Link>

        {/* NAVEGACAO CENTRAL (DESKTOP) */}
        <nav className={styles.desktopNav} aria-label="Navegacao principal">
          {navLinks.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}>
                {Icon && (
                  <Icon
                    className={styles.linkIcon}
                    size={16}
                    aria-hidden="true"
                  />
                )}
                <span>{label}</span>
                {badge && <span className={styles.badge}>{badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* ACOES DIREITA (DESKTOP) */}
        <div className={styles.actions}>
          {!isLoggedIn ? (
            <button
              type="button"
              className={styles.loginBtn}
              onClick={signIn}
              disabled={loading}
              title="Entrar com sua conta Google">
              <User size={16} aria-hidden="true" />
              <span>{loading ? "Conectando..." : "Entrar com Google"}</span>
            </button>
          ) : (
            <div className={styles.userArea}>
              <div
                className={styles.userBadge}
                title={`Conectado como: ${userName}`}>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className={styles.userAvatar}
                  />
                ) : (
                  <span className={styles.userAvatar}>
                    {getInitials(userName)}
                  </span>
                )}
                <span className={styles.userName}>{userName}</span>
              </div>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={signOut}
                disabled={loading}
                title="Desconectar do GarimpaTrip">
                <LogOut size={15} aria-hidden="true" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        {/* BOTAO MOBILE */}
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* PAINEL MOBILE */}
      {menuOpen && (
        <div className={styles.mobilePanel}>
          <nav className={styles.mobileNav} aria-label="Navegacao mobile">
            <div className={styles.modeIndicator}>
              Status:{" "}
              <strong>
                {isLoggedIn
                  ? `Logado como ${userName}`
                  : "Visitante (Sem login)"}
              </strong>
            </div>

            {navLinks.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}>
                <div className={styles.mobileLinkContent}>
                  {Icon && <Icon size={18} className={styles.linkIcon} />}
                  <span>{label}</span>
                </div>
                {badge && <span className={styles.badge}>{badge}</span>}
              </Link>
            ))}

            <div className={styles.mobileDivider} />

            <div className={styles.mobileActions}>
              {!isLoggedIn ? (
                <button
                  type="button"
                  className={styles.loginBtn}
                  onClick={() => {
                    signIn();
                    setMenuOpen(false);
                  }}
                  disabled={loading}>
                  <User size={16} />{" "}
                  <span>{loading ? "Conectando..." : "Entrar com Google"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.loginBtn}
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  disabled={loading}>
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
