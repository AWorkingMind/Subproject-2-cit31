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
