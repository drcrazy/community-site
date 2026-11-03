import type { Locale } from "../../lib/i18n/locales";

export type BenbenLabels = {
  title: string;
  greeting: string;
  lede: string;
  feed: string;
  polish: string;
  play: string;
  rest: string;
  fed: string;
  happy: string;
  polished: string;
  rested: string;
  actionsLeft: string;
  noActions: string;
  phoenixVisit: string;
  streak: string;
  days: string;
  careCount: string;
  share: string;
  copied: string;
  empty: string;
  unavailable: string;
  signIn: string;
};

const LABELS: Record<Locale, BenbenLabels> = {
  en: {
    title: "Benben",
    greeting: "Our communal pyramid",
    lede: "Look after Alexandria’s tiny stone pyramid together. Benben’s mood belongs to the whole community.",
    feed: "Feed", polish: "Polish", play: "Sunbathe", rest: "Rest",
    fed: "Fed", happy: "Happy", polished: "Polished", rested: "Rested",
    actionsLeft: "{count} actions left today",
    noActions: "You have used today’s three actions. Benben will see you tomorrow!",
    phoenixVisit: "A phoenix is visiting Benben for the day!",
    streak: "Community streak", days: "days", careCount: "acts of care",
    share: "Share today", copied: "Copied for Discord!",
    empty: "Nobody has visited yet. Benben is waiting patiently.",
    unavailable: "Benben is unavailable right now.",
    signIn: "Sign in",
  },
  de: {
    title: "Benben",
    greeting: "Unsere gemeinsame Pyramide",
    lede: "Kümmert euch gemeinsam um Alexandrias kleine Steinpyramide. Benbens Stimmung gehört der ganzen Gemeinschaft.",
    feed: "Füttern", polish: "Polieren", play: "Sonnenbad", rest: "Ausruhen",
    fed: "Satt", happy: "Fröhlich", polished: "Poliert", rested: "Ausgeruht",
    actionsLeft: "Heute noch {count} Aktionen",
    noActions: "Du hast deine drei Aktionen heute verwendet. Benben sieht dich morgen!",
    phoenixVisit: "Ein Phönix besucht Benben für einen Tag!",
    streak: "Gemeinschaftsserie", days: "Tage", careCount: "Pflegeaktionen",
    share: "Heute teilen", copied: "Für Discord kopiert!",
    empty: "Heute war noch niemand da. Benben wartet geduldig.",
    unavailable: "Benben ist gerade nicht erreichbar.",
    signIn: "Anmelden",
  },
  fr: {
    title: "Benben",
    greeting: "Notre pyramide commune",
    lede: "Prenez soin ensemble de la petite pyramide de pierre d’Alexandria. L’humeur de Benben appartient à toute la communauté.",
    feed: "Nourrir", polish: "Polir", play: "Bain de soleil", rest: "Reposer",
    fed: "Rassasié", happy: "Heureux", polished: "Poli", rested: "Reposé",
    actionsLeft: "Encore {count} actions aujourd’hui",
    noActions: "Vous avez utilisé vos trois actions. Benben vous reverra demain !",
    phoenixVisit: "Un phénix rend visite à Benben pour la journée !",
    streak: "Série communautaire", days: "jours", careCount: "gestes attentionnés",
    share: "Partager aujourd’hui", copied: "Copié pour Discord !",
    empty: "Personne n’est encore venu aujourd’hui. Benben attend patiemment.",
    unavailable: "Benben n’est pas disponible pour le moment.",
    signIn: "Se connecter",
  },
  ru: {
    title: "Бенбен",
    greeting: "Наша общая пирамида",
    lede: "Заботьтесь вместе о крошечной каменной пирамиде Александрии. Настроение Бенбена зависит от всего сообщества.",
    feed: "Покормить", polish: "Отполировать", play: "Позагорать", rest: "Отдохнуть",
    fed: "Покормлен", happy: "Счастлив", polished: "Отполирован", rested: "Отдохнул",
    actionsLeft: "Действий на сегодня: {count}",
    noActions: "Сегодня вы уже использовали все три действия. Бенбен ждёт вас завтра!",
    phoenixVisit: "Сегодня к Бенбену прилетел феникс!",
    streak: "Серия дней сообщества", days: "дней", careCount: "действий заботы",
    share: "Поделиться итогом дня", copied: "Скопировано для Discord!",
    empty: "Сегодня Бенбена ещё никто не навещал. Он терпеливо ждёт.",
    unavailable: "Бенбен сейчас недоступен.",
    signIn: "Войти",
  },
  es: {
    title: "Benben",
    greeting: "Nuestra pirámide comunitaria",
    lede: "Cuidemos juntos la pequeña pirámide de piedra de Alejandría. El ánimo de Benben depende de toda la comunidad.",
    feed: "Dar de comer", polish: "Pulir", play: "Tomar el sol", rest: "Descansar",
    fed: "Alimentado", happy: "Feliz", polished: "Pulido", rested: "Descansado",
    actionsLeft: "Quedan {count} acciones para hoy",
    noActions: "Ya has usado tus tres acciones de hoy. ¡Benben te espera mañana!",
    phoenixVisit: "¡Hoy visita a Benben un fénix!",
    streak: "Racha de la comunidad", days: "días", careCount: "cuidados",
    share: "Compartir lo de hoy", copied: "¡Copiado para Discord!",
    empty: "Hoy aún no ha venido nadie. Benben espera con paciencia.",
    unavailable: "Benben no está disponible ahora mismo.",
    signIn: "Entrar",
  },
};

export function benbenLabels(locale: Locale) {
  return LABELS[locale];
}

export function fillBenben(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
