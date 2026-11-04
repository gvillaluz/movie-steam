import { useEffect, useState } from "react";
import { searchById } from "../../api/contentAPI";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Details from './components/Details'
import Trailer from "./components/Trailer";
import './DescriptionPage.css'
import MovieList from "../../components/MovieList";
import RelatedContent from "./components/RelatedContent";

const DescriptionPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const [content, setContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [category, setCateogry] = useState("");

    useEffect(() => {
        const getContent = async () => {
            const category = location.pathname.includes("movie") ? "movie" :
                 location.pathname.includes("series") ? "tv" : "";

            setCateogry(category);

            const data = await searchById(id, category);
            setContent(data);
            setLoading(false);
        }

        getContent();
    }, [id, location.pathname]);

    const handleWatchNow = () => {
        navigate(`/watch/${category}/${content.data.id}`);
    }

    return (
        (!loading ? (
            <div className="description">
                <Details content={content.data} handleWatchNow={handleWatchNow}/>
                {content.trailer && <Trailer video={content.trailer.key} />}
                <div className="description-section related">
                    <RelatedContent relatedContent={content.data.genres} category={category} id={content.data.id} />
                </div>
            </div>
        ) : (
            <div className="loading">
                <div className="loader"></div>
                <h3>Loading.....</h3>
            </div>

        ))
    )
}

export default DescriptionPage;