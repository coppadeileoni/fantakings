"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { RoleBadge, ROLE_UI } from "../components/role-badge";
import { Member } from "../utils/types";
import { persistSquad } from "./actions";
import { MEMBERS } from "../data/members";
import { TEAMS } from "../data/teams";

export default function CreateSquadPage() {
  const [squadName, setSquadName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | "success" | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTeams = useMemo(
    () => new Set(selectedMembers.map((member) => member.team)),
    [selectedMembers]
  );

  const membersByTeam = useMemo(() => {
    const grouped = MEMBERS.reduce<Map<string, Member[]>>((acc, member) => {
      if (!acc.has(member.team)) {
        acc.set(member.team, []);
      }
      acc.get(member.team)!.push(member);
      return acc;
    }, new Map());

    return Array.from(grouped.entries())
      .map(([team, members]) => {
        const sortedMembers = members
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));
        const logo = TEAMS.find((e) => e.name === team)?.logo ?? null;

        return {
          team,
          members: sortedMembers,
          logo,
        };
      })
      .sort((a, b) => a.team.localeCompare(b.team));
  }, []);

  const hasPresidentSelected = useMemo(
    () => selectedMembers.some((member) => member.role === "pres"),
    [selectedMembers]
  );

  const hasGoalkeeperSelected = useMemo(
    () => selectedMembers.some((member) => member.role === "goalkeeper"),
    [selectedMembers]
  );

  const handleToggleMember = (member: Member) => {
    setFeedback(null);
    setStatus(null);

    const isSelected = selectedMembers.some(
      (current) => current.name === member.name
    );

    if (isSelected) {
      setSelectedMembers((current) =>
        current.filter((currentMember) => currentMember.name !== member.name)
      );
      return;
    }

    if (selectedTeams.has(member.team)) {
      setFeedback(`Il team ${member.team} e gia stato selezionato.`);
      setStatus("error");
      return;
    }

    if (!isSelected && member.role === "pres" && hasPresidentSelected) {
      setFeedback("Puoi selezionare un solo presidente.");
      setStatus("error");
      return;
    }

    if (!isSelected && member.role === "goalkeeper" && hasGoalkeeperSelected) {
      setFeedback("Puoi selezionare un solo portiere.");
      setStatus("error");
      return;
    }

    if (selectedMembers.length >= 6) {
      setFeedback("Puoi selezionare al massimo 6 membri.");
      setStatus("error");
      return;
    }

    setSelectedMembers((current) => [...current, member]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setStatus(null);

    if (!squadName.trim()) {
      setFeedback("Per favore inserisci il nome della squadra.");
      setStatus("error");
      return;
    }

    if (!fullName.trim()) {
      setFeedback("Per favore inserisci il nome completo.");
      setStatus("error");
      return;
    }

    if (!email.trim()) {
      setFeedback("Per favore inserisci una email.");
      setStatus("error");
      return;
    }

    if (selectedMembers.length !== 6) {
      setFeedback("Seleziona esattamente 6 membri.");
      setStatus("error");
      return;
    }

    const presidentCount = selectedMembers.filter(
      (member) => member.role === "pres"
    ).length;
    const goalkeeperCount = selectedMembers.filter(
      (member) => member.role === "goalkeeper"
    ).length;

    if (presidentCount !== 1) {
      setFeedback("Seleziona esattamente un presidente.");
      setStatus("error");
      return;
    }

    if (goalkeeperCount !== 1) {
      setFeedback("Seleziona esattamente un portiere.");
      setStatus("error");
      return;
    }

    startTransition(async () => {
      try {
        await persistSquad({
          squadName: squadName.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          members: selectedMembers.map((member) => ({
            name: member.name,
            team: member.team,
            role: member.role,
          })),
        });
        setFeedback(
          `Squadra ${squadName.trim()} creata da ${fullName.trim()} (${email.trim()}).`
        );
        setStatus("success");
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Email già registrata"
        ) {
          setFeedback("Una squadra con questa email è già stata registrata.");
          setStatus("error");
          return;
        } else {
          setFeedback("Errore durante il salvataggio della squadra.");
          setStatus("error");
        }
      }
    });
  };

  return (
    <div className="min-h-screen  py-16">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-900">Crea squadra</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Compila il seguente modulo, scegli esattamente 6 membri (1 portiere, 1
          presidente e 4 giocatori). Ricordati che per ogni squadra puoi
          selezionare soltanto uno dei suoi membri.
        </p>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="squad-name"
              className="block text-sm font-medium text-zinc-800"
            >
              Nome squadra
            </label>
            <input
              id="squad-name"
              type="text"
              required
              value={squadName}
              onChange={(event) => setSquadName(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Inserisci il nome della squadra"
            />
          </div>

          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-medium text-zinc-800"
            >
              Nome completo
            </label>
            <input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Inserisci il tuo nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800"
            >
              Email di riferimento
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nome@example.com"
            />
          </div>

          <div>
            <h2 className="text-lg font-medium text-zinc-900">Membri</h2>
            <div className="mt-4 space-y-4">
              {membersByTeam.map(({ team, members, logo }) => {
                const selectedMember = selectedMembers.find(
                  (candidate) => candidate.team === team
                );

                return (
                  <details
                    key={team}
                    className={`rounded-lg border ${
                      selectedMember
                        ? "border-blue-500 bg-blue-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-zinc-900">
                      <span className="flex items-center gap-3">
                        {logo && (
                          <Image
                            src={logo}
                            alt={`Logo ${team}`}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-contain"
                          />
                        )}
                        <span>{team}</span>
                      </span>
                      <span className="text-xs font-medium text-zinc-500">
                        {selectedMember ? "[x] Selezionato" : "[ ] Disponibile"}{" "}
                        ({members.length})
                      </span>
                    </summary>
                    <ul className="border-t border-zinc-200 px-4 py-3 text-sm text-zinc-900">
                      {members.map((member) => {
                        const isSelected = selectedMembers.some(
                          (current) => current.name === member.name
                        );
                        const teamAlreadyChosen =
                          !isSelected && selectedTeams.has(member.team);
                        const presidentAlreadyChosen =
                          !isSelected &&
                          member.role === "pres" &&
                          hasPresidentSelected;
                        const goalkeeperAlreadyChosen =
                          !isSelected &&
                          member.role === "goalkeeper" &&
                          hasGoalkeeperSelected;
                        const roleTheme = ROLE_UI[member.role];
                        const cardClassName = isSelected
                          ? roleTheme.card.selected
                          : roleTheme.card.base;

                        return (
                          <li
                            key={member.name}
                            className="py-2 first:pt-0 last:pb-0"
                          >
                            <label
                              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition ${
                                roleTheme.card.hover
                              } ${cardClassName} ${
                                teamAlreadyChosen ||
                                presidentAlreadyChosen ||
                                goalkeeperAlreadyChosen
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4"
                                checked={isSelected}
                                onChange={() => handleToggleMember(member)}
                                disabled={
                                  teamAlreadyChosen ||
                                  presidentAlreadyChosen ||
                                  goalkeeperAlreadyChosen
                                }
                              />
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-zinc-900">
                                  {member.name}
                                </p>
                                <RoleBadge role={member.role} />
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Membri selezionati: {selectedMembers.length}/6
            </p>
          </div>

          {feedback && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {feedback}
            </div>
          )}
          {selectedMembers.length > 0 && (
            <section className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Riepilogo squadra
              </h3>
              <ul className="mt-2 space-y-2">
                {selectedMembers
                  .slice()
                  .sort((a, b) => {
                    const rank: Record<Member["role"], number> = {
                      pres: 0,
                      goalkeeper: 1,
                      player: 2,
                    };
                    return (
                      rank[a.role] - rank[b.role] ||
                      a.name.localeCompare(b.name)
                    );
                  })
                  .map((member) => (
                    <li
                      key={member.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-zinc-900">
                        {member.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <RoleBadge role={member.role} />
                        <span className="text-xs text-zinc-500">
                          {member.team}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="mt-4 text-xs text-blue-700">
                Totale membri: {selectedMembers.length}/6
              </p>
            </section>
          )}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Salvataggio..." : "Salva squadra"}
          </button>
        </form>
      </div>
    </div>
  );
}
