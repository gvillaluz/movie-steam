import axios from "axios";
import { API_KEY, API_URL } from "./tmdbConfig";

export const loadSeries = async () => {
    let series = [];
    try {
        for (let i = 1; i <= 5; i++) {
            const response = await axios.get(`${API_URL}/tv/popular?api_key=${API_KEY}&page=${i}`);
            series.push(...response.data.results);
        }
        return series;
    } catch (err) {
        console.log(err);
        return null;
    }
}

export const getEpisodesBySeason = async (id, season) => {
    try {
        const data = await axios.get(`${API_URL}/tv/${id}/season/${season}?api_key=${API_KEY}`);

        return data.data;
    } catch (e) {
        console.log(e);
        return null;
    }
}
