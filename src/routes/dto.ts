import type { TitleDetailsRow } from "../data/titles.js";
import type { PersonRow } from "../types/PersonRow.js";
import type { CreditDetailsRow } from "../types/CreditRow.js";
import type { CoPlayerRow } from "../types/CoPlayerRow.js";
import type { PaginatedDto } from "../types/PaginatedDto.js";

export interface CoPlayerDto {
    personUri: string;
    name: string | null;
    frequency: number;
}

export function toCoPlayerCollectionDto(
    items: CoPlayerRow[],
    page: number,
    pageSize: number,
    hasNextPage: boolean
): PaginatedDto<CoPlayerDto> {
    return {
        items: items.map(toCoPlayerDto),
        page,
        pageSize,
        hasNextPage,
    };
}

export function toCoPlayerDto(row: CoPlayerRow): CoPlayerDto {
    const frequency = Number(row.frequency);

    if (!Number.isSafeInteger(frequency) || frequency < 0) {
        throw new Error("Co-player frequency must be a non-negative safe integer");
    }

    return {
        personUri: `/api/people/${encodeURIComponent(row.nconst)}`,
        name: row.primaryName,
        frequency,
    };
}

export interface CreditDto {
    personUri: string;
    name: string | null;
    ordering: number | null;
    category: string | null;
    job: string | null;
    character: string | null;
    knownFor: boolean;
}

export function toCreditDto(credit: CreditDetailsRow): CreditDto {
    return {
        personUri: `/api/people/${encodeURIComponent(credit.nconst)}`,
        name: credit.primaryName,
        ordering: credit.ordering,
        category: credit.category,
        job: credit.job,
        character: credit.character,
        knownFor: credit.knownFor,
    };
}

export interface TitleDTO {
    uri: string;
    titleType: string;
    primaryTitle: string;
    originalTitle: string | null;
    startYear: number | null;
    endYear: number | null;
    runtimeMinutes: number | null;
    plot: string | null;
    poster: string | null;
    genres: string[];
    averageRating: number | null;
    numVotes: number;
    creditsUri: string;
}

export function toTitleCollectionDto(
    items: TitleDetailsRow[],
    page: number,
    pageSize: number,
    hasNextPage: boolean
): PaginatedDto<TitleDTO> {
    return {
        items: items.map(toTitleDto),
        page,
        pageSize,
        hasNextPage,
    };
}

export function toTitleDto(title: TitleDetailsRow): TitleDTO {
    const uri = `/api/titles/${encodeURIComponent(title.tconst)}`;

    return {
        uri,
        titleType: title.titleTypeName,
        primaryTitle: title.primaryTitle,
        originalTitle: title.originalTitle,
        startYear: title.startYear === null ? null : Number(title.startYear),
        endYear: title.endYear === null ? null : Number(title.endYear),
        runtimeMinutes: title.runtimeMinutes,
        plot: title.plot,
        poster: title.poster,
        genres: title.genres,
        averageRating: title.averageRating,
        numVotes: title.numVotes,
        creditsUri: `${uri}/credits`,
    };
}

export function toPersonCollectionDto(
    items: PersonRow[],
    page: number,
    pageSize: number,
    hasNextPage: boolean
): PaginatedDto<PersonDto> {
    return {
        items: items.map(toPersonDto),
        page,
        pageSize,
        hasNextPage,
    };
}

export interface PersonDto {
    uri: string;
    name: string | null;
    birthYear: number | null;
    deathYear: number | null;
    coPlayersUri: string;
    wordsUri: string;
}

export function toPersonDto(person: PersonRow): PersonDto {
    const uri = `/api/people/${encodeURIComponent(person.nconst)}`;

    return {
        uri,
        name: person.primaryName,
        birthYear: person.birthYear === null ? null : Number(person.birthYear),
        deathYear: person.deathYear === null ? null : Number(person.deathYear),
        coPlayersUri: `${uri}/co-players`,
        wordsUri: `${uri}/words`,
    };
}

