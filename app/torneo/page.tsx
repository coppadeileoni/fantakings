import type { MatchEvent } from "../utils/types";
import { fetchAllMatchEvents } from "../utils/events-store";
import TorneoClient from "./client";

export const revalidate = 0;

async function loadEvents(): Promise<Record<string, MatchEvent[]>> {
  try {
    return await fetchAllMatchEvents();
  } catch (error) {
    console.error("Unable to preload match events", error);
    return {};
  }
}

export default async function TorneoPage() {
  const initialEventsByMatch = await loadEvents();

  return <TorneoClient initialEventsByMatch={initialEventsByMatch} />;
}
