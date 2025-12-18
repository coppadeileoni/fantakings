"use client";

import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { MATCHES } from "../data/matches";
import { TEAMS } from "../data/teams";
import { RoleBadge } from "../components/role-badge";
import {
  calculateBonusByEvent,
  calculateResult,
  calculateStandings,
  getAllMembersFromTeam,
  getLogoByTeamName,
} from "../utils/functions";
import { MatchEvent, Member } from "../utils/types";
import { Standings } from "../components/organism/standings";

type CalendarMatch = {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  homeScore?: number;
  awayScore?: number;
  homeLogo?: string;
  awayLogo?: string;
  events?: MatchEvent[];
};

type CalendarDay = {
  label: string;
  date: string;
  matches: CalendarMatch[];
};

const STAGE_LABELS: Record<"quarterfinals" | "semifinals" | "finals", string> =
  {
    quarterfinals: "Quarti di finale",
    semifinals: "Semifinali",
    finals: "Finale",
  };

const STAGE_ORDER: Record<"quarterfinals" | "semifinals" | "finals", number> = {
  quarterfinals: 100,
  semifinals: 200,
  finals: 300,
};

const ROLE_ORDER: Record<Member["role"], number> = {
  pres: 0,
  goalkeeper: 1,
  player: 2,
};

function sortRoster(members: Member[]) {
  return [...members].sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    if (roleDiff !== 0) {
      return roleDiff;
    }
    return a.name.localeCompare(b.name);
  });
}

function eventHasMember(event: MatchEvent): event is MatchEvent & {
  member: string;
} {
  return "member" in event && typeof event.member === "string";
}

function describeEvent(event: MatchEvent) {
  switch (event.type) {
    case "goal":
      if (event.from === "ownGoal") {
        return {
          label: "Autogol",
          className: "bg-rose-100 text-rose-700",
        };
      }
      if (event.from === "penalty") {
        return {
          label: "Goal (rigore)",
          className: "bg-emerald-100 text-emerald-700",
        };
      }
      if (event.from === "shotout") {
        return {
          label: "Goal (shotout)",
          className: "bg-emerald-100 text-emerald-700",
        };
      }
      return {
        label: "Goal",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "card":
      if (event.cardType === "red") {
        return {
          label: "Rosso",
          className: "bg-red-100 text-red-700",
        };
      }
      return {
        label: "Giallo",
        className: "bg-amber-100 text-amber-700",
      };
    case "noGoal":
      if (event.from === "penalty") {
        return {
          label: "Rigore sbagliato",
          className: "bg-zinc-200 text-zinc-700",
        };
      }
      return {
        label: "Shotout sbagliato",
        className: "bg-zinc-200 text-zinc-700",
      };
    case "save":
      if (event.from === "penalty") {
        return {
          label: "Parata rigore",
          className: "bg-sky-100 text-sky-700",
        };
      }
      return {
        label: "Parata shotout",
        className: "bg-sky-100 text-sky-700",
      };
    case "hug":
      return {
        label: "Abbraccio",
        className: "bg-fuchsia-100 text-fuchsia-700",
      };
    case "exultation":
      return {
        label: "Esultanza",
        className: "bg-violet-100 text-violet-700",
      };
    case "oneShotBeer":
      return {
        label: "Shot birra",
        className: "bg-lime-100 text-lime-700",
      };
    default:
      return {
        label: "Evento",
        className: "bg-zinc-100 text-zinc-700",
      };
  }
}

function formatBonus(total: number) {
  if (total > 0) {
    return `+${total}`;
  }
  return `${total}`;
}

export default function TorneoPage() {
  const [activeTab, setActiveTab] = useState<"results" | "table">("results");
  const [expandedMatchIds, setExpandedMatchIds] = useState<
    Record<string, boolean>
  >({});

  const membersByTeam = useMemo(() => {
    const map = new Map<string, Member[]>();
    TEAMS.forEach((team) => {
      map.set(team.name, sortRoster(getAllMembersFromTeam(team.name)));
    });
    return map;
  }, []);
  const regularSeasonMatches = useMemo(
    () => MATCHES.filter((match) => match.type.type === "regular"),
    []
  );

  const matchDays = useMemo<CalendarDay[]>(() => {
    const dateFormatter = new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const timeFormatter = new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    type CalendarAccumulator = {
      label: string;
      sortValue: number;
      dates: string[];
      matches: Array<CalendarMatch & { dateTime: number }>;
    };

    const groups = new Map<string, CalendarAccumulator>();

    regularSeasonMatches.forEach((match) => {
      const matchDate = match.date;
      const formattedDate = dateFormatter.format(matchDate);
      const kickoff = timeFormatter.format(matchDate);
      const result = calculateResult(match);
      const matchId = `${match.homeTeam}-${
        match.awayTeam
      }-${matchDate.toISOString()}`;

      let label: string;
      let sortValue: number;

      if (match.type.type === "regular") {
        label = `Giornata ${match.type.round}`;
        sortValue = match.type.round;
      } else {
        label = STAGE_LABELS[match.type.stage];
        sortValue = STAGE_ORDER[match.type.stage];
      }

      if (!groups.has(label)) {
        groups.set(label, {
          label,
          sortValue,
          dates: [formattedDate],
          matches: [],
        });
      } else {
        const existingGroup = groups.get(label)!;
        if (!existingGroup.dates.includes(formattedDate)) {
          existingGroup.dates.push(formattedDate);
        }
      }

      const group = groups.get(label)!;

      group.matches.push({
        id: matchId,
        home: match.homeTeam,
        away: match.awayTeam,
        kickoff,
        homeScore: result?.homeScore,
        awayScore: result?.awayScore,
        homeLogo: getLogoByTeamName(match.homeTeam),
        awayLogo: getLogoByTeamName(match.awayTeam),
        events: match.events,
        dateTime: matchDate.getTime(),
      });
    });

    return Array.from(groups.values())
      .sort((a, b) => a.sortValue - b.sortValue)
      .map((group) => ({
        label: group.label,
        date: group.dates.join(" • "),
        matches: group.matches
          .sort((a, b) => a.dateTime - b.dateTime)
          .map(({ dateTime, ...match }) => match),
      }));
  }, [regularSeasonMatches]);

  const standings = useMemo(
    () => calculateStandings(regularSeasonMatches),
    [regularSeasonMatches]
  );

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16 font-sans">
      <div className="flex w-full max-w-4xl flex-col space-y-10">
        <header className="space-y-4 text-center">
          <h1 className="text-5xl font-bold tracking-wide text-black dark:text-zinc-50">
            Torneo
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-200">
            Consulta risultati e classifica della fase a gironi. Le migliori
            quattro squadre accederanno alla fase ad eliminazione diretta.
          </p>
        </header>

        <section>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("results")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "results"
                  ? "border border-zinc-200 bg-white text-black shadow-sm dark:border-zinc-500 dark:bg-white dark:text-black"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Risultati
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("table")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "table"
                  ? "border border-zinc-200 bg-white text-black shadow-sm dark:border-zinc-500 dark:bg-white dark:text-black"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Classifica
            </button>
          </div>

          {activeTab === "results" && (
            <div className="mt-10 space-y-12">
              {matchDays.map((day) => (
                <div key={day.label} className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                      {day.label}
                    </h2>
                    <p className="text-sm uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                      {day.date}
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-300">
                    <table className="w-full min-w-[320px] table-auto border-collapse bg-white text-left text-sm">
                      <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
                        <tr>
                          <th className="px-4 py-3">Orario</th>
                          <th className="px-4 py-3">Squadre</th>
                          <th className="px-4 py-3 text-center">Risultato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.matches.map((match) => {
                          const hasResult =
                            match.homeScore !== undefined &&
                            match.awayScore !== undefined;
                          const isExpanded = Boolean(
                            expandedMatchIds[match.id]
                          );
                          const homeRoster =
                            membersByTeam.get(match.home) ?? [];
                          const awayRoster =
                            membersByTeam.get(match.away) ?? [];
                          const matchEvents = match.events ?? [];

                          const toggleExpansion = () =>
                            setExpandedMatchIds((prev) => ({
                              ...prev,
                              [match.id]: !isExpanded,
                            }));

                          return (
                            <Fragment key={match.id}>
                              <tr
                                className={`border-t border-zinc-200 transition-colors ${
                                  isExpanded ? "bg-zinc-50" : "hover:bg-zinc-50"
                                } cursor-pointer`}
                                onClick={toggleExpansion}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    toggleExpansion();
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-expanded={isExpanded}
                              >
                                <td className="px-4 py-3 align-middle text-sm font-semibold text-zinc-600">
                                  {match.kickoff}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                      {match.homeLogo ? (
                                        <Image
                                          src={match.homeLogo}
                                          alt={`Logo ${match.home}`}
                                          width={32}
                                          height={32}
                                          className="h-8 w-8 rounded-full object-contain"
                                        />
                                      ) : null}
                                      <span className="font-medium text-zinc-800">
                                        {match.home}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {match.awayLogo ? (
                                        <Image
                                          src={match.awayLogo}
                                          alt={`Logo ${match.away}`}
                                          width={32}
                                          height={32}
                                          className="h-8 w-8 rounded-full object-contain"
                                        />
                                      ) : null}
                                      <span className="font-medium text-zinc-800">
                                        {match.away}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-center text-lg font-semibold text-black">
                                  <div className="flex items-center justify-center gap-3">
                                    <span>
                                      {hasResult
                                        ? `${match.homeScore} - ${match.awayScore}`
                                        : "-"}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {isExpanded ? (
                                <tr className="border-t border-zinc-200 bg-zinc-50">
                                  <td colSpan={3} className="px-4 py-5">
                                    <div className="flex flex-col gap-4">
                                      <div className="grid gap-4 md:grid-cols-2">
                                        {[
                                          {
                                            team: match.home,
                                            roster: homeRoster,
                                          },
                                          {
                                            team: match.away,
                                            roster: awayRoster,
                                          },
                                        ].map(({ team, roster }) => (
                                          <div
                                            key={team}
                                            className="rounded-xl border border-zinc-200 bg-white shadow-sm"
                                          >
                                            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
                                              <span className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                                                {team}
                                              </span>
                                              <span className="text-xs text-zinc-500">
                                                {roster.length} membri
                                              </span>
                                            </div>
                                            <ul className="divide-y divide-zinc-200">
                                              {roster.map((member) => {
                                                const memberEvents = matchEvents
                                                  .filter(eventHasMember)
                                                  .filter(
                                                    (event) =>
                                                      event.member ===
                                                      member.name
                                                  );
                                                const totalBonus =
                                                  memberEvents.reduce(
                                                    (sum, event) =>
                                                      sum +
                                                      calculateBonusByEvent(
                                                        event,
                                                        member.role === "pres"
                                                      ),
                                                    0
                                                  );
                                                const bonusClass =
                                                  totalBonus > 0
                                                    ? "text-emerald-600"
                                                    : totalBonus < 0
                                                    ? "text-rose-600"
                                                    : "text-zinc-500";

                                                return (
                                                  <li
                                                    key={member.name}
                                                    className="flex flex-col gap-2 px-4 py-3 text-sm text-zinc-800 md:flex-row md:items-center md:justify-between"
                                                  >
                                                    <div className="flex-1">
                                                      <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-black">
                                                          {member.name}
                                                        </span>
                                                        <RoleBadge
                                                          role={member.role}
                                                        />
                                                      </div>
                                                      <div className="mt-2 flex flex-wrap gap-2">
                                                        {memberEvents.length >
                                                        0 ? (
                                                          memberEvents.map(
                                                            (event, index) => {
                                                              const {
                                                                label,
                                                                className,
                                                              } =
                                                                describeEvent(
                                                                  event
                                                                );
                                                              return (
                                                                <span
                                                                  key={`${event.type}-${index}`}
                                                                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
                                                                >
                                                                  {label}
                                                                </span>
                                                              );
                                                            }
                                                          )
                                                        ) : (
                                                          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                                                            Nessun evento
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <span
                                                      className={`text-sm font-semibold ${bonusClass}`}
                                                    >
                                                      {formatBonus(totalBonus)}
                                                    </span>
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "table" && <Standings standings={standings} />}
        </section>
      </div>
    </main>
  );
}
