export default function PremiPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-5xl font-bold tracking-wide text-black dark:text-zinc-50">
          Premi
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-200">
          Premi in palio per la Coppa dei Leoni 2025:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-left text-lg text-zinc-800 dark:text-zinc-100">
          <li>🥇 Orologio offerto da Pagano Gioielli</li>
          <li>🥈 Buono Amazon da 15€</li>
          <li>🥉 Colazione americana offerta da Cosa Fare a Enna</li>
          <li>🎟 Iscrizione singolo gratuita Coppa dei Leoni</li>
          <li>👕 Pantaloncini Joma</li>
        </ol>
        <section className="space-y-6 text-left text-base text-zinc-700 dark:text-zinc-200">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Regolamento Bonus e Malus
            </h2>
            <p>
              I bonus e i malus contribuiscono al punteggio totale della squadra
              in ogni giornata. L&apos;obiettivo è premiare le prestazioni
              decisive e penalizzare errori o comportamenti scorretti.
            </p>
          </div>
          {/* <ul className="space-y-4">
            <li className="space-y-2">
              <h3 className="text-xl font-semibold text-black dark:text-zinc-100">
                Portieri
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Bonus: porta inviolata (+1), rigore parato (+3), migliore in
                  campo (+2).
                </li>
                <li>
                  Malus: gol subito (-1 ogni due reti), rigore causato (-1),
                  ammonizione (-0.5), espulsione (-1).
                </li>
              </ul>
            </li>
            <li className="space-y-2">
              <h3 className="text-xl font-semibold text-black dark:text-zinc-100">
                Giocatori
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Bonus: gol (+3), assist (+1), rigore procurato o trasformato
                  (+2), migliore in campo (+2).
                </li>
                <li>
                  Malus: autogol (-2), rigore sbagliato (-3), ammonizione
                  (-0.5), espulsione (-1).
                </li>
              </ul>
            </li>
            <li className="space-y-2">
              <h3 className="text-xl font-semibold text-black dark:text-zinc-100">
                Presidenti
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Bonus: formazione consegnata puntualmente (+1), vittoria nello
                  scontro diretto (+2), fair play premiato (+1).
                </li>
                <li>
                  Malus: formazione assente (-3), comportamento antisportivo
                  (-2), ritardo nella consegna formazione (-1).
                </li>
              </ul>
            </li>
          </ul>
          <p>
            In caso di parità di punteggio totale, si confrontano
            nell&apos;ordine differenza reti, numero di vittorie e gol segnati.
            Eventuali aggiornamenti al regolamento verranno comunicati prima
            dell&apos;inizio della giornata successiva.
          </p> */}
        </section>
      </div>
    </main>
  );
}
