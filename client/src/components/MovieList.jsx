import { useContext, useEffect } from "react";
import MovieCard from "./MovieCard";
import './MovieList.css';
import { SearchContext } from "../context/searchContext";
import { useLocation } from "react-router-dom";

const MovieList = (props) => {
    const { contents, loading, error, loadCatalog, reload, searchResults } = useContext(SearchContext);
    const location = useLocation();
    const type = String(props.type).toLowerCase() === "series" ? "TV Series" : "Movies";

    useEffect(() => {
        void loadCatalog(props.type);
    }, [loadCatalog, props.type, location.pathname]);

    if (loading) {
        return (
            <div className="loading" role="status">
                <div className="loader"></div>
                <h3>Loading {type}.....</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className="no-content" role="alert">
                <h2>{error}</h2>
                <button type="button" onClick={() => { void reload(); }}>Try again</button>
            </div>
        );
    }

    if (contents.length === 0) {
        return (
            <div className="no-content">
                <h2>{searchResults ? "No Search Results Found." : `No ${type.toLowerCase()} found.`}</h2>
            </div>
        );
    }

    return (
        <div className="main-content">
            <h1>
                {searchResults
                    ? `Search Results for '${searchResults}'`
                    : location.pathname !== "/" ? `Popular ${type}` : ""}
            </h1>
            <div className="movie-list">
                {contents.map(content => <MovieCard key={content.id} content={content} type={props.type} />)}
            </div>
        </div>
    );
};

export default MovieList;
