export type TeamName = "AS Camurria" | "Ludopathikos" | "Roxy Bar" | "FC Tocco" | "Chinesis Gym & Al Gaia" | "Zozzons7" | "FC Beck's" | "Armalions" | "Gli Approvati" | "Q.T. I Tacusam" | "Bar Oscar" | "Fanta-Evento";

export type Member = {
    name: string;
    team: TeamName;
    role: "player" | "goalkeeper" | "pres";
};

export type Team = {
    name: string;
    logo: string;
};


export type Match = {
    id: string;
    type: MatchType;
    homeTeam: TeamName;
    awayTeam: TeamName;
    date: Date; // ISO date string
    events?: MatchEvent[];
};

export type Standing = {
    team: TeamName;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
};

export type FantaRoster = {
    fullname: string;
    name: string;
    players: {
        member: string;
        team: TeamName;
    }[]
}

type MatchType = { type: "regular", round: number } | { type: "playoff", stage: "quarterfinals" | "semifinals" | "finals" };

export type MatchEvent =
    | GoalEvent
    | NoGoalEvent
    | CardEvent
    | SaveEvent
    | GoalReceivedEvent
    | DirectorHugEvent
    | ExultationEvent
    | OneShotBeerEvent
    | StartEvent
    | EndEvent
    | ShotoutVictoryEvent

type CardEvent = {
    type: "card";
    member: string;
    cardType: "yellow" | "red";
};

type ShotoutVictoryEvent = {
    type: "shotoutVictory";
    homeScore: number;
    awayScore: number;
    winningTeam?: TeamName;
};

type StartEvent = {
    type: "start";
    when: Date
}

type EndEvent = {
    type: "end";
    when: Date
}

type GoalEvent = {
    type: "goal";
    from: "activePlay" | "penalty" | "shotout" | "ownGoal" | "double";
    member: string;
};

type NoGoalEvent = {
    type: "noGoal";
    from: "penalty" | "shotout";
    member: string;
};

type GoalReceivedEvent = {
    type: "goalReceived";
    member: string;
};

type SaveEvent = {
    type: "save";
    from: "penalty" | "shotout";
    member: string;
};

type DirectorHugEvent = {
    type: "hug";
    member: string;
};

type ExultationEvent = {
    type: "exultation";
    member: string;
};

type OneShotBeerEvent = {
    type: "oneShotBeer";
    member: string;
};