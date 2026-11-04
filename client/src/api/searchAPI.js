import axios from "axios";
import { API_KEY, API_URL } from "./tmdbConfig";

export const search = async (searchQuery, pathname) => {
    if (pathname === "/" && pathname !== "/movie" && pathname !== "series") {
        pathname = "/multi";
    } else if (pathname === "/series") {
        pathname = "/tv";
    }
    
    try {
        const response = await axios.get(`${API_URL}/search${pathname}?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`);
        return response.data.results;
    } catch (err) {
        alert(err);
        return null;
    } 
}
