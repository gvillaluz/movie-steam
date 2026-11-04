const CONSUMET_URL = "https://api.consumet.org/anime/zoro";

export const searchConsumetAnime = async (title) => {
    const response = await fetch(
        `${CONSUMET_URL}/${title}`
    );

    return response.json();
};


export const getConsumetEpisodes = async (id) => {
    const response = await fetch(
        `${CONSUMET_URL}/info?id=${id}`
    );

    return response.json();
};


export const getConsumetVideo = async (episodeId) => {
    const response = await fetch(
        `${CONSUMET_URL}/watch/${episodeId}`
    );

    return response.json();
};