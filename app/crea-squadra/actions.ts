"use server";

import { JWT } from "google-auth-library";
import { Member } from "../utils/constants";
import { GoogleSpreadsheet } from "google-spreadsheet";

const SPREADSHEET_ID = "1uVO7wL5QlLj7fL-ZyxYoIsIvczZB52MGBw6m2yDyskA";
const SHEET_NAME = "risposte";

const ROLE_LABELS: Record<Member["role"], string> = {
    player: "Giocatore",
    goalkeeper: "Portiere",
    pres: "Presidente",
};

export type PersistSquadInput = {
    squadName: string;
    fullName: string;
    email: string;
    members: Member[];
};



const serviceAccount = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function testAuth() {
    const doc = new GoogleSpreadsheet(
        SPREADSHEET_ID,
        serviceAccount,
    );
    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByTitle[SHEET_NAME];
    console.log(sheet.title);
}

type RowValue = {
    createdAt: string;
    fullname: string;
    email: string;
    squadName: string;
    pres: string;
    goalkeeper: string;
    player1: string;
    player2: string;
    player3: string;
    player4: string;
}

export async function persistSquad({
    squadName,
    fullName,
    email,
    members,
}: PersistSquadInput) {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccount);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[SHEET_NAME];

    if (!sheet) {
        throw new Error(`Worksheet "${SHEET_NAME}" not found.`);
    }


    const formatter = new Intl.DateTimeFormat("it-IT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    const formatMemberCell = (member?: Member) =>
        member ? `${member.name} (${member.team})` : "";

    const president = members.find((member) => member.role === "pres");
    const goalkeeper = members.find((member) => member.role === "goalkeeper");
    const playerCells = members
        .filter((member) => member.role === "player")
        .slice(0, 4)
        .map((member) => formatMemberCell(member));

    while (playerCells.length < 4) {
        playerCells.push("");
    }

    const [player1, player2, player3, player4] = playerCells;

    const rowValues: RowValue = {
        createdAt: formatter.format(new Date()),
        squadName,
        fullname: fullName,
        email,
        pres: formatMemberCell(president),
        goalkeeper: formatMemberCell(goalkeeper),
        player1,
        player2,
        player3,
        player4,
    };
    await sheet.addRow(rowValues);

    // if (sheet.headerValues?.length) {
    //     const row: Record<string, string> = {};
    //     sheet.headerValues.forEach((header, index) => {
    //         if (header && rowValues[index] !== undefined) {
    //             row[header] = rowValues[index];
    //         }
    //     });
    //     await sheet.addRow(row);
    // } else {
    //     await sheet.addRow(rowValues);
    // }
}
