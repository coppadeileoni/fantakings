import { NextRequest, NextResponse } from "next/server";
import {
    getMatch,
    getRedisClient,
    readEvents,
    validateEventPayload,
    writeEvents,
} from "../../../utils/events-store";

const adminPassword = process.env.ADMIN_PASSWORD;

type RouteContext = {
    params: Promise<{ matchId: string }>;
};

export async function GET(
    _request: NextRequest,
    { params }: RouteContext
) {
    const { matchId } = await params;

    if (!matchId) {
        return NextResponse.json({ events: [] });
    }

    if (!getMatch(matchId)) {
        return NextResponse.json(
            { error: "Partita non trovata" },
            { status: 404 }
        );
    }

    try {
        const client = await getRedisClient();
        const events = await readEvents(client, matchId);

        return NextResponse.json({ events });
    } catch (error) {
        if (error instanceof Error && error.message === "Missing REDIS_URL") {
            return NextResponse.json(
                { error: "Variabile REDIS_URL non configurata" },
                { status: 500 }
            );
        }

        console.error("Events API error", error);
        return NextResponse.json(
            { error: "Impossibile recuperare gli eventi" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    const { matchId } = await params;

    if (!matchId) {
        return NextResponse.json(
            { error: "Match ID mancante" },
            { status: 400 }
        );
    }

    if (!adminPassword) {
        return NextResponse.json(
            { error: "Variabile ADMIN_PASSWORD non configurata" },
            { status: 500 }
        );
    }

    const match = getMatch(matchId);
    if (!match) {
        return NextResponse.json(
            { error: "Partita non trovata" },
            { status: 404 }
        );
    }

    let payload: { password?: unknown; event?: unknown };
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body JSON non valido" },
            { status: 400 }
        );
    }

    if (typeof payload.password !== "string") {
        return NextResponse.json(
            { error: "Password mancante" },
            { status: 400 }
        );
    }

    if (payload.password !== adminPassword) {
        return NextResponse.json(
            { error: "Password non valida" },
            { status: 401 }
        );
    }

    const validation = validateEventPayload(payload.event, match);
    if (!validation.event) {
        return NextResponse.json(
            { error: validation.error ?? "Evento non valido" },
            { status: 400 }
        );
    }

    try {
        const client = await getRedisClient();
        const events = await readEvents(client, matchId);
        events.push(validation.event);
        await writeEvents(client, matchId, events);

        return NextResponse.json({ events });
    } catch (error) {
        if (error instanceof Error && error.message === "Missing REDIS_URL") {
            return NextResponse.json(
                { error: "Variabile REDIS_URL non configurata" },
                { status: 500 }
            );
        }

        console.error("Events API error", error);
        return NextResponse.json(
            { error: "Impossibile salvare l'evento" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteContext
) {
    const { matchId } = await params;

    if (!matchId) {
        return NextResponse.json(
            { error: "Match ID mancante" },
            { status: 400 }
        );
    }

    if (!adminPassword) {
        return NextResponse.json(
            { error: "Variabile ADMIN_PASSWORD non configurata" },
            { status: 500 }
        );
    }

    const match = getMatch(matchId);
    if (!match) {
        return NextResponse.json(
            { error: "Partita non trovata" },
            { status: 404 }
        );
    }

    let payload: { password?: unknown; index?: unknown };
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body JSON non valido" },
            { status: 400 }
        );
    }

    if (typeof payload.password !== "string") {
        return NextResponse.json(
            { error: "Password mancante" },
            { status: 400 }
        );
    }

    if (payload.password !== adminPassword) {
        return NextResponse.json(
            { error: "Password non valida" },
            { status: 401 }
        );
    }

    if (typeof payload.index !== "number" || !Number.isInteger(payload.index)) {
        return NextResponse.json(
            { error: "Indice evento non valido" },
            { status: 400 }
        );
    }

    try {
        const client = await getRedisClient();
        const events = await readEvents(client, matchId);

        if (payload.index < 0 || payload.index >= events.length) {
            return NextResponse.json(
                { error: "Evento non trovato" },
                { status: 404 }
            );
        }

        events.splice(payload.index, 1);
        await writeEvents(client, matchId, events);

        return NextResponse.json({ events });
    } catch (error) {
        if (error instanceof Error && error.message === "Missing REDIS_URL") {
            return NextResponse.json(
                { error: "Variabile REDIS_URL non configurata" },
                { status: 500 }
            );
        }

        console.error("Events API error", error);
        return NextResponse.json(
            { error: "Impossibile eliminare l'evento" },
            { status: 500 }
        );
    }
}
