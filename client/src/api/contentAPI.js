import axios from "axios";
import { API_KEY, API_URL } from "./tmdbConfig";

export const searchById = async (id, category) => {
    if (!id) return null;
    
    try {
        const response = await axios.get(`${API_URL}/${category}/${id}?api_key=${API_KEY}`);
        const video = await axios.get(`${API_URL}/${category}/${id}/videos?api_key=${API_KEY}`);
        const trailer = video.data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
        const data = response.data;

        const value = {
            data,
            trailer
        }
        
        return value;
    } catch (err) {
        console.log(err);
        return null;
    }
}

export const getSimilarContent = async (category, id) =>  {
    const similar = await axios.get(`${API_URL}/${category}/${id}/recommendations?api_key=${API_KEY}`);

    return similar.data.results ?? null;
}

export const getVideoById = async (id, category) => {
    try {
        const data = await axios.get(`${API_URL}/${category}/${id}?api_key=${API_KEY}`);

        return data.data;
    } catch (e) {
        console.log(e);
        return null;
    }
}
