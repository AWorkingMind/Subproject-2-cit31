import type { TitleDetailsRow } from "../types/TitleDetailsRow.js";
import type { PersonRow } from "../types/PersonRow.js";
import type { CreditDetailsRow } from "../types/CreditDetailsRow.js";
import type { CoPlayerRow } from "../types/CoPlayerRow.js";
import type { PaginatedDto } from "../types/PaginatedDto.js";
import type { CoPlayerDto } from "../types/CoPlayerDto.js";
import type { CreditDto } from "../types/CreditDto.js";
import type { TitleDTO } from "../types/TitleDTO.js";
import type { PersonDto } from "../types/PersonDto.js";
import type { BookmarkRow } from "../types/BookmarkRow.js";
import type { RatingHistoryRow } from "../types/RatingHistoryRow.js";
import type { SearchHistoryRow } from "../types/SearchHistoryRow.js";

function titleUri(tconst: string): string {
    return `/api/titles/${encodeURIComponent(tconst)}`;
}

function personUri(nconst: string): string {
    return `/api/people/${encodeURIComponent(nconst)}`;
}

export function toTitleReference<T extends { tconst: string }>(row: T) {
    return { ...row, uri: titleUri(row.tconst) };
}

export function toPersonReference<T extends { nconst: string }>(row: T) {
    return { ...row, uri: personUri(row.nconst) };
}

export function bookmarkUri(id: number): string {
    return `/api/bookmarks/${id}`;
}

export function toBookmarkDto(row: BookmarkRow) {
    return {
        ...row,
        uri: bookmarkUri(row.bookmark_id),
        titleUri: row.tconst === null ? null : titleUri(row.tconst),
        personUri: row.nconst === null ? null : personUri(row.nconst),
    };
}

export function toRatingHistoryDto(row: RatingHistoryRow) {
    return { ...row, uri: `/api/history/ratings/${row.rating_id}`, titleUri: titleUri(row.tconst) };
}

export function toSearchHistoryDto(row: SearchHistoryRow) {
    return { ...row, uri: `/api/history/search/${row.search_id}` };
}

export function toWordReference<T extends { word: string }>(row: T, path: string, filters: Record<string, string> = {}) {
    const query = new URLSearchParams({ ...filters, word: row.word });
    return { ...row, uri: `${path}?${query}` };
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
        personUri: personUri(row.nconst),
        name: row.primaryName,
        frequency,
    };
}

export function toCreditDto(credit: CreditDetailsRow): CreditDto {
    return {
        personUri: personUri(credit.nconst),
        name: credit.primaryName,
        ordering: credit.ordering,
        category: credit.category,
        job: credit.job,
        character: credit.character,
        knownFor: credit.knownFor,
    };
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
    const uri = titleUri(title.tconst);

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

export function toPersonDto(person: PersonRow): PersonDto {
    const uri = personUri(person.nconst);

    return {
        uri,
        name: person.primaryName,
        birthYear: person.birthYear === null ? null : Number(person.birthYear),
        deathYear: person.deathYear === null ? null : Number(person.deathYear),
        coPlayersUri: `${uri}/co-players`,
        wordsUri: `${uri}/words`,
    };
}
