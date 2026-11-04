import { getSimilarContent } from "../../../api/contentAPI";
import MovieCard from "../../../components/MovieCard";
import { useState, useEffect } from 'react'

const RelatedContent = ({category, id}) => {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState([]);

    useEffect(() => {
        const getRelatedContent = async () => {
            const data = await getSimilarContent(category, id);
            setContent(data);
            setLoading(false);
        }

        getRelatedContent();
    }, []); 
    
    const uniqueContents = Array.from(
        new Map(content.map((con) => [con.id, con])).values()
    );

    const newContent = uniqueContents.filter(con => 
        con.id !== Number(id) &&
        con.poster_path &&
        (con.release_date || con.first_air_date) && 
        (con.title || con.name)
    );

    return (
        (!loading ? (
            (newContent.length !== 0 &&
                <>
                    <h3>More Like This</h3>
                    <div className="related-list">
                        {newContent.map((content) => {
                            if (!content.release_date && !content.first_air_date) {
                                console.log("INVALID ITEM:", content);
                            }

                            return content.poster_path && (
                                <MovieCard
                                    key={content.id}
                                    content={content}
                                />
                            );
                        })}
                    </div> 
                </>
            )
        ) : (
            <div className="loading">
                <div className="loader"></div>
                <h3>Loading {category}.....</h3>
            </div>

        ))
    )
}

export default RelatedContent;