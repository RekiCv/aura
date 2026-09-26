// ==========================================
// ESTADO
// ==========================================

let library = [];

let filteredLibrary = [];

let currentSongIndex = -1;

let editingSongIndex = -1;

let currentPlaylistSong = null;


// ==========================================
// ELEMENTOS
// ==========================================

const musicList =
    document.getElementById("musicList");

const songCount =
    document.getElementById("songCount");

const searchInput =
    document.getElementById("searchInput");

const sortSelect =
    document.getElementById("sortSelect");

const addMusicButton =
    document.getElementById("addMusicButton");

const emptyAddButton =
    document.getElementById("emptyAddButton");

const musicFileInput =
    document.getElementById("musicFileInput");


// PLAYER

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


// PLAYLISTS

const playlistList =
    document.getElementById("playlistList");

const newPlaylistButton =
    document.getElementById("newPlaylistButton");

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


// EDITAR

const editModal =
    document.getElementById("editModal");

const closeEditModal =
    document.getElementById(
        "closeEditModal"
    );

const cancelEdit =
    document.getElementById(
        "cancelEdit"
    );

const saveEdit =
    document.getElementById(
        "saveEdit"
    );

const editTitle =
    document.getElementById("editTitle");

const editArtist =
    document.getElementById("editArtist");

const editAlbum =
    document.getElementById("editAlbum");

const editAlbumArtist =
    document.getElementById(
        "editAlbumArtist"
    );

const editGenre =
    document.getElementById("editGenre");

const editYear =
    document.getElementById("editYear");

const editTrack =
    document.getElementById("editTrack");

const editDisc =
    document.getElementById("editDisc");

const editComposer =
    document.getElementById("editComposer");

const editComment =
    document.getElementById("editComment");


// AUDIO

const audio =
    new Audio();


// ==========================================
// BIBLIOTECA
// ==========================================

async function loadLibrary() {

    try {

        library =
            await window.pywebview.api.get_library();

        filteredLibrary =
            [...library];

        renderLibrary();

    } catch (error) {

        console.error(
            "Error cargando biblioteca:",
            error
        );

    }

}


// ==========================================
// PLAYLISTS DEL SIDEBAR
// ==========================================

async function loadPlaylists() {

    try {

        const playlists =
            await window.pywebview.api.get_playlists();

        renderSidebarPlaylists(
            playlists
        );

    } catch (error) {

        console.error(
            "Error cargando playlists:",
            error
        );

    }

}


function renderSidebarPlaylists(
    playlists
) {

    playlistList.innerHTML = "";


    if (
        !playlists ||
        playlists.length === 0
    ) {

        playlistList.innerHTML = `
            <div class="empty-playlists">
                Todavía no tienes listas.
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
                "playlist-item";


            button.innerHTML = `

                <span class="playlist-item-icon">
                    ♫
                </span>

                <span>
                    ${escapeHtml(
                        playlist.name
                    )}
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `playlist.html?id=${
                            encodeURIComponent(
                                playlist.id
                            )
                        }`;

                }
            );


            playlistList.appendChild(
                button
            );

        }
    );

}


// ==========================================
// RENDER BIBLIOTECA
// ==========================================

function renderLibrary() {

    musicList.innerHTML = "";


    if (
        filteredLibrary.length === 0
    ) {

        musicList.innerHTML = `

            <div class="empty-library">

                <div class="empty-icon">
                    ♫
                </div>

                <h3>
                    No se encontraron canciones
                </h3>

                <p>
                    Prueba con otra búsqueda.
                </p>

            </div>

        `;

        songCount.textContent =
            "0 canciones";

        return;
    }


    songCount.textContent =
        `${filteredLibrary.length} ${
            filteredLibrary.length === 1
                ? "canción"
                : "canciones"
        }`;


    filteredLibrary.forEach(
        song => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "music-item";


            const originalIndex =
                library.findIndex(
                    librarySong =>
                        librarySong.name ===
                        song.name
                );


            item.innerHTML = `

                <div class="music-art">
                    ♫
                </div>


                <div class="music-main">

                    <strong>
                        ${escapeHtml(
                            song.title
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            song.artist ||
                            "Artista desconocido"
                        )}
                    </span>

                </div>


                <div class="music-album">

                    ${escapeHtml(
                        song.album ||
                        "Sin álbum"
                    )}

                </div>


                <div class="music-actions">

                    <button
                        class="play-song"
                        title="Reproducir"
                    >
                        ▶
                    </button>


                    <button
                        class="edit-song"
                        title="Editar metadatos"
                    >
                        ✎
                    </button>


                    <button
                        class="playlist-song"
                        title="Añadir a playlist"
                    >
                        ⋮
                    </button>

                </div>

            `;


            const playSong =
                item.querySelector(
                    ".play-song"
                );

            const editSong =
                item.querySelector(
                    ".edit-song"
                );

            const playlistSong =
                item.querySelector(
                    ".playlist-song"
                );


            playSong.addEventListener(
                "click",
                () => {

                    playSongFromLibrary(
                        originalIndex
                    );

                }
            );


            editSong.addEventListener(
                "click",
                () => {

                    openEditModal(
                        originalIndex
                    );

                }
            );


            playlistSong.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openPlaylistMenu(
                        song
                    );

                }
            );


            musicList.appendChild(
                item
            );

        }
    );

}


// ==========================================
// MENÚ DE PLAYLISTS
// ==========================================

async function openPlaylistMenu(song) {

    currentPlaylistSong =
        song;


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

                        addSongToPlaylist(
                            playlist.id,
                            song
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


async function addSongToPlaylist(
    playlistId,
    song
) {

    try {

        const result =
            await window.pywebview.api
                .add_song_to_playlist(
                    playlistId,
                    song.name
                );


        if (!result.success) {

            alert(result.error);

            return;
        }


        closePlaylistMenuWindow();


        showToast(
            `"${song.title}" añadida a la playlist.`
        );


    } catch (error) {

        console.error(
            "Error añadiendo canción:",
            error
        );

        alert(
            "No se pudo añadir la canción."
        );

    }

}


// ==========================================
// NUEVA PLAYLIST DESDE BIBLIOTECA
// ==========================================

function openNewPlaylist() {

    window.location.href =
        "menu.html";

}


// ==========================================
// CERRAR MENÚ PLAYLIST
// ==========================================

function closePlaylistMenuWindow() {

    playlistMenuOverlay.classList.remove(
        "open"
    );

    currentPlaylistSong =
        null;

}


// ==========================================
// EDITAR METADATOS
// ==========================================

function openEditModal(index) {

    editingSongIndex =
        index;


    const song =
        library[index];


    editTitle.value =
        song.title || "";

    editArtist.value =
        song.artist || "";

    editAlbum.value =
        song.album || "";

    editAlbumArtist.value =
        song.album_artist || "";

    editGenre.value =
        song.genre || "";

    editYear.value =
        song.year || "";

    editTrack.value =
        song.track || "";

    editDisc.value =
        song.disc || "";

    editComposer.value =
        song.composer || "";

    editComment.value =
        song.comment || "";


    editModal.classList.add(
        "open"
    );

}


function closeEditModalWindow() {

    editModal.classList.remove(
        "open"
    );

    editingSongIndex =
        -1;

}


async function saveMetadata() {

    if (
        editingSongIndex < 0
    ) {
        return;
    }


    const index =
        editingSongIndex;

    const song =
        library[index];


    const metadata = {

        title:
            editTitle.value,

        artist:
            editArtist.value,

        album:
            editAlbum.value,

        albumartist:
            editAlbumArtist.value,

        genre:
            editGenre.value,

        date:
            editYear.value,

        tracknumber:
            editTrack.value,

        discnumber:
            editDisc.value,

        composer:
            editComposer.value,

        comment:
            editComment.value

    };


    saveEdit.disabled =
        true;


    try {

        const result =
            await window.pywebview.api
                .update_metadata(
                    song.name,
                    metadata
                );


        if (!result.success) {

            alert(
                result.error
            );

            return;
        }


        closeEditModalWindow();

        await loadLibrary();


        showToast(
            "Metadatos guardados."
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            "No se pudieron guardar los cambios."
        );

    } finally {

        saveEdit.disabled =
            false;

    }

}


// ==========================================
// BÚSQUEDA
// ==========================================

function applySearch() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {

        filteredLibrary =
            [...library];

    } else {

        filteredLibrary =
            library.filter(
                song => {

                    return (

                        song.title
                            .toLowerCase()
                            .includes(query)

                        ||

                        song.artist
                            .toLowerCase()
                            .includes(query)

                        ||

                        song.album
                            .toLowerCase()
                            .includes(query)

                        ||

                        song.album_artist
                            .toLowerCase()
                            .includes(query)

                        ||

                        song.genre
                            .toLowerCase()
                            .includes(query)

                    );

                }
            );

    }


    applySort();

}


function applySort() {

    const sort =
        sortSelect.value;


    if (sort === "name") {

        filteredLibrary.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title,
                    "es",
                    {
                        sensitivity: "base"
                    }
                )
        );

    }


    renderLibrary();

}


// ==========================================
// REPRODUCTOR
// ==========================================

function playSongFromLibrary(index) {

    const song =
        library[index];


    if (!song) {
        return;
    }


    currentSongIndex =
        index;


    audio.src =
        song.url;


    audio.play();


    currentTitle.textContent =
        song.title;


    currentArtist.textContent =
        song.artist ||
        "Artista desconocido";


    playButton.textContent =
        "Ⅱ";


    saveRecentSong(song);

}


function togglePlay() {

    if (!audio.src) {
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
// HISTORIAL
// ==========================================

function saveRecentSong(song) {

    let recent =
        JSON.parse(
            localStorage.getItem(
                "aura_recent"
            ) || "[]"
        );


    recent =
        recent.filter(
            item =>
                item.name !== song.name
        );


    recent.unshift({
        name: song.name,
        title: song.title,
        artist: song.artist,
        album: song.album
    });


    recent =
        recent.slice(0, 10);


    localStorage.setItem(
        "aura_recent",
        JSON.stringify(recent)
    );

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
        2200
    );

}


// ==========================================
// UTILIDAD
// ==========================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ==========================================
// EVENTOS
// ==========================================

addMusicButton.addEventListener(
    "click",
    () => {

        musicFileInput.click();

    }
);


emptyAddButton.addEventListener(
    "click",
    () => {

        musicFileInput.click();

    }
);


musicFileInput.addEventListener(
    "change",
    async () => {

        const added =
            await window.pywebview.api
                .select_music();


        if (added.length > 0) {

            await loadLibrary();

        }


        musicFileInput.value =
            "";

    }
);


searchInput.addEventListener(
    "input",
    applySearch
);


sortSelect.addEventListener(
    "change",
    applySort
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


// PLAYLIST MENU

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
    openNewPlaylist
);


// NUEVA PLAYLIST SIDEBAR

newPlaylistButton.addEventListener(
    "click",
    openNewPlaylist
);


// MODAL EDICIÓN

closeEditModal.addEventListener(
    "click",
    closeEditModalWindow
);


cancelEdit.addEventListener(
    "click",
    closeEditModalWindow
);


saveEdit.addEventListener(
    "click",
    saveMetadata
);


editModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            editModal
        ) {

            closeEditModalWindow();

        }

    }
);


// AUDIO

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


// ==========================================
// INICIO
// ==========================================

window.addEventListener(
    "pywebviewready",
    async () => {

        await loadLibrary();

        await loadPlaylists();

    }
);