"use client";

import { ChevronDown, LogOut, Tags, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./ProfileMenu.module.css";

type ProfileMenuProps = {
  displayName: string;
  avatarUrl: string | null;
  email?: string;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
};

function Avatar({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <span className={styles.avatar}>
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" width={36} height={36} sizes="36px" className={styles.avatarImage} />
      ) : <UserRound size={18} aria-hidden="true" />}
    </span>
  );
}

export function ProfileMenu({ displayName, avatarUrl, email, isSigningOut, onSignOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const initialFocus = useRef<"first" | "last">("first");
  const id = useId();

  function closeAndFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)');
    const index = initialFocus.current === "last" ? (items?.length ?? 1) - 1 : 0;
    items?.[index]?.focus();

    function onOutside(event: PointerEvent | FocusEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown": next = (index + 1) % items.length; break;
      case "ArrowUp": next = (index - 1 + items.length) % items.length; break;
      case "Home": next = 0; break;
      case "End": next = items.length - 1; break;
      case "Tab": closeAndFocus(); return;
      case " ":
        event.preventDefault();
        items[index]?.click();
        return;
      default: return;
    }
    event.preventDefault();
    items[next]?.focus();
  }

  return (
    <div ref={rootRef} className={`market-account ${styles.root}`}>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className={`market-profile ${styles.trigger}`}
        aria-label={`Menu da conta: ${displayName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? `${id}-menu` : undefined}
        title={email}
        onClick={() => { initialFocus.current = "first"; setOpen(!open); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            initialFocus.current = event.key === "ArrowUp" ? "last" : "first";
            setOpen(true);
          }
        }}
      >
        <Avatar avatarUrl={avatarUrl} />
        <span className="market-profile-name">{displayName}</span>
        <ChevronDown size={14} aria-hidden="true" className={styles.chevron} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.identity}>
            <Avatar avatarUrl={avatarUrl} />
            <span>{displayName}</span>
          </div>
          <div ref={menuRef} id={`${id}-menu`} role="menu" aria-labelledby={`${id}-trigger`} onKeyDown={onMenuKeyDown} className={styles.menu}>
            <Link href="/perfil" role="menuitem" tabIndex={-1} onClick={closeAndFocus} className={styles.item}>
              <UserRound size={16} aria-hidden="true" />Meu perfil
            </Link>
            <Link href="/meus-anuncios" role="menuitem" tabIndex={-1} onClick={closeAndFocus} className={styles.item}>
              <Tags size={16} aria-hidden="true" />Meus anúncios
            </Link>
            <button type="button" role="menuitem" tabIndex={-1} disabled={isSigningOut} onClick={() => { closeAndFocus(); void onSignOut(); }} className={styles.item}>
              <LogOut size={16} aria-hidden="true" />{isSigningOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
