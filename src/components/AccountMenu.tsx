import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { Locale } from "../lib/i18n/locales";

type Caps = {
  canPrepare: boolean;
  canTranslate: boolean;
  canAdmin: boolean;
};

type Labels = {
  signIn: string;
  signOut: string;
  accountMenu: string;
  buyPremium: string;
  contentBuilder: string;
  interfaceStrings: string;
  admin: string;
  benben: string;
};

type Hrefs = {
  signIn: string;
  premium: string;
  contentBuilder: string;
  interfaceStrings: string;
  admin: string;
  benben: string;
};

function ChevronIcon() {
  return (
    <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8 10l4 4 4-4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13 7l3 3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3 5 6v5c0 5 3.2 8.4 7 10 3.8-1.6 7-5 7-10V6l-7-3z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="m12 3.6 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.5l.9-5.4-3.9-3.8 5.4-.8z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function BenbenIcon() {
  return (
    <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3.5 20 8.5-16 8.5 16z" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M6.2 15h11.6M8.8 10h6.4" fill="none" stroke="currentColor" stroke-width="1.6" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg class="icon icon-sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 5h14v14H5zM8 9h8M8 12h8M8 15h5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  );
}

function capsFromMember(member: PublicMember | null | undefined): Caps {
  if (!member) return { canPrepare: false, canTranslate: false, canAdmin: false };
  return {
    canPrepare: member.siteRank === "editor" || member.siteRank === "admin",
    canTranslate: member.siteRank === "admin" || member.languages.length > 0,
    canAdmin: member.siteRank === "admin",
  };
}

export function AccountMenu({
  locale: _locale,
  displayName,
  caps,
  labels,
  hrefs,
}: {
  locale: Locale;
  displayName: string | null;
  caps: Caps;
  labels: Labels;
  hrefs: Hrefs;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(displayName);
  const [effectiveCaps, setEffectiveCaps] = useState(caps);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/auth/me/")
      .then((res) => res.json() as Promise<{ member?: PublicMember | null }>)
      .then((data) => {
        const member = data.member;
        if (!member) {
          setName(null);
          setEffectiveCaps({ canPrepare: false, canTranslate: false, canAdmin: false });
          return;
        }
        setName(member.displayName || member.username);
        setEffectiveCaps(capsFromMember(member));
      })
      .catch(() => {
        /* keep SSR chrome */
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!name) {
    return (
      <div class="lang topbar-account" ref={root}>
        <a class="topbar-sign-in" href={hrefs.signIn}>
          {labels.signIn}
        </a>
      </div>
    );
  }

  const actions = [
    effectiveCaps.canPrepare || effectiveCaps.canTranslate
      ? { href: hrefs.contentBuilder, label: labels.contentBuilder, icon: <PenIcon /> }
      : null,
    effectiveCaps.canTranslate
      ? { href: hrefs.interfaceStrings, label: labels.interfaceStrings, icon: <TextIcon /> }
      : null,
    effectiveCaps.canAdmin ? { href: hrefs.admin, label: labels.admin, icon: <ShieldIcon /> } : null,
    { href: hrefs.benben, label: labels.benben, icon: <BenbenIcon /> },
  ].filter((action): action is { href: string; label: string; icon: ComponentChildren } => action !== null);

  return (
    <div class="lang topbar-account" ref={root}>
      <button
        type="button"
        class={open ? "topbar-account-trigger is-open" : "topbar-account-trigger"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.accountMenu}
        title={labels.accountMenu}
        onClick={() => setOpen((value) => !value)}
      >
        <span class="topbar-account-name">{name}</span>
        <ChevronIcon />
      </button>
      {open ? (
        <ul class="menu-pop" role="menu" aria-label={labels.accountMenu}>
          <li>
            <a class="lang-option" href={hrefs.premium} role="menuitem" onClick={() => setOpen(false)}>
              <StarIcon />
              <span>{labels.buyPremium}</span>
            </a>
          </li>
          {actions.map((action) => (
            <li key={action.href}>
              <a class="lang-option" href={action.href} role="menuitem" onClick={() => setOpen(false)}>
                {action.icon}
                <span>{action.label}</span>
              </a>
            </li>
          ))}
          <li class="menu-sep" role="separator" />
          <li>
            <form method="post" action="/api/auth/sign-out/">
              <button type="submit" class="lang-option" role="menuitem">
                {labels.signOut}
              </button>
            </form>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
