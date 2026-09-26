// ==========================================
// ESTADO
// ==========================================

const params =
    new URLSearchParams(window.location.search);

const playlistId =
    params.get("id");

let currentPlaylist = null;

let library = [];

let queue = [];

let queueIndex = -1;

let playingKey = null;


// ==========================================
// ELEMENTOS
// ==========================================

const playlistName =
    document.getElementById("playlistName");

const playlistCount =
    document.getElementById("playlistCount");

const playlistSongs =
    document.getElementById("playlistSongs");

const deletePlaylistButton =
    document.getElementById("deletePlaylistButton");

const playAllButton =
    document.getElementById("playAllButton");

const offlineNote =
    document.getElementById("offlineNote");


// REPRODUCTOR

const currentTitle =
    document.getElementById("currentTitle");

const currentArtist =
    document.getElementById("currentArtist");

const playButton =
    document.getElementById("playButton");

const rewindButton =
    document.getElementById("rewindButton");

const forwardButton =
    document.getElementById("forwardButton");

const currentTime =
    document.getElementById("currentTime");

const duration =
    document.getElementById("duration");

const progressBar =
    document.getElementById("progressBar");

const progressFill =
    document.getElementById("progressFill");

const volumeLine =
    document.getElementById("volumeLine");

const volumeFill =
    document.getElementById("volumeFill");


// AUDIO

const audio =
    window.AuraPlayer.audio;


// ==========================================
// CONEXIÓN
// ==========================================

function isOnline() {

    return navigator.onLine !== false;

}


// ==========================================
// CARGAR PLAYLIST
// ==========================================

async function loadPlaylist() {

    if (!playlistId) {

        window.location.href =
            "menu.html";

        return;

    }


    try {

        currentPlaylist =
            await window.pywebview.api.get_playlist(
                playlistId
            );


        if (!currentPlaylist) {

            alert(
                "La playlist no existe."
            );

            window.location.href =
                "menu.html";

            return;

        }


        library =
            await window.pywebview.api.get_library();


        renderPlaylist();

    } catch (error) {

        console.error(
            "Error cargando playlist:",
            error
        );

    }

}


// ==========================================
// CANCIONES DE LA PLAYLIST
// ==========================================

function getPlaylistTracks() {

    const tracks = [];


    if (!currentPlaylist) {
        return tracks;
    }


    (currentPlaylist.songs || []).forEach(
        filename => {

            const song =
                library.find(
                    item =>
                        item.name === filename
                );


            if (!song) {
                return;
            }


            tracks.push({

                key: `local:${song.name}`,

                type: "local",

                name: song.name,

                title: song.title,

                artist: song.artist,

                album: song.album,

                url: song.url

            });

        }
    );


    (currentPlaylist.online || []).forEach(
        item => {

            if (
                !item ||
                !item.videoId
            ) {
                return;
            }


            tracks.push({

                key: `online:${item.videoId}`,

                type: "online",

                videoId: item.videoId,

                title:
                    item.title ||
                    "Sin título",

                artist:
                    item.artist ||
                    "Artista desconocido",

                album: ""

            });

        }
    );


    return tracks;

}


// ==========================================
// COLA DE REPRODUCCIÓN
// ==========================================

function buildQueue(fromIndex = 0) {

    const tracks =
        getPlaylistTracks();

    const online =
        isOnline();


    queue =
        tracks
            .slice(fromIndex)
            .filter(
                track =>
                    track.type === "local" ||
                    online
            );

    return queue;

}


function countSkipped() {

    return getPlaylistTracks().filter(
        track =>
            track.type === "online" &&
            !isOnline()
    ).length;

}


// ==========================================
// RENDER
// ==========================================

function renderPlaylist() {

    playlistName.textContent =
        currentPlaylist.name;


    const tracks =
        getPlaylistTracks();


    const onlineCount =
        tracks.filter(
            track =>
                track.type === "online"
        ).length;


    playlistCount.textContent =
        onlineCount > 0
            ? `${tracks.length} ${
                tracks.length === 1
                    ? "canción"
                    : "canciones"
            } · ${onlineCount} online`
            : `${tracks.length} ${
                tracks.length === 1
                    ? "canción"
                    : "canciones"
            }`;


    offlineNote.hidden =
        !(
            onlineCount > 0 &&
            !isOnline()
        );


    if (tracks.length === 0) {

        playlistSongs.innerHTML = `

            <div class="empty-playlist">

                <div class="empty-icon">
                    ♫
                </div>

                <h2>
                    Esta playlist está vacía
                </h2>

                <p>
                    Añade canciones desde tu biblioteca
                    o desde la búsqueda online.
                </p>

                <button
                    class="library-button"
                    onclick="window.location.href='menu.html'"
                >
                    Ir a Inicio
                </button>

            </div>

        `;

        return;

    }


    playlistSongs.innerHTML = "";


    tracks.forEach(
        (track, index) => {

            const item =
                document.createElement("div");

            item.className =
                "song-item";

            if (track.type === "online") {

                item.classList.add(
                    "online"
                );

            }


            if (
                track.type === "online" &&
                !isOnline()
            ) {

                item.classList.add(
                    "offline"
                );

            }


            if (track.key === playingKey) {

                item.classList.add(
                    "playing"
                );

            }


            const meta =
                track.type === "online"
                    ? `<span class="song-badge">
                        ONLINE
                    </span>`
                    : `<div class="song-album">
                        ${escapeHtml(
                            track.album || "Sin álbum"
                        )}
                    </div>`;


            item.innerHTML = `

                <div class="song-number">
                    ${index + 1}
                </div>

                <div class="song-main">

                    <strong>
                        ${escapeHtml(track.title)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            track.artist ||
                            "Artista desconocido"
                        )}
                    </span>

                </div>

                ${meta}

                <button
                    class="remove-song"
                    title="Quitar de la playlist"
                >
                    ×
                </button>

            `;


            item.addEventListener(
                "click",
                () => {

                    if (
                        track.type === "online" &&
                        !isOnline()
                    ) {

                        showToast(
                            "Sin conexión: las canciones online se omiten."
                        );

                        return;

                    }


                    startFrom(index);

                }
            );


            item.querySelector(
                ".remove-song"
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    removeTrack(track);

                }
            );


            playlistSongs.appendChild(
                item
            );

        }
    );

}


// ==========================================
// REPRODUCIR
// ==========================================

function startFrom(trackIndex) {

    const previous =
        buildQueue(trackIndex);

    const skipped =
        countSkipped();


    if (previous.length === 0) {

        showToast(
            "No hay canciones que reproducir."
        );

        return;

    }


    if (
        skipped > 0 &&
        !isOnline()
    ) {

        showToast(
            `Sin conexión: ${skipped} ${
                skipped === 1
                    ? "canción online omitida"
                    : "canciones online omitidas"
            }.`
        );

    }


    queueIndex = 0;

    playCurrent();

}


function playAll() {

    startFrom(0);

}


async function playCurrent() {

    const track =
        queue[queueIndex];


    if (!track) {

        stopPlayback();

        return;

    }


    playingKey =
        track.key;

    renderPlaylist();


    currentTitle.textContent =
        track.title;

    currentArtist.textContent =
        track.artist;

    window.AuraPlayer.setTrack({

        title: track.title,

        artist: track.artist,

        videoId:
            track.type === "online"
                ? track.videoId
                : "",

        source: track.type

    });

    window.AuraPlayer.setNextHandler(
        playNext
    );

    playButton.textContent =
        "Ⅱ";


    if (track.type === "local") {

        audio.src =
            track.url;

        await safePlay();

        return;

    }


    if (!isOnline()) {

        showToast(
            "Sin conexión: se omite la canción."
        );

        playNext();

        return;

    }


    showToast(
        "Obteniendo audio..."
    );


    try {

        const stream =
            await window.pywebview.api
                .get_online_stream(
                    track.videoId
                );


        if (!stream.success) {

            showToast(
                stream.error
            );

            playNext();

            return;

        }


        audio.src =
            stream.url;

        await safePlay();

    } catch (error) {

        console.error(
            "Error reproduciendo:",
            error
        );

        playNext();

    }

}


async function safePlay() {

    try {

        await audio.play();

    } catch (error) {

        console.error(
            "No se pudo reproducir:",
            error
        );

    }

}


function playNext() {

    if (queue.length === 0) {

        stopPlayback();

        return;

    }


    if (
        queueIndex + 1 >=
        queue.length
    ) {

        window.AuraPlayer
            .clearNextHandler();


        if (
            window.AuraPlayer
                .isAutoRecommend()
        ) {

            showToast(
                "Fin de la lista. Siguiendo con recomendaciones..."
            );

            window.AuraPlayer
                .playRecommended();

            return;

        }


        stopPlayback();

        showToast(
            "Fin de la lista."
        );

        return;

    }


    queueIndex += 1;

    playCurrent();

}


function togglePlay() {

    if (!audio.src) {

        showToast(
            "Reproduce alguna canción primero."
        );

        return;

    }


    if (audio.paused) {

        audio.play();

        playButton.textContent =
            "Ⅱ";

    } else {

        audio.pause();

        playButton.textContent =
            "▶";

    }

}


function stopPlayback() {

    window.AuraPlayer
        .clearNextHandler();

    audio.pause();

    audio.removeAttribute("src");

    playButton.textContent =
        "▶";

}


// ==========================================
// QUITAR CANCIÓN
// ==========================================

async function removeTrack(track) {

    const result =
        track.type === "online"

            ? await window.pywebview.api
                .remove_online_song_from_playlist(
                    playlistId,
                    track.videoId
                )

            : await window.pywebview.api
                .remove_song_from_playlist(
                    playlistId,
                    track.name
                );


    if (!result.success) {

        alert(result.error);

        return;

    }


    if (track.key === playingKey) {

        stopPlayback();

        playingKey = null;

    }


    currentPlaylist =
        result.playlist;

    queue = [];

    queueIndex = -1;

    renderPlaylist();

}


// ==========================================
// ELIMINAR PLAYLIST
// ==========================================

deletePlaylistButton.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                `¿Eliminar la playlist "${currentPlaylist.name}"?`
            );


        if (!confirmed) {
            return;
        }


        const result =
            await window.pywebview.api
                .delete_playlist(
                    playlistId
                );


        if (!result.success) {

            alert(result.error);

            return;

        }


        window.location.href =
            "menu.html";

    }
);


// ==========================================
// CONTROLES
// ==========================================

playAllButton.addEventListener(
    "click",
    playAll
);


playButton.addEventListener(
    "click",
    togglePlay
);


rewindButton.addEventListener(
    "click",
    () => {

        audio.currentTime =
            Math.max(
                0,
                audio.currentTime - 10
            );

    }
);


forwardButton.addEventListener(
    "click",
    () => {

        audio.currentTime =
            Math.min(
                audio.duration || 0,
                audio.currentTime + 10
            );

    }
);


progressBar.addEventListener(
    "click",
    event => {

        if (!audio.duration) {
            return;
        }


        const rect =
            progressBar.getBoundingClientRect();

        const percent =
            (
                event.clientX -
                rect.left
            ) / rect.width;

        audio.currentTime =
            audio.duration *
            percent;

    }
);


volumeLine.addEventListener(
    "click",
    event => {

        const rect =
            volumeLine.getBoundingClientRect();

        const percent =
            (
                event.clientX -
                rect.left
            ) / rect.width;

        audio.volume =
            Math.max(
                0,
                Math.min(
                    1,
                    percent
                )
            );


        volumeFill.style.width =
            `${audio.volume * 100}%`;

    }
);


audio.addEventListener(
    "timeupdate",
    updateProgress
);


audio.addEventListener(
    "loadedmetadata",
    updateProgress
);


audio.addEventListener(
    "play",
    () => {

        playButton.textContent =
            "Ⅱ";

    }
);


audio.addEventListener(
    "pause",
    () => {

        playButton.textContent =
            "▶";

    }
);


audio.addEventListener(
    "error",
    () => {

        const track =
            queue[queueIndex];


        if (
            !track ||
            track.type !== "online"
        ) {
            return;
        }


        playNext();

    }
);


window.addEventListener(
    "offline",
    () => {

        renderPlaylist();

    }
);


window.addEventListener(
    "online",
    () => {

        renderPlaylist();

    }
);


// ==========================================
// UTILIDAD
// ==========================================

function updateProgress() {

    currentTime.textContent =
        formatTime(
            audio.currentTime
        );


    duration.textContent =
        formatTime(
            audio.duration
        );


    if (
        audio.duration &&
        Number.isFinite(audio.duration)
    ) {

        const percent =
            (
                audio.currentTime /
                audio.duration
            ) * 100;

        progressFill.style.width =
            `${percent}%`;

    }

}


function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );

    const remaining =
        Math.floor(
            seconds % 60
        );


    return `${minutes}:${
        remaining
            .toString()
            .padStart(2, "0")
    }`;

}


function showToast(message) {

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "aura-toast";

    toast.textContent =
        message;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "show"
            );

        },
        10
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        2200
    );

}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ==========================================
// INICIO
// ==========================================

window.addEventListener(
    "pywebviewready",
    () => {

        window.AuraPlayer.restore();

        loadPlaylist();

    }
);
