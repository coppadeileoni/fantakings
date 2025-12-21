import { NextRequest, NextResponse } from "next/server";

const adminPassword = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
    if (!adminPassword) {
        return NextResponse.json(
            { error: "Variabile ADMIN_PASSWORD non configurata" },
            { status: 500 }
        );
    }

    let payload: { password?: unknown };
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body JSON non valido" },
            { status: 400 }
        );
    }

    if (typeof payload.password !== "string" || !payload.password.trim()) {
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

    return NextResponse.json({ success: true });
}
