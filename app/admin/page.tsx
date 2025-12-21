"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MATCHES } from "../data/matches";
import { MEMBERS } from "../data/members";
import type { Match, MatchEvent, Member } from "../utils/types";

type EventFormKind =
  | "start"
  | "end"
  | "goal"
  | "noGoal"
  | "goalReceived"
  | "save"
  | "card"
  | "hug"
  | "exultation"
  | "oneShotBeer";

type SelectOption = {
  value: string;
  label: string;
};

type EventField =
  | { name: "member"; type: "member"; label: string }
  | { name: "from"; type: "select"; label: string; options: SelectOption[] }
  | { name: "cardType"; type: "select"; label: string; options: SelectOption[] }
  | { name: "when"; type: "datetime"; label: string; helper?: string };

type FormValues = Partial<Record<string, string>>;

type EventBuildResult =
  | { ok: true; event: Record<string, unknown> }
  | { ok: false; error: string };

const GOAL_FROM_OPTIONS: SelectOption[] = [
  { value: "activePlay", label: "Azione" },
  { value: "penalty", label: "Rigore" },
  { value: "shotout", label: "Shotout" },
  { value: "ownGoal", label: "Autogol" },
  { value: "double", label: "Goal doppio" },
];

const SHOOTOUT_OPTIONS: SelectOption[] = [
  { value: "penalty", label: "Rigore" },
  { value: "shotout", label: "Shotout" },
];

const CARD_OPTIONS: SelectOption[] = [
  { value: "yellow", label: "Giallo" },
  { value: "red", label: "Rosso" },
];

const EVENT_FORM_CONFIG: Record<
  EventFormKind,
  {
    label: string;
    description: string;
    fields: EventField[];
  }
> = {
  start: {
    label: "Calcio d'inizio",
    description: "Registra il kick-off ufficiale della gara",
    fields: [
      {
        name: "when",
        type: "datetime",
        label: "Orario",
        helper: "Lascia vuoto per usare l'orario attuale",
      },
    ],
  },
  end: {
    label: "Triplice fischio",
    description: "Chiudi la gara quando l'arbitro fischia la fine",
    fields: [
      {
        name: "when",
        type: "datetime",
        label: "Orario",
        helper: "Lascia vuoto per usare l'orario attuale",
      },
    ],
  },
  goal: {
    label: "Gol",
    description: "Anche gli autogol meritano una riga sul tabellino",
    fields: [
      { name: "member", type: "member", label: "Marcatore" },
      {
        name: "from",
        type: "select",
        label: "Origine",
        options: GOAL_FROM_OPTIONS,
      },
    ],
  },
  noGoal: {
    label: "Rigore sbagliato",
    description: "Rigori e shout-out senza gloria",
    fields: [
      { name: "member", type: "member", label: "Tiratore" },
      {
        name: "from",
        type: "select",
        label: "Situazione",
        options: SHOOTOUT_OPTIONS,
      },
    ],
  },
  goalReceived: {
    label: "Gol subìto",
    description: "Assegna il malus al portiere incolpevole",
    fields: [{ name: "member", type: "member", label: "Portiere" }],
  },
  save: {
    label: "Parata decisiva",
    description: "Quando il portiere ipnotizza dal dischetto",
    fields: [
      { name: "member", type: "member", label: "Portiere" },
      {
        name: "from",
        type: "select",
        label: "Situazione",
        options: SHOOTOUT_OPTIONS,
      },
    ],
  },
  card: {
    label: "Cartellino",
    description: "Giallo o rosso, segna il provvedimento",
    fields: [
      { name: "member", type: "member", label: "Giocatore" },
      {
        name: "cardType",
        type: "select",
        label: "Sanzione",
        options: CARD_OPTIONS,
      },
    ],
  },
  hug: {
    label: "Abbraccio del direttore",
    description: "I momenti teneri valgono punti extra",
    fields: [{ name: "member", type: "member", label: "Protagonista" }],
  },
  exultation: {
    label: "Esultanza iconica",
    description: "Dediche e show sotto la curva",
    fields: [{ name: "member", type: "member", label: "Protagonista" }],
  },
  oneShotBeer: {
    label: "Shottino",
    description: "Per gli eroi del terzo tempo",
    fields: [{ name: "member", type: "member", label: "Sfidadore" }],
  },
};

const ORDERED_MATCHES = [...MATCHES].sort(
  (a, b) => a.date.getTime() - b.date.getTime()
);

const MATCH_MAP = new Map<string, Match>(
  ORDERED_MATCHES.map((match) => [match.id, match])
);

const STATUS_STYLES: Record<"success" | "error" | "info", string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-white/80",
};

export default function AdminPage() {
  const [selectedMatchId, setSelectedMatchId] = useState(
    ORDERED_MATCHES[0]?.id ?? ""
  );
  const [eventType, setEventType] = useState<EventFormKind>("start");
  const [formValues, setFormValues] = useState<FormValues>({});
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [passwordInput, setPasswordInput] = useState("");
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authVariant, setAuthVariant] = useState<"success" | "error" | "info">(
    "info"
  );
  const [authLoading, setAuthLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<
    "success" | "error" | "info"
  >("info");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingIndex, setDeleteLoadingIndex] = useState<number | null>(
    null
  );

  const isAuthenticated = Boolean(sessionPassword);

  const selectedMatch = selectedMatchId
    ? MATCH_MAP.get(selectedMatchId)
    : undefined;

  const membersForMatch = useMemo(() => {
    if (!selectedMatch) {
      return [];
    }

    return MEMBERS.filter(
      (member) =>
        member.team === selectedMatch.homeTeam ||
        member.team === selectedMatch.awayTeam
    ).sort(sortMembers);
  }, [selectedMatch]);

  const eventConfig = EVENT_FORM_CONFIG[eventType];

  const loadEvents = useCallback(async (matchId: string) => {
    if (!matchId) {
      setEvents([]);
      return;
    }

    setEventsLoading(true);

    try {
      const response = await fetch(`/api/events/${matchId}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Impossibile recuperare gli eventi"
        );
      }

      const normalized = normalizeEventsFromApi(payload.events ?? []);
      setEvents(normalized);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Errore di caricamento"
      );
      setStatusVariant("error");
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(selectedMatchId);
  }, [selectedMatchId, loadEvents]);

  useEffect(() => {
    setFormValues({});
  }, [eventType, selectedMatchId]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAuthLoading(true);
    setAuthStatus(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Password non valida"
        );
      }

      setSessionPassword(passwordInput);
      setPasswordInput("");
      setAuthStatus("Accesso consentito. Puoi registrare eventi.");
      setAuthVariant("success");
    } catch (error) {
      setSessionPassword(null);
      setAuthStatus(
        error instanceof Error ? error.message : "Login non riuscito"
      );
      setAuthVariant("error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSessionPassword(null);
    setPasswordInput("");
    setAuthStatus("Sessione terminata");
    setAuthVariant("info");
  };

  const handleSubmitEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMatchId) {
      setStatusMessage("Seleziona una partita");
      setStatusVariant("error");
      return;
    }

    if (!sessionPassword) {
      setStatusMessage("Accedi con la password per continuare");
      setStatusVariant("error");
      return;
    }

    const build = buildEventPayload(eventType, formValues);
    if (!build.ok) {
      setStatusMessage(build.error);
      setStatusVariant("error");
      return;
    }

    setSubmitLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/events/${selectedMatchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: sessionPassword,
          event: build.event,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Impossibile salvare l'evento"
        );
      }

      const normalized = normalizeEventsFromApi(payload.events ?? []);
      setEvents(normalized);
      setFormValues({});
      setStatusMessage("Evento registrato");
      setStatusVariant("success");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Errore imprevisto durante il salvataggio"
      );
      setStatusVariant("error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteEvent = useCallback(
    async (index: number) => {
      if (!selectedMatchId) {
        setStatusMessage("Seleziona una partita");
        setStatusVariant("error");
        return;
      }

      if (!sessionPassword) {
        setStatusMessage("Accedi con la password per continuare");
        setStatusVariant("error");
        return;
      }

      setDeleteLoadingIndex(index);
      setStatusMessage(null);

      try {
        const response = await fetch(`/api/events/${selectedMatchId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: sessionPassword,
            index,
          }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Impossibile eliminare l'evento"
          );
        }

        const normalized = normalizeEventsFromApi(payload.events ?? []);
        setEvents(normalized);
        setStatusMessage("Evento eliminato");
        setStatusVariant("success");
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Errore durante l'eliminazione"
        );
        setStatusVariant("error");
      } finally {
        setDeleteLoadingIndex(null);
      }
    },
    [selectedMatchId, sessionPassword]
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#140a0b,_#520710)] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col justify-center rounded-3xl border border-white/15 bg-white/5 p-10 shadow-2xl shadow-black/50 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">
            Fantakings Control Room
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Inserisci la password staff
          </h1>
          <p className="mt-2 text-white/70">
            Solo chi è a bordo campo può registrare gli eventi live.
          </p>
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <label className="block text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-base focus:border-white focus:outline-none"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={authLoading || !passwordInput}
              className="w-full rounded-2xl bg-white px-5 py-3 font-semibold uppercase tracking-widest text-black transition hover:bg-white/80 disabled:cursor-not-allowed disabled:bg-white/30"
            >
              {authLoading ? "Verifico..." : "Accedi"}
            </button>
          </form>
          {authStatus && (
            <p className={`mt-6 text-sm ${STATUS_STYLES[authVariant]}`}>
              {authStatus}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#140a0b,_#520710)] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">
            Fantakings Control Room
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-semibold md:text-5xl">
                  Admin Match Events
                </h1>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
              <p className="mt-2 text-white/70">
                Inserisci gol, cartellini e momenti extra live dalla panchina.
              </p>
            </div>
            {selectedMatch && (
              <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-3 text-sm backdrop-blur">
                <p className="font-semibold uppercase tracking-wide text-white">
                  {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                </p>
                <p className="text-white/70">
                  {formatMatchDate(selectedMatch)}
                </p>
              </div>
            )}
          </div>
        </header>

        <section className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Timeline partita</h2>
            <span className="text-xs uppercase tracking-[0.4em] text-white/50">
              {events.length} eventi
            </span>
          </div>
          <div className="mt-5 max-h-[360px] space-y-4 overflow-y-auto pr-2">
            {eventsLoading ? (
              <p className="text-sm text-white/70">Caricamento eventi...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-white/70">
                Ancora nessun evento salvato per questa partita.
              </p>
            ) : (
              events.map((event, index) => (
                <article
                  key={`${event.type}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/50">
                    <span>
                      {EVENT_FORM_CONFIG[event.type as EventFormKind]?.label ??
                        event.type}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>{formatEventTime(event)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(index)}
                        disabled={deleteLoadingIndex === index}
                        className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-red-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Elimina evento"
                      >
                        {deleteLoadingIndex === index
                          ? "Elimino..."
                          : "Elimina"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-base font-semibold">
                    {summarizeEvent(event)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[32px] bg-white/95 p-8 text-gray-900 shadow-2xl shadow-black/30">
          <form onSubmit={handleSubmitEvent} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
                  Partita
                </label>
                <select
                  value={selectedMatchId}
                  onChange={(event) => setSelectedMatchId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base focus:border-black focus:outline-none"
                >
                  {ORDERED_MATCHES.map((match) => (
                    <option key={match.id} value={match.id}>
                      {matchLabel(match)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
                  Tipo di evento
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(EVENT_FORM_CONFIG) as EventFormKind[]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEventType(type)}
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                          type === eventType
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {EVENT_FORM_CONFIG[type].label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-6">
              <p className="text-lg font-semibold text-gray-900">
                {eventConfig.label}
              </p>
              <p className="text-sm text-gray-600">{eventConfig.description}</p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {eventConfig.fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    value={formValues[field.name] ?? ""}
                    onChange={(value) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.name]: value,
                      }))
                    }
                    members={membersForMatch}
                  />
                ))}
              </div>
            </div>

            {statusMessage && (
              <p
                className={`text-sm font-semibold ${STATUS_STYLES[statusVariant]}`}
              >
                {statusMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full rounded-2xl bg-gray-900 px-6 py-4 text-lg font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {submitLoading ? "Salvataggio..." : "Registra evento"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  members,
}: {
  field: EventField;
  value: string;
  onChange: (value: string) => void;
  members: Member[];
}) {
  if (field.type === "member") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
          {field.label}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base focus:border-black focus:outline-none"
        >
          <option value="">Scegli un tesserato</option>
          {members.map((member) => (
            <option key={member.name} value={member.name}>
              {member.name} · {member.team}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
          {field.label}
        </label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base focus:border-black focus:outline-none"
        >
          <option value="">Seleziona</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">
        {field.label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base focus:border-black focus:outline-none"
      />
      {field.helper && <p className="text-xs text-gray-500">{field.helper}</p>}
    </div>
  );
}

function matchLabel(match: Match) {
  const formatter = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${match.homeTeam} vs ${match.awayTeam} — ${formatter.format(
    match.date
  )}`;
}

function formatMatchDate(match: Match) {
  const formatter = new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(match.date);
}

function formatEventTime(event: MatchEvent) {
  if (event.type === "start" || event.type === "end") {
    const formatter = new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return formatter.format(event.when);
  }

  return "";
}

function summarizeEvent(event: MatchEvent) {
  switch (event.type) {
    case "goal":
      return `${event.member} · ${goalOriginLabel(event.from)}`;
    case "card":
      return `${event.member} · ${
        event.cardType === "yellow" ? "Giallo" : "Rosso"
      }`;
    case "noGoal":
      return `${event.member} · ${shootoutLabel(event.from)}`;
    case "save":
      return `${event.member} · ${shootoutLabel(event.from)} parata`;
    case "goalReceived":
      return `${event.member} colpito`;
    case "hug":
      return `${event.member} abbracciato dal direttore`;
    case "exultation":
      return `${event.member} in estasi`;
    case "oneShotBeer":
      return `${event.member} shot completato`;
    case "start":
      return "Inizio ufficiale";
    case "end":
      return "Fine match";
    default:
      return "";
  }
}

function goalOriginLabel(value: string) {
  switch (value) {
    case "penalty":
      return "Rigore";
    case "shotout":
      return "Shotout";
    case "ownGoal":
      return "Autogol";
    case "double":
      return "Goal doppio";
    default:
      return "Azione";
  }
}

function shootoutLabel(value: string) {
  return value === "shotout" ? "Shotout" : "Rigore";
}

function sortMembers(a: Member, b: Member) {
  if (a.team !== b.team) {
    return a.team.localeCompare(b.team);
  }
  return a.name.localeCompare(b.name);
}

function buildEventPayload(
  kind: EventFormKind,
  values: FormValues
): EventBuildResult {
  const member = values.member?.trim();

  switch (kind) {
    case "start":
    case "end": {
      if (!values.when) {
        return { ok: true, event: { type: kind } };
      }
      const iso = toIso(values.when);
      if (!iso) {
        return { ok: false, error: "Inserisci una data valida" };
      }
      return { ok: true, event: { type: kind, when: iso } };
    }
    case "goal": {
      if (!member) {
        return { ok: false, error: "Seleziona il marcatore" };
      }
      if (!values.from) {
        return { ok: false, error: "Scegli l'origine del gol" };
      }
      return {
        ok: true,
        event: { type: "goal", member, from: values.from },
      };
    }
    case "noGoal": {
      if (!member) {
        return { ok: false, error: "Seleziona il tiratore" };
      }
      if (!values.from) {
        return { ok: false, error: "Scegli la situazione" };
      }
      return {
        ok: true,
        event: { type: "noGoal", member, from: values.from },
      };
    }
    case "save": {
      if (!member) {
        return { ok: false, error: "Seleziona il portiere" };
      }
      if (!values.from) {
        return { ok: false, error: "Scegli la situazione" };
      }
      return {
        ok: true,
        event: { type: "save", member, from: values.from },
      };
    }
    case "goalReceived": {
      if (!member) {
        return { ok: false, error: "Serve il portiere colpito" };
      }
      return { ok: true, event: { type: "goalReceived", member } };
    }
    case "card": {
      if (!member) {
        return { ok: false, error: "Seleziona il giocatore" };
      }
      if (!values.cardType) {
        return { ok: false, error: "Scegli il cartellino" };
      }
      return {
        ok: true,
        event: {
          type: "card",
          member,
          cardType: values.cardType as "yellow" | "red",
        },
      };
    }
    case "hug":
    case "exultation":
    case "oneShotBeer": {
      if (!member) {
        return { ok: false, error: "Scegli il protagonista" };
      }
      return { ok: true, event: { type: kind, member } };
    }
    default:
      return { ok: false, error: "Tipo di evento non supportato" };
  }
}

function toIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function normalizeEventsFromApi(payload: unknown): MatchEvent[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((event) => {
    if (
      event &&
      typeof event === "object" &&
      (event as { type?: string }).type === "start" &&
      "when" in event
    ) {
      return {
        ...(event as MatchEvent),
        when: new Date((event as { when: string }).when),
      };
    }
    if (
      event &&
      typeof event === "object" &&
      (event as { type?: string }).type === "end" &&
      "when" in event
    ) {
      return {
        ...(event as MatchEvent),
        when: new Date((event as { when: string }).when),
      };
    }
    return event as MatchEvent;
  });
}
