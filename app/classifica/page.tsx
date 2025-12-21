import { FANTA_ROSTER } from "../data/roster";
import { calculatePlayerPoints } from "../utils/functions";
import { fetchAllMatchEvents } from "../utils/events-store";
import type { MatchEvent } from "../utils/types";

export const revalidate = 0;

type FantasyStanding = {
  manager: string;
  teamName: string;
  totalPoints: number;
  breakdown: {
    member: string;
    team: string;
    points: number;
  }[];
};

async function loadEvents(): Promise<Record<string, MatchEvent[]>> {
  try {
    return await fetchAllMatchEvents();
  } catch (error) {
    console.error("Unable to preload match events", error);
    return {};
  }
}

function buildFantasyStandings(
  memberPoints: Map<string, number>
): FantasyStanding[] {
  return FANTA_ROSTER.map((roster) => {
    const breakdown = roster.players.map((player) => {
      const points = memberPoints.get(`${player.member}$${player.team}`) ?? 0;
      return {
        member: player.member,
        team: player.team,
        points,
      };
    });

    const totalPoints = breakdown.reduce((sum, entry) => sum + entry.points, 0);

    return {
      manager: roster.fullname,
      teamName: roster.name,
      totalPoints,
      breakdown,
    };
  }).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.teamName.localeCompare(b.teamName);
  });
}

export default async function ClassificaPage() {
  const eventsByMatch = await loadEvents();
  const memberPoints = calculatePlayerPoints(eventsByMatch);
  const fantasyStandings = buildFantasyStandings(memberPoints);

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16 font-sans text-black">
      <div className="max-w-3xl space-y-6 text-center">
        <h1 className="text-5xl font-bold tracking-wide text-white">
          Classifica
        </h1>
        <p className="text-lg text-white">
          Classifica dei Fanta Team calcolata sommando i bonus ottenuti dagli
          eventi di gara. I punteggi si aggiornano automaticamente in base ai
          risultati registrati.
        </p>
      </div>

      <section className="mt-12 w-full max-w-4xl space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {fantasyStandings.length === 0 ? (
            <p className="text-center text-sm text-zinc-500">
              Nessuna rosa caricata.
            </p>
          ) : (
            <ol className="space-y-4">
              {fantasyStandings.map((standing, index) => (
                <li key={`${standing.manager}-${standing.teamName}`}>
                  <details className="group rounded-xl border border-zinc-100 bg-zinc-50">
                    <summary className="flex cursor-pointer flex-col gap-2 rounded-xl px-4 py-3 text-left transition group-open:rounded-b-none sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-zinc-500">
                          #{index + 1} · {standing.manager}
                        </p>
                        <h2 className="text-2xl font-semibold text-zinc-900">
                          {standing.teamName}
                        </h2>
                      </div>
                      <span className="text-lg font-bold text-zinc-900">
                        {standing.totalPoints.toFixed(2)} pt
                      </span>
                    </summary>

                    <div className="border-t border-zinc-100 px-4 py-4">
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {standing.breakdown.map((player) => (
                          <li
                            key={`${standing.teamName}-${player.member}`}
                            className="rounded-lg bg-white px-4 py-2 shadow-sm"
                          >
                            <p className="font-medium text-zinc-900">
                              {player.member}
                            </p>
                            <div className="flex items-center justify-between text-sm text-zinc-500">
                              <span>{player.team}</span>
                              <span>{player.points.toFixed(2)} pt</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </main>
  );
}
