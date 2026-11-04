import { createContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog";

export const SearchContext = createContext();

export function SearchProvider({ children }) {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const { contents, loading, error, searchResults, loadCatalog, runSearch, reload } = useCatalog(location.pathname);
    const [favorites, setFavorites] = useState([]);
    const [isDescriptionPage, setIsDescriptionPage] = useState(false);

    useEffect(() => {
        const isDescription = !["/movie", "/series", "/favorites", "/"].includes(location.pathname);
        setIsDescriptionPage(isDescription);
    }, [location.pathname]);

    useEffect(() => {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    }, [])

    useEffect(() => {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }, [favorites])

    const addToFavorites = (movie) => {
        setFavorites(prev => {
            if (prev.some(content => content.id === movie.id)) {
                return prev.filter(fav => fav.id !== movie.id);
            }
            return [...prev, movie];
        });
    }

    const handleSearch = (e) => {
        e.preventDefault();
        void runSearch(searchQuery);
    }

    const value = {
        searchQuery, 
        contents,
        setSearchQuery,
        loadCatalog,
        loading,
        error,
        reload,
        handleSearch,
        favorites,
        addToFavorites,
        isDescriptionPage,
        setIsDescriptionPage,
        searchResults
    }

    return  (
        <SearchContext.Provider value={value} >
            { children }
        </SearchContext.Provider>
    )
}
