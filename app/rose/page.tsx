import { RoleBadge } from "../components/role-badge";
import { MEMBERS } from "../data/members";
import { FANTA_ROSTER } from "../data/roster";

const MEMBER_BY_NAME = new Map(
  MEMBERS.map((member) => [`${member.name}$${member.team}`, member])
);

export default function RosePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16 font-sans text-white">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-5xl font-bold tracking-wide">Rose</h1>
        <p className="text-lg text-white">
          Consulta tutte le rose ufficiali e scopri le scelte dei fanta manager.
          Ogni card è comprimibile per una lettura rapida o approfondita.
        </p>
      </div>

      <section className="mt-12 w-full max-w-3xl space-y-4">
        {[...FANTA_ROSTER]
          .sort((a, b) => a.fullname.localeCompare(b.fullname))
          .map((roster) => (
            <details
              key={`${roster.name}$${roster.fullname}`}
              className="group rounded-xl border border-black/10 bg-white text-left shadow-sm transition hover:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-6 py-4 text-black transition group-open:rounded-b-none">
                <div>
                  <p className="text-sm uppercase tracking-wide text-black/60">
                    {roster.fullname}
                  </p>
                  <h2 className="text-2xl font-semibold text-black">
                    {roster.name}
                  </h2>
                </div>
              </summary>

              <div className="border-t border-black/10 px-6 py-4 text-black/80">
                <ul className="space-y-2">
                  {roster.players.map((player) => {
                    const memberDetails = MEMBER_BY_NAME.get(
                      `${player.member}$${player.team}`
                    );

                    return (
                      <li
                        key={`${roster.name}-${player.member}`}
                        className="flex items-center justify-between rounded-lg bg-black/5 px-4 py-2 text-sm"
                      >
                        <div>
                          <span className="block font-medium text-black">
                            {player.member}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-black/70">
                            {player.team}
                          </span>
                        </div>
                        {memberDetails ? (
                          <RoleBadge role={memberDetails.role} />
                        ) : (
                          <span className="text-xs uppercase tracking-wide text-black/60">
                            Ruolo n/d
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          ))}
      </section>
    </main>
  );
}
