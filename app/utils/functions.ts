import { MATCHES } from "../data/matches";
import { MEMBERS } from "../data/members";
import { TEAMS } from "../data/teams";
import { Match, MatchEvent, Standing } from "./types";

export function getAllMembersFromTeam(teamName: string) {
    return MEMBERS.filter((member) => member.team === teamName);
}

export function calculateResult(
    match: Match,
): { homeScore: number; awayScore: number; isInProgress: boolean } | undefined {
    if (match.events && match.events!.length > 0) {
        let homeScore = 0;
        let awayScore = 0;
        const homeMembers = getAllMembersFromTeam(match.homeTeam).map(
            (member) => member.name
        );
        const awayMembers = getAllMembersFromTeam(match.awayTeam).map(
            (member) => member.name
        );

        match.events.forEach((event) => {
            const goalValue = event.type === "goal" ? (event.from === "double" ? 2 : 1) : 0;
            if (event.type === "goal" && event.from !== "ownGoal") {
                if (homeMembers.includes(event.member)) {
                    homeScore += goalValue;
                } else if (awayMembers.includes(event.member)) {
                    awayScore += goalValue;
                }
            } else if (event.type === "goal" && event.from === "ownGoal") {
                if (homeMembers.includes(event.member)) {
                    awayScore += goalValue;
                } else if (awayMembers.includes(event.member)) {
                    homeScore += goalValue;
                }
            }
        });

        const start = match.events.find((e) => e.type === "start")?.when;
        const end = match.events.find((e) => e.type === "end")?.when;

        return { homeScore, awayScore, isInProgress: start !== undefined && end === undefined };
    } else {
        return undefined;
    }
}


export function calculateStandings(matches: Match[]): Standing[] {
    const standingsMap: { [teamName: string]: Standing } = {};

    matches.forEach((match) => {
        if (!standingsMap[match.homeTeam]) {
            standingsMap[match.homeTeam] = {
                team: match.homeTeam,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
            };
        }

        if (!standingsMap[match.awayTeam]) {
            standingsMap[match.awayTeam] = {
                team: match.awayTeam,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
            };
        }

        const result = calculateResult(match);
        if (!result) {
            return;
        }

        const { homeScore, awayScore } = result;

        const homeStanding = standingsMap[match.homeTeam];
        const awayStanding = standingsMap[match.awayTeam];

        homeStanding.played += 1;
        awayStanding.played += 1;

        homeStanding.goalsFor += homeScore;
        homeStanding.goalsAgainst += awayScore;
        awayStanding.goalsFor += awayScore;
        awayStanding.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
            homeStanding.wins += 1;
            homeStanding.points += 3;
            awayStanding.losses += 1;
        } else if (homeScore < awayScore) {
            awayStanding.wins += 1;
            awayStanding.points += 3;
            homeStanding.losses += 1;
        } else {
            homeStanding.draws += 1;
            awayStanding.draws += 1;
            homeStanding.points += 1;
            awayStanding.points += 1;
        }
    });

    const standings = Object.values(standingsMap);

    standings.forEach((standing) => {
        standing.goalDifference =
            standing.goalsFor - standing.goalsAgainst;
    });

    standings.sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }
        if (b.goalDifference !== a.goalDifference) {
            return b.goalDifference - a.goalDifference;
        }
        if (b.goalsFor !== a.goalsFor) {
            return b.goalsFor - a.goalsFor;
        }
        return a.team.localeCompare(b.team);
    });

    return standings;
}

export function getLogoByTeamName(name: string) {
    return TEAMS.find((e) => e.name === name)?.logo;
}

// Calculate player points based on match events and using calculateBonusByEvent
export function calculatePlayerPoints(
    eventsByMatch?: Record<string, MatchEvent[]>
): Map<string, number> {
    const playerPoints: Map<string, number> = new Map();

    MATCHES.forEach((match) => {
        const events = eventsByMatch?.[match.id] ?? match.events ?? [];

        events
            .filter((event): event is MatchEvent & { member: string } => "member" in event)
            .forEach((event) => {
                const participatingMember = MEMBERS.find(
                    (member) =>
                        member.name === event.member &&
                        (member.team === match.homeTeam || member.team === match.awayTeam)
                );

                if (!participatingMember) {
                    return;
                }

                const bonus = calculateBonusByEvent(
                    event,
                    participatingMember.role === "pres"
                );
                const key = `${event.member}$${participatingMember.team}`; // Unique key per member and team

                playerPoints.set(key, (playerPoints.get(key) ?? 0) + bonus);
            });
    });

    return playerPoints;
}

export function calculateBonusByEvent(matchEvent: MatchEvent, isPres: boolean): number {
    switch (matchEvent.type) {
        case "goal":
            if (matchEvent.from === "ownGoal") {
                return -3;
            } else
                return 3;
        case "card":
            if (matchEvent.cardType === "yellow") {
                return -1;
            } else if (matchEvent.cardType === "red") {
                return -3;
            }
            return 0;
        case "noGoal":
            if (isPres) {
                return -3;
            }
            return -2;
        case "goalReceived":
            return -1;
        case "save":
            return 2;
        case "hug":
            return 1;
        case "exultation":
            if (isPres) {
                return 3;
            } else {
                return 0;
            }
        case "oneShotBeer":
            return 1;
        default:
            return 0;
    }
}