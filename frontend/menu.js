// ==========================================
// ESTADO
// ==========================================

let onlineResults = [];

let currentOnlineIndex = -1;


// ==========================================
// ELEMENTOS
// ==========================================

const playlistList =
    document.getElementById("playlistList");

const newPlaylistButton =
    document.getElementById("newPlaylistButton");

const playlistModal =
    document.getElementById("playlistModal");

const closePlaylistModal =
    document.getElementById("closePlaylistModal");

const cancelPlaylistButton =
    document.getElementById("cancelPlaylistButton");

const createPlaylistButton =
    document.getElementById("createPlaylistButton");

const playlistNameInput =
    document.getElementById("playlistNameInput");


const playlistMenuOverlay =
    document.getElementById(
        "playlistMenuOverlay"
    );

const playlistMenuList =
    document.getElementById(
        "playlistMenuList"
    );

const closePlaylistMenu =
    document.getElementById(
        "closePlaylistMenu"
    );

const createPlaylistFromMenu =
    document.getElementById(
        "createPlaylistFromMenu"
    );

let pendingOnlineSong = null;


// MÚSICA ONLINE

const onlineSearchInput =
    document.getElementById("onlineSearchInput");

const onlineSearchButton =
    document.getElementById("onlineSearchButton");

const onlineSection =
    document.getElementById("onlineSection");

const onlineList =
    document.getElementById("onlineList");

const onlineStatus =
    document.getElementById("onlineStatus");


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
// PLAYLISTS
// ==========================================

async function loadPlaylists() {

    try {

        const playlists =
            await window.pywebview.api.get_playlists();

        renderPlaylists(playlists);

    } catch (error) {

        console.error(
            "Error cargando playlists:",
            error
        );

    }

}


function renderPlaylists(playlists) {

    playlistList.innerHTML = "";

    if (!playlists || playlists.length === 0) {

        playlistList.innerHTML = `
            <div class="empty-playlists">
                Todavía no tienes listas.
            </div>
        `;

        return;
    }


    playlists.forEach(playlist => {

        const button =
            document.createElement("button");

        button.className = "playlist-item";

        button.innerHTML = `
            <span class="playlist-item-icon">
                ♫
            </span>

            <span>
                ${escapeHtml(playlist.name)}
            </span>
        `;


        button.addEventListener(
            "click",
            () => {

                openPlaylist(
                    playlist.id
                );

            }
        );


        playlistList.appendChild(button);

    });

}


// ==========================================
// CREAR PLAYLIST
// ==========================================

function openCreatePlaylistModal() {

    playlistNameInput.value = "";

    playlistModal.classList.add(
        "open"
    );

    setTimeout(() => {

        playlistNameInput.focus();

    }, 50);

}


function closeCreatePlaylistModal() {

    playlistModal.classList.remove(
        "open"
    );

}


async function createPlaylist() {

    const name =
        playlistNameInput.value.trim();


    if (!name) {

        playlistNameInput.focus();

        return;
    }


    createPlaylistButton.disabled = true;


    try {

        const result =
            await window.pywebview.api.create_playlist(
                name
            );


        if (!result.success) {

            alert(result.error);

            return;
        }


        closeCreatePlaylistModal();


        if (pendingOnlineSong) {

            await window.pywebview.api
                .add_online_song_to_playlist(
                    result.playlist.id,
                    {
                        videoId:
                            pendingOnlineSong.videoId,

                        title:
                            pendingOnlineSong.title,

                        artist:
                            pendingOnlineSong.artist
                    }
                );

            pendingOnlineSong = null;

        }


        await loadPlaylists();


        openPlaylist(
            result.playlist.id
        );


    } catch (error) {

        console.error(
            "Error creando playlist:",
            error
        );

        alert(
            "No se pudo crear la playlist."
        );

    } finally {

        createPlaylistButton.disabled = false;

    }

}


// ==========================================
// ABRIR PLAYLIST
// ==========================================

function openPlaylist(playlistId) {

    window.location.href =
        `playlist.html?id=${encodeURIComponent(playlistId)}`;

}


// ==========================================
// AÑADIR CANCIÓN ONLINE A PLAYLIST
// ==========================================

async function openPlaylistMenu(song) {

    if (!song || !song.videoId) {

        showToast(
            "Ese resultado no se puede añadir."
        );

        return;

    }


    pendingOnlineSong = song;


    playlistMenuList.innerHTML = `
        <div class="playlist-loading">
            Cargando listas...
        </div>
    `;


    playlistMenuOverlay.classList.add(
        "open"
    );


    try {

        const playlists =
            await window.pywebview.api.get_playlists();


        playlistMenuList.innerHTML = "";


        if (
            !playlists ||
            playlists.length === 0
        ) {

            playlistMenuList.innerHTML = `
                <div class="playlist-empty-message">
                    No tienes ninguna playlist.
                </div>
            `;

            return;

        }


        playlists.forEach(
            playlist => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.className =
                    "playlist-choice";


                button.innerHTML = `

                    <span class="playlist-choice-icon">
                        ♫
                    </span>

                    <span class="playlist-choice-name">
                        ${escapeHtml(
                            playlist.name
                        )}
                    </span>

                    <span class="playlist-choice-arrow">
                        +
                    </span>

                `;


                button.addEventListener(
                    "click",
                    () => {

                        addOnlineSongToPlaylist(
                            playlist.id,
                            pendingOnlineSong
                        );

                    }
                );


                playlistMenuList.appendChild(
                    button
                );

            }
        );

    } catch (error) {

        console.error(
            error
        );

        playlistMenuList.innerHTML = `
            <div class="playlist-empty-message">
                No se pudieron cargar las playlists.
            </div>
        `;

    }

}


async function addOnlineSongToPlaylist(
    playlistId,
    song
) {

    if (!song) {
        return;
    }


    try {

        const result =
            await window.pywebview.api
                .add_online_song_to_playlist(
                    playlistId,
                    {
                        videoId: song.videoId,
                        title: song.title,
                        artist: song.artist
                    }
                );


        if (!result.success) {

            showToast(
                result.error
            );

            return;

        }


        closePlaylistMenuWindow();


        showToast(
            `"${song.title}" añadida a la playlist.`
        );


    } catch (error) {

        console.error(
            "Error añadiendo canción online:",
            error
        );

        showToast(
            "No se pudo añadir la canción."
        );

    }

}


function closePlaylistMenuWindow() {

    playlistMenuOverlay.classList.remove(
        "open"
    );

    pendingOnlineSong = null;

}


// ==========================================
// MÚSICA ONLINE
// ==========================================

async function searchOnline() {

    const query =
        onlineSearchInput.value.trim();


    if (!query) {

        showToast(
            "Escribe algo para buscar."
        );

        onlineSearchInput.focus();

        return;

    }


    onlineSearchButton.disabled = true;

    onlineSearchButton.textContent =
        "...";

    onlineSection.hidden = false;

    onlineStatus.textContent =
        "Buscando...";

    onlineList.innerHTML = `
        <div class="online-message">
            Buscando "${escapeHtml(query)}"...
        </div>
    `;


    try {

        const result =
            await window.pywebview.api
                .search_online(query);


        if (!result.success) {

            onlineStatus.textContent = "";

            onlineList.innerHTML = `
                <div class="online-message">
                    ${escapeHtml(result.error)}
                </div>
            `;

            return;

        }


        onlineResults =
            result.items || [];


        onlineStatus.textContent =
            `${onlineResults.length} resultados`;


        renderOnlineResults();


    } catch (error) {

        console.error(
            "Error buscando música online:",
            error
        );

        onlineStatus.textContent = "";

        onlineList.innerHTML = `
            <div class="online-message">
                No se pudo conectar con AURA.
            </div>
        `;

    } finally {

        onlineSearchButton.disabled = false;

        onlineSearchButton.textContent =
            "Buscar";

    }

}


function renderOnlineResults() {

    onlineList.innerHTML = "";


    if (onlineResults.length === 0) {

        onlineList.innerHTML = `
            <div class="online-message">
                No se encontró nada.
            </div>
        `;

        return;

    }


    onlineResults.forEach(
        (item, index) => {

            const row =
                document.createElement("div");

            row.className =
                "online-item";

            if (index === currentOnlineIndex) {

                row.classList.add(
                    "playing"
                );

            }
            row.innerHTML = `

                <button
                    class="online-play"
                    title="Reproducir"
                >
                    ▶
                </button>


                <div class="online-main">

                    <strong>
                        ${escapeHtml(item.title)}
                    </strong>

                    <span>
                        ${escapeHtml(item.artist)}
                    </span>

                </div>


                <button
                    class="online-add"
                    title="Añadir a una playlist"
                >
                    +
                </button>

            `;


            row.querySelector(
                ".online-add"
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openPlaylistMenu(item);

                }
            );


            row.addEventListener(
                "click",
                () => {

                    playOnlineResult(index);

                }
            );



            onlineList.appendChild(
                row
            );

        }
    );

}


async function playOnlineResult(index) {

    const item =
        onlineResults[index];


    if (!item) {

        return;

    }


    if (!item.videoId) {

        showToast(
            "Ese resultado no se puede reproducir."
        );

        return;

    }


    currentOnlineIndex = index;

    renderOnlineResults();


    currentTitle.textContent =
        item.title;

    currentArtist.textContent =
        item.artist;

    window.AuraPlayer.setTrack({

        title: item.title,

        artist: item.artist,

        videoId: item.videoId,

        source: "online"

    });

    playButton.textContent =
        "Ⅱ";

    showToast(
        "Obteniendo audio..."
    );


    try {

        const stream =
            await window.pywebview.api
                .get_online_stream(
                    item.videoId
                );


        if (!stream.success) {

            showToast(stream.error);

            return;

        }


        audio.src =
            stream.url;

        audio.volume =
            audio.volume || 0.65;

        await audio.play();


    } catch (error) {

        console.error(
            "Error reproduciendo:",
            error
        );

        showToast(
            "No se pudo reproducir la canción."
        );

    }

}


// ==========================================
// REPRODUCTOR
// ==========================================

function togglePlay() {

    if (!audio.src) {

        showToast(
            "Busca una canción primero."
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


// ==========================================
// TOAST
// ==========================================

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
        2600
    );

}


// ==========================================
// UTILIDADES
// ==========================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ==========================================
// EVENTOS
// ==========================================

onlineSearchButton.addEventListener(
    "click",
    searchOnline
);


onlineSearchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            searchOnline();

        }

    }
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
    "ended",
    () => {

        playButton.textContent =
            "▶";

    }
);


newPlaylistButton.addEventListener(
    "click",
    openCreatePlaylistModal
);


closePlaylistModal.addEventListener(
    "click",
    closeCreatePlaylistModal
);


cancelPlaylistButton.addEventListener(
    "click",
    closeCreatePlaylistModal
);


createPlaylistButton.addEventListener(
    "click",
    createPlaylist
);


closePlaylistMenu.addEventListener(
    "click",
    closePlaylistMenuWindow
);


playlistMenuOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            playlistMenuOverlay
        ) {

            closePlaylistMenuWindow();

        }

    }
);


createPlaylistFromMenu.addEventListener(
    "click",
    () => {

        closePlaylistMenuWindow();

        openCreatePlaylistModal();

        playlistNameInput.focus();

    }
);


playlistNameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            createPlaylist();

        }

        if (event.key === "Escape") {

            closeCreatePlaylistModal();

        }

    }
);


playlistModal.addEventListener(
    "click",
    event => {

        if (
            event.target === playlistModal
        ) {

            closeCreatePlaylistModal();

        }

    }
);


// ==========================================
// INICIO
// ==========================================

window.addEventListener(
    "pywebviewready",
    () => {

        window.AuraPlayer.restore();

        loadPlaylists();

    }
);
