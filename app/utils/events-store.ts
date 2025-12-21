import { createClient } from "redis";
import type { Match, MatchEvent } from "./types";
import { MATCHES } from "../data/matches";
import { MEMBERS } from "../data/members";

const redisUrl = process.env.REDIS_URL;

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let redisConnection: Promise<RedisClient> | null = null;

export async function getRedisClient() {
    if (!redisUrl) {
        throw new Error("Missing REDIS_URL");
    }

    if (!redisClient) {
        redisClient = createClient({ url: redisUrl });
        redisClient.on("error", (error) => {
            console.error("Redis error", error);
        });
        redisConnection = redisClient.connect();
    }

    if (!redisConnection) {
        redisConnection = redisClient.connect();
    }

    await redisConnection;
    return redisClient;
}

const MATCH_INDEX = new Map(MATCHES.map((match) => [match.id, match]));

export function getMatch(matchId: string): Match | undefined {
    return MATCH_INDEX.get(matchId);
}

export function getRosterForMatch(match: Match): string[] {
    return MEMBERS.filter(
        (member) =>
            member.team === match.homeTeam || member.team === match.awayTeam
    ).map((member) => member.name);
}

function getRedisKey(matchId: string) {
    return `match:${matchId}:events`;
}

export async function readEvents(
    client: RedisClient,
    matchId: string
): Promise<MatchEvent[]> {
    const rawValue = await client.get(getRedisKey(matchId));

    if (!rawValue) {
        return [];
    }

    try {
        const parsed = JSON.parse(rawValue);
        if (!Array.isArray(parsed)) {
            throw new Error("Formato eventi non valido");
        }

        return parsed.map((event) => {
            if (
                event &&
                typeof event === "object" &&
                (event.type === "start" || event.type === "end") &&
                "when" in event
            ) {
                const when = new Date((event as { when: string }).when);
                return {
                    ...(event as MatchEvent),
                    when: Number.isNaN(when.getTime()) ? new Date() : when,
                } as MatchEvent;
            }

            return event as MatchEvent;
        });
    } catch (error) {
        console.error("Invalid events payload", error);
        throw new Error("Impossibile decodificare gli eventi");
    }
}

export async function writeEvents(
    client: RedisClient,
    matchId: string,
    events: MatchEvent[]
) {
    await client.set(getRedisKey(matchId), JSON.stringify(events));
}

export function parseDate(input: unknown): Date | null {
    if (!input) {
        return new Date();
    }

    const value = new Date(input as string);
    return Number.isNaN(value.getTime()) ? null : value;
}

export function validateMember(
    candidate: unknown,
    allowedMembers: string[]
): string | null {
    if (typeof candidate !== "string") {
        return null;
    }

    const normalized = candidate.trim();
    if (!normalized) {
        return null;
    }

    return allowedMembers.includes(normalized) ? normalized : null;
}

export function validateEventPayload(
    rawEvent: unknown,
    match: Match
): { event?: MatchEvent; error?: string } {
    if (!rawEvent || typeof rawEvent !== "object") {
        return { error: "Evento non valido" };
    }

    const allowedMembers = getRosterForMatch(match);
    const event = rawEvent as Record<string, unknown> & { type?: string };

    switch (event.type) {
        case "start": {
            const when = parseDate(event.when);
            if (!when) {
                return { error: "Orario di inizio non valido" };
            }
            return { event: { type: "start", when } };
        }
        case "end": {
            const when = parseDate(event.when);
            if (!when) {
                return { error: "Orario di fine non valido" };
            }
            return { event: { type: "end", when } };
        }
        case "goal": {
            const member = validateMember(event.member, allowedMembers);
            if (!member) {
                return { error: "Giocatore del gol non valido" };
            }

            if (
                event.from !== "activePlay" &&
                event.from !== "penalty" &&
                event.from !== "shotout" &&
                event.from !== "ownGoal" && event.from !== "double"
            ) {
                return { error: "Origine del gol non valida" };
            }

            return {
                event: {
                    type: "goal",
                    member,
                    from: event.from,
                },
            };
        }
        case "noGoal": {
            const member = validateMember(event.member, allowedMembers);
            if (!member) {
                return { error: "Giocatore del rigore non valido" };
            }

            if (event.from !== "penalty" && event.from !== "shotout") {
                return { error: "Origine del rigore non valida" };
            }

            return {
                event: {
                    type: "noGoal",
                    member,
                    from: event.from,
                },
            };
        }
        case "goalReceived": {
            const member = validateMember(event.member, allowedMembers);
            if (!member) {
                return { error: "Portiere non valido" };
            }

            return { event: { type: "goalReceived", member } };
        }
        case "save": {
            const member = validateMember(event.member, allowedMembers);
            if (!member) {
                return { error: "Portiere non valido" };
            }

            if (event.from !== "penalty" && event.from !== "shotout") {
                return { error: "Origine del paratone non valida" };
            }

            return {
                event: {
                    type: "save",
                    member,
                    from: event.from,
                },
            };
        }
        case "card": {
            const member = validateMember(event.member, allowedMembers);
            if (!member) {
                return { error: "Giocatore non valido" };
            }

            if (event.cardType !== "yellow" && event.cardType !== "red") {
                return { error: "Tipo di cartellino non valido" };
            }

            return {
                event: {
                    type: "card",
                    member,
                    cardType: event.cardType,
                },
            };
        }
        case "hug":
        case "exultation":
        case "oneShotBeer": {
            const member = validateMember(event.member, allowedMembers);
            if (!member) {
                return { error: "Membro non valido" };
            }

            return { event: { type: event.type, member } as MatchEvent };
        }
        default:
            return { error: "Tipo di evento non supportato" };
    }
}

export async function fetchAllMatchEvents(): Promise<Record<string, MatchEvent[]>> {
    const client = await getRedisClient();
    const entries = await Promise.all(
        MATCHES.map(async (match) => {
            const events = await readEvents(client, match.id);
            return [match.id, events] as const;
        })
    );

    return Object.fromEntries(entries);
}

export type { RedisClient };
