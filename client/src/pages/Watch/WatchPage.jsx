import { useParams, useNavigate } from 'react-router-dom';
import './WatchPage.css';
import { useEffect, useState } from 'react';
import { getEpisodesBySeason } from '../../api/seriesAPI';
import { getVideoById } from '../../api/contentAPI';
import { convertRuntime } from '../../utils/DurationUtils';
import RelatedContent from '../Description/components/RelatedContent';
import WatchPageRelated from './components/WatchPageRelated';

const WatchPage = () => {
    const { id, category } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState();
    const [episode, setEpisode] = useState(1);
    const [episodes, setEpisodes] = useState(null);
    const [season, setSeason] = useState(1);
    const [genres, setGenres] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenOverview, setIsOpenOverview] = useState(false);

    const isSeries = category === 'tv' ? true : false;

    useEffect(() => {
        const loadMovieDetail = async () => {
            const data = await getVideoById(id, category);

            setDetail(data);
            setGenres(data.genres);

            if (isSeries) {
                const saved = localStorage.getItem(`progress_${id}`);
                if (saved) {
                    const { season, episode } = JSON.parse(saved);

                    setSeason(season);
                    setEpisode(episode);
                }
            }

            setLoading(false);
        }

        loadMovieDetail();
    }, [id, category]);

    useEffect(() => {
        const getEpisodes = async () => {
            if (isSeries) {
                const episodesResult = await getEpisodesBySeason(id, season);
                const today = new Date();

                const episodeList = episodesResult.episodes
                    .filter(ep => 
                        ep.air_date && 
                        new Date(ep.air_date) <= today
                    ).map((ep, index) => ({
                        ...ep,
                        vidsrcEpisode: index + 1
                    }));

                setEpisodes(episodeList);
            }
        }

        getEpisodes();
    }, [season, isSeries]);

    const handleEpisodeClick = (selectedEpisode) => {
        setEpisode(selectedEpisode);

        localStorage.setItem(`progress_${id}`, JSON.stringify({
            season,
            episode: selectedEpisode
        }));
    }

    const handleSeasonChange = (selectedSeason) => {
        setSeason(selectedSeason);
        setEpisode(1);
        localStorage.setItem(`progress_${id}`, JSON.stringify({
            season: selectedSeason,
            episode: 1
        }));
    }

    const vidsrcMovie = `https://vidsrc.me/embed/movie/${id}`;
    const vidsrcSeries = `https://vidsrc.me/embed/tv/${id}/${season}/${episode}`;

    const vidsrcV2Movie = `https://vidsrc.to/embed/movie/${id}`;
    const vidsrcV2Series = `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;

    const embedMovie = `https://www.2embed.cc/embed/${id}`;
    const embedSeries = `https://www.2embed.cc/embedtv/${id}/${season}/${episode}`;

    const animeSeries = `https://vidsrc.cc/v2/embed/anime/tmdb${id}/${episode}/sub`;

    const series = `https://vsembed.ru/embed/tv/${id}/${season}/${episode}?ds_lang=en`;
    const movie = `https://vsembed.ru/embed/movie/${id}`;

    const videoSourceLink = isSeries ? series : movie;

    console.log('video URL:', videoSourceLink);
    console.log('season:', season, 'episode:', episode);

    return (
        <>
            <div className='watch-page-header'>
                <button 
                    className='back-btn mobile'
                    onClick={() => navigate(`/${isSeries ? 'series' : 'movies'}/${id}/${isSeries ? detail.original_name : detail.title}`)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left text-foreground" data-fg-d3bl8="0.8:1.19812:/src/app/App.tsx:118:13:3879:53:e:ChevronLeft::::::O1c" data-fgid-d3bl8=":r4:"><path d="m15 18-6-6 6-6"></path></svg>
                </button>
                <h2 className='title'>
                    NOW PLAYING
                </h2>
            </div>
            <div
                className='main-watch-container'
                allowFullScreen
            >
                <iframe
                    className='video'
                    src={videoSourceLink}
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    frameBorder={"0"}
                />
                {loading ? 
                    <div>
                        <div className='loader'></div>
                    </div>
                    :
                    <div className='detail-container'>
                        <button 
                            className='back-btn desktop'
                            onClick={() => navigate(`/${isSeries ? 'series' : 'movies'}/${id}/${isSeries ? detail.original_name : detail.title}`)}
                        >
                            ← Back
                        </button>
                        {isSeries 
                            ? <div
                                className='season-container'
                            >
                                <div className='title-and-ratings'>
                                    <h4>{detail.original_name}</h4>
                                    <p>{`⭐ ${detail.vote_average.toFixed(1)}`}</p>
                                </div>
                                <p className='sub-detail'>{`${detail.first_air_date.split('-')[0]}-${detail.last_air_date.split('-')[0]} | ${detail.number_of_seasons} Seasons | ${detail.origin_country}`}</p>
                                <div className='badges-container'>
                                    {genres.map((genre) => (
                                        <div key={genre.id} className='badges'>
                                            {genre.name}
                                        </div>
                                    ))}
                                </div>
                                <div className={`overview-container ${isOpenOverview ? 'viewing' : ''}`}>
                                    <p className='overview'>{detail.overview}</p>
                                </div>
                                <button 
                                    className='overview-toggle'
                                    onClick={() => setIsOpenOverview(!isOpenOverview)}
                                >
                                    {isOpenOverview ? 'Show less ▲' : 'Show more ▼'}
                                </button>
                                <div className="custom-select">
                                    <div className="selected" onClick={() => setIsOpen(!isOpen)}>
                                        Season {season} ▼
                                    </div>
                                    {isOpen && (
                                        <div className="options">
                                        {Array.from({ length: detail.number_of_seasons }, (_, i) => i + 1).map(num => (
                                            <div
                                            key={num}
                                            className={`option ${num === season ? 'active' : ''}`}
                                            onClick={() => { handleSeasonChange(num); setIsOpen(false); }}
                                            >
                                            Season {num}
                                            </div>
                                        ))}
                                        </div>
                                    )}
                                </div>
                                <div className='episode-container'>
                                    {episodes?.map(ep => (
                                        <div 
                                            key={ep.episode_number}
                                            className={`series ${ep.episode_number === episode ? 'current' : ""}`}
                                            onClick={() => handleEpisodeClick(ep.episode_number)}
                                        >
                                            <img
                                                src={`https://image.tmdb.org/t/p/w200${ep.still_path}`}
                                                className='episode-img'
                                            />
                                            <div className='episode-detail'>
                                                <div className='episode-count-container'>
                                                    <h4>{`E${ep.episode_number}`}</h4>
                                                    <p>{convertRuntime(ep.runtime)}</p>
                                                </div>
                                                <p className='episode-overview'>
                                                    {ep.overview}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            : <div>
                                <div className='movie-detail'>
                                    <div className='title-and-ratings'>
                                        <h4>{detail.title}</h4>
                                        <p>{`⭐ ${detail.vote_average.toFixed(1)}`}</p>
                                    </div>
                                    <p className='sub-detail'>{`${detail.release_date} | ${convertRuntime(detail.runtime)} | ${detail.origin_country}`}</p>
                                    <div className='badges-container'>
                                        {genres.map((genre) => (
                                            <div key={genre.id} className='badges'>
                                                {genre.name}
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`overview-container ${isOpenOverview ? 'viewing' : ''}`}>
                                        <p className='overview'>{detail.overview}</p>
                                    </div>
                                    <button 
                                        className='overview-toggle'
                                        onClick={() => setIsOpenOverview(!isOpenOverview)}
                                    >
                                        {isOpenOverview ? 'Show less ▲' : 'Show more ▼'}
                                    </button>
                                </div>
                            </div>
                        }
                        <WatchPageRelated category={isSeries ? 'tv' : 'movie'} id={id} />
                    </div>
                }
            </div>
        </>
    )
}

export default WatchPage;