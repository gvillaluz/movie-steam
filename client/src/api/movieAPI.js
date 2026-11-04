import axios from "axios";

export const loadMovies = async ({ signal } = {}) => {
    const response = await axios.get("/api/catalog/movies/popular", { signal });
    if (!Array.isArray(response.data?.items)) {
        throw new Error("Invalid movie catalog response");
    }
    return response.data.items;
};
