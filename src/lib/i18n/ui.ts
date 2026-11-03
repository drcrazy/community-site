import type { Locale } from "./locales";

type Dict = {
  news: string;
  guides: string;
  events: string;
  calculators: string;
  signIn: string;
  signOut: string;
  register: string;
  username: string;
  password: string;
  createAccount: string;
  haveAccount: string;
  discordUnavailable: string;
  backToNews: string;
  overview: string;
  assumptions: string;
  calculatorsEyebrow: string;
  calculatorsLede: string;
  newsEyebrow: string;
  newsLede: string;
  newsEmpty: string;
  eventsEyebrow: string;
  eventsLede: string;
  eventsSearchLabel: string;
  eventsSearchPlaceholder: string;
  eventsStatEntries: string;
  eventsNoMatch: string;
  eventsEmpty: string;
  premiumUnlockHint: string;
  latestNews: string;
  allNews: string;
  readMore: string;
  newsPrevious: string;
  newsNext: string;
  newsPosition: string;
  siteEyebrow: string;
  statTools: string;
  statGuides: string;
  statEvents: string;
  premiumBadge: string;
  premiumTitle: string;
  premiumLede: string;
  premiumPerkTools: string;
  premiumPerkGuild: string;
  premiumPerkSupport: string;
  premiumLearnMore: string;
  buyPremium: string;
};

const en: Dict = {
  news: "News",
  guides: "Guides",
  events: "Events",
  calculators: "Calculators",
  signIn: "Sign in",
  signOut: "Sign out",
  register: "Create account",
  username: "Username",
  password: "Password",
  createAccount: "Create an account",
  haveAccount: "Already have an account? Sign in",
  discordUnavailable: "Discord sign-in is not available yet.",
  backToNews: "Back to News",
  overview: "Overview",
  assumptions: "Assumptions",
  calculatorsEyebrow: "Numbers in, answer out",
  calculatorsLede: "Enter your numbers, get the answer, and see which assumption produced it.",
  newsEyebrow: "Changes and additions",
  newsLede: "What changed on this site, and what was added.",
  newsEmpty: "No entries yet.",
  eventsEyebrow: "Event guides and tips",
  eventsLede: "Write-ups for limited-time events — separate from the systems covered under Guides.",
  eventsSearchLabel: "Search events",
  eventsSearchPlaceholder: "Red Carpet, Grand Voyage…",
  eventsStatEntries: "Entries",
  eventsNoMatch: "No event guide matches that search.",
  eventsEmpty: "No event guides yet.",
  premiumUnlockHint: "tap to unlock",
  latestNews: "Latest news",
  allNews: "All news",
  readMore: "Read",
  newsPrevious: "Previous entry",
  newsNext: "Next entry",
  newsPosition: "Entry {n} of {total}",
  siteEyebrow: "LoA Alexandria",
  statTools: "Tools",
  statGuides: "Guides",
  statEvents: "Events",
  premiumBadge: "Premium",
  premiumTitle: "Go Premium",
  premiumLede:
    "Unlock selected calculators and simulations, and create one guild while Premium is active. It is created as soon as you submit. ${price} for {days} days — and you help keep LoA Alexandria running.",
  premiumPerkTools: "Premium calculators and simulations",
  premiumPerkGuild: "Create one guild instantly while Premium is active",
  premiumPerkSupport: "Direct support for this community site",
  premiumLearnMore: "See what's included",
  buyPremium: "Buy Premium — ${price}",
};

const dictionaries: Record<Locale, Dict> = {
  en,
  de: {
    ...en,
    news: "News",
    guides: "Guides",
    events: "Events",
    calculators: "Rechner",
    signIn: "Anmelden",
    signOut: "Abmelden",
    register: "Konto erstellen",
    username: "Benutzername",
    password: "Passwort",
    createAccount: "Konto erstellen",
    haveAccount: "Schon ein Konto? Anmelden",
    discordUnavailable: "Discord-Anmeldung ist noch nicht verfügbar.",
    backToNews: "Zurück zu News",
    overview: "Übersicht",
    assumptions: "Annahmen",
    calculatorsEyebrow: "Zahlen rein, Antwort raus",
    calculatorsLede: "Gib deine Zahlen ein, hol dir die Antwort und sieh, welche Annahme dahintersteht.",
    newsEyebrow: "Änderungen und Neues",
    newsLede: "Was sich auf dieser Seite geändert hat und was dazugekommen ist.",
    newsEmpty: "Noch keine Einträge.",
    eventsEyebrow: "Event-Guides und Tipps",
    eventsLede: "Texte zu zeitlich begrenzten Events — getrennt von den Systemen unter Guides.",
    eventsSearchLabel: "Events suchen",
    eventsSearchPlaceholder: "Red Carpet, Grand Voyage…",
    eventsStatEntries: "Einträge",
    eventsNoMatch: "Kein Event-Guide passt zu dieser Suche.",
    eventsEmpty: "Noch keine Event-Guides.",
    premiumUnlockHint: "tippen zum Freischalten",
    latestNews: "Neueste News",
    allNews: "Alle News",
    readMore: "Lesen",
    newsPrevious: "Vorheriger Eintrag",
    newsNext: "Nächster Eintrag",
    newsPosition: "Eintrag {n} von {total}",
    siteEyebrow: "LoA Alexandria",
    statTools: "Werkzeuge",
    statGuides: "Guides",
    statEvents: "Events",
    premiumBadge: "Premium",
    premiumTitle: "Premium holen",
    premiumLede:
      "Schalte ausgewählte Rechner und Simulationen frei und erstelle eine Gilde, solange Premium aktiv ist. Sie wird direkt nach dem Absenden angelegt. {price} $ für {days} Tage — und du hilfst, LoA Alexandria am Laufen zu halten.",
    premiumPerkTools: "Premium-Rechner und Simulationen",
    premiumPerkGuild: "Eine Gilde sofort erstellen, solange Premium aktiv ist",
    premiumPerkSupport: "Direkte Unterstützung für diese Community-Seite",
    premiumLearnMore: "Was enthalten ist",
    buyPremium: "Premium kaufen — {price} $",
  },
  fr: {
    ...en,
    news: "Actualités",
    guides: "Guides",
    events: "Événements",
    calculators: "Calculateurs",
    signIn: "Connexion",
    signOut: "Déconnexion",
    register: "Créer un compte",
    username: "Nom d’utilisateur",
    password: "Mot de passe",
    createAccount: "Créer un compte",
    haveAccount: "Déjà un compte ? Connexion",
    discordUnavailable: "La connexion Discord n’est pas encore disponible.",
    backToNews: "Retour aux actualités",
    overview: "Aperçu",
    assumptions: "Hypothèses",
    calculatorsEyebrow: "Des chiffres, une réponse",
    calculatorsLede: "Entrez vos chiffres, obtenez la réponse et voyez quelle hypothèse l’a produite.",
    newsEyebrow: "Changements et ajouts",
    newsLede: "Ce qui a changé sur ce site, et ce qui a été ajouté.",
    newsEmpty: "Aucune entrée pour le moment.",
    eventsEyebrow: "Guides d’événements et conseils",
    eventsLede: "Textes pour les événements à durée limitée — séparés des systèmes sous Guides.",
    eventsSearchLabel: "Rechercher des événements",
    eventsSearchPlaceholder: "Red Carpet, Grand Voyage…",
    eventsStatEntries: "Entrées",
    eventsNoMatch: "Aucun guide d’événement ne correspond à cette recherche.",
    eventsEmpty: "Pas encore de guides d’événements.",
    premiumUnlockHint: "appuyer pour débloquer",
    latestNews: "Dernières actualités",
    allNews: "Toutes les actualités",
    readMore: "Lire",
    newsPrevious: "Entrée précédente",
    newsNext: "Entrée suivante",
    newsPosition: "Entrée {n} sur {total}",
    siteEyebrow: "LoA Alexandria",
    statTools: "Outils",
    statGuides: "Guides",
    statEvents: "Événements",
    premiumBadge: "Premium",
    premiumTitle: "Passer en Premium",
    premiumLede:
      "Débloquez des calculateurs et simulations sélectionnés, et créez une guilde tant que Premium est actif. Elle est créée dès l’envoi. {price} $ pour {days} jours — et vous aidez à faire vivre LoA Alexandria.",
    premiumPerkTools: "Calculateurs et simulations Premium",
    premiumPerkGuild: "Créer une guilde immédiatement tant que Premium est actif",
    premiumPerkSupport: "Soutien direct à ce site communautaire",
    premiumLearnMore: "Voir ce qui est inclus",
    buyPremium: "Acheter Premium — {price} $",
  },
  ru: {
    ...en,
    news: "Новости",
    guides: "Гайды",
    events: "События",
    calculators: "Калькуляторы",
    signIn: "Войти",
    signOut: "Выйти",
    register: "Создать аккаунт",
    username: "Имя пользователя",
    password: "Пароль",
    createAccount: "Создать аккаунт",
    haveAccount: "Уже есть аккаунт? Войти",
    discordUnavailable: "Вход через Discord пока недоступен.",
    backToNews: "Назад к новостям",
    overview: "Обзор",
    assumptions: "Допущения",
    calculatorsEyebrow: "Числа на входе — ответ на выходе",
    calculatorsLede: "Введите числа, получите ответ и посмотрите, какое допущение его дало.",
    newsEyebrow: "Изменения и дополнения",
    newsLede: "Что изменилось на сайте и что добавили.",
    newsEmpty: "Пока нет записей.",
    eventsEyebrow: "Гайды по событиям и советы",
    eventsLede: "Материалы по временным событиям — отдельно от систем в разделе Гайды.",
    eventsSearchLabel: "Поиск событий",
    eventsSearchPlaceholder: "Red Carpet, Grand Voyage…",
    eventsStatEntries: "Записей",
    eventsNoMatch: "Нет гайдов по событиям для этого поиска.",
    eventsEmpty: "Пока нет гайдов по событиям.",
    premiumUnlockHint: "нажмите, чтобы открыть",
    latestNews: "Последние новости",
    allNews: "Все новости",
    readMore: "Читать",
    newsPrevious: "Предыдущая запись",
    newsNext: "Следующая запись",
    newsPosition: "Запись {n} из {total}",
    siteEyebrow: "LoA Alexandria",
    statTools: "Инструменты",
    statGuides: "Гайды",
    statEvents: "События",
    premiumBadge: "Premium",
    premiumTitle: "Оформить Premium",
    premiumLede:
      "Откройте выбранные калькуляторы и симуляции и создайте одну гильдию, пока Premium активен. Она создаётся сразу после отправки. ${price} на {days} дней — и вы поддерживаете LoA Alexandria.",
    premiumPerkTools: "Premium-калькуляторы и симуляции",
    premiumPerkGuild: "Создать одну гильдию сразу, пока Premium активен",
    premiumPerkSupport: "Прямая поддержка этого сообщества",
    premiumLearnMore: "Что входит",
    buyPremium: "Купить Premium — ${price}",
  },
  es: {
    ...en,
    news: "Noticias",
    guides: "Guías",
    events: "Eventos",
    calculators: "Calculadoras",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    register: "Crear cuenta",
    username: "Usuario",
    password: "Contraseña",
    createAccount: "Crear una cuenta",
    haveAccount: "¿Ya tienes cuenta? Inicia sesión",
    discordUnavailable: "El inicio de sesión con Discord aún no está disponible.",
    backToNews: "Volver a Noticias",
    overview: "Resumen",
    assumptions: "Supuestos",
    calculatorsEyebrow: "Números dentro, respuesta fuera",
    calculatorsLede: "Introduce tus números, obtén la respuesta y mira qué supuesto la produjo.",
    newsEyebrow: "Cambios y novedades",
    newsLede: "Qué cambió en este sitio y qué se añadió.",
    newsEmpty: "Aún no hay entradas.",
    eventsEyebrow: "Guías de eventos y consejos",
    eventsLede: "Textos de eventos de tiempo limitado — separados de los sistemas en Guías.",
    eventsSearchLabel: "Buscar eventos",
    eventsSearchPlaceholder: "Red Carpet, Grand Voyage…",
    eventsStatEntries: "Entradas",
    eventsNoMatch: "Ninguna guía de evento coincide con esa búsqueda.",
    eventsEmpty: "Aún no hay guías de eventos.",
    premiumUnlockHint: "toca para desbloquear",
    latestNews: "Últimas noticias",
    allNews: "Todas las noticias",
    readMore: "Leer",
    newsPrevious: "Entrada anterior",
    newsNext: "Entrada siguiente",
    newsPosition: "Entrada {n} de {total}",
    siteEyebrow: "LoA Alexandria",
    statTools: "Herramientas",
    statGuides: "Guías",
    statEvents: "Eventos",
    premiumBadge: "Premium",
    premiumTitle: "Hazte Premium",
    premiumLede:
      "Desbloquea calculadoras y simulaciones seleccionadas, y crea un gremio mientras Premium esté activo. Se crea en cuanto envías. ${price} por {days} días — y ayudas a mantener LoA Alexandria.",
    premiumPerkTools: "Calculadoras y simulaciones Premium",
    premiumPerkGuild: "Crea un gremio al instante mientras Premium esté activo",
    premiumPerkSupport: "Apoyo directo a este sitio de la comunidad",
    premiumLearnMore: "Ver qué incluye",
    buyPremium: "Comprar Premium — ${price}",
  },
};

export type UiDict = Dict;

export function englishDictKeys(): (keyof Dict)[] {
  return Object.keys(en) as (keyof Dict)[];
}

export function ui(locale: Locale, overrides?: Partial<Record<string, string>> | null): Dict {
  const base = { ...(dictionaries[locale] ?? dictionaries.en) };
  if (!overrides || locale === "en") return base;
  for (const key of englishDictKeys()) {
    const value = overrides[key];
    if (typeof value === "string" && value.trim()) {
      (base as Record<string, string>)[key] = value;
    }
  }
  return base;
}

export async function loadUiOverrides(db: D1Database, locale: Locale) {
  if (locale === "en") return null;
  const { results } = await db
    .prepare("SELECT key, value FROM interface_strings WHERE locale = ?")
    .bind(locale)
    .all<{ key: string; value: string }>();
  if (!results?.length) return null;
  return Object.fromEntries(results.map((row) => [row.key, row.value])) as Partial<Record<string, string>>;
}

export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
