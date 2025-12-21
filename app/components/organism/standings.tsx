import { getLogoByTeamName } from "@/app/utils/functions";
import { Standing } from "@/app/utils/types";
import Image from "next/image";

type LiveScoreMap = Map<string, { goalsFor: number; goalsAgainst: number }>;

type StandingProps = {
  standings: Standing[];
  liveScoresByTeam?: LiveScoreMap;
};

export function Standings({ standings, liveScoresByTeam }: StandingProps) {
  return (
    <div className="mt-10">
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-300">
        <table className="w-full min-w-150 table-auto border-collapse bg-white text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
            <tr>
              <th className="px-4 py-3">Squadra</th>
              <th className="px-4 py-3 text-center">PT</th>
              <th className="px-4 py-3 text-center">G</th>
              <th className="px-4 py-3 text-center">V</th>
              <th className="px-4 py-3 text-center">N</th>
              <th className="px-4 py-3 text-center">P</th>
              <th className="px-4 py-3 text-center">GF</th>
              <th className="px-4 py-3 text-center">GS</th>
              <th className="px-4 py-3 text-center">DR</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => {
              const goalDiff = team.goalsFor - team.goalsAgainst;
              const logoSrc = getLogoByTeamName(team.team);
              const liveScore = liveScoresByTeam?.get(team.team);

              return (
                <tr
                  key={team.team}
                  className={`border-t border-zinc-200 ${
                    index < 4 ? "bg-zinc-50" : ""
                  }`}
                >
                  <td className="w-64 px-4 py-3 text-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 items-center gap-3">
                        <span className="text-sm font-semibold text-zinc-500">
                          {index + 1}.
                        </span>
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={`Logo ${team.team}`}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-contain"
                          />
                        ) : null}
                        <span className="font-medium text-zinc-800">
                          {team.team}
                        </span>
                      </div>
                      {liveScore ? (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          <span
                            className="relative flex h-2.5 w-2.5"
                            aria-hidden
                          >
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          </span>
                          <span>
                            {liveScore.goalsFor} - {liveScore.goalsAgainst}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-base font-semibold text-black">
                    {team.points}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {team.played}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {team.wins}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {team.draws}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {team.losses}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {team.goalsFor}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {team.goalsAgainst}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-700">
                    {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
        In caso di parità di punti si considerano nell&apos;ordine differenza
        reti, gol segnati e scontri diretti.
      </p>
    </div>
  );
}
