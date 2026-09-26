// ==========================================
// ESTADO
// ==========================================

const params =
    new URLSearchParams(window.location.search);

const playlistId =
    params.get("id");

let currentPlaylist = null;

let library = [];


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
// RENDER
// ==========================================

function renderPlaylist() {

    playlistName.textContent =
        currentPlaylist.name;


    const songs =
        getPlaylistSongs();


    playlistCount.textContent =
        `${songs.length} ${
            songs.length === 1
                ? "canción"
                : "canciones"
        }`;


    if (songs.length === 0) {

        playlistSongs.innerHTML = `

            <div class="empty-playlist">

                <div class="empty-icon">
                    ♫
                </div>

                <h2>
                    Esta playlist está vacía
                </h2>

                <p>
                    Añade canciones desde tu biblioteca.
                </p>

                <button
                    class="library-button"
                    onclick="window.location.href='library.html'"
                >
                    Ir a biblioteca
                </button>

            </div>

        `;

        return;
    }


    playlistSongs.innerHTML = "";


    songs.forEach(
        (song, index) => {

            const item =
                document.createElement("div");

            item.className =
                "song-item";


            item.innerHTML = `

                <div class="song-number">
                    ${index + 1}
                </div>

                <div class="song-main">

                    <strong>
                        ${escapeHtml(song.title)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            song.artist || "Artista desconocido"
                        )}
                    </span>

                </div>

                <div class="song-album">
                    ${escapeHtml(
                        song.album || "Sin álbum"
                    )}
                </div>

                <button
                    class="remove-song"
                    title="Quitar de la playlist"
                >
                    ×
                </button>

            `;


            const removeButton =
                item.querySelector(
                    ".remove-song"
                );


            removeButton.addEventListener(
                "click",
                () => {

                    removeSong(
                        song.name
                    );

                }
            );


            playlistSongs.appendChild(
                item
            );

        }
    );

}


// ==========================================
// OBTENER CANCIONES
// ==========================================

function getPlaylistSongs() {

    if (!currentPlaylist) {
        return [];
    }


    return currentPlaylist.songs
        .map(filename => {

            return library.find(
                song =>
                    song.name === filename
            );

        })
        .filter(Boolean);

}


// ==========================================
// ELIMINAR CANCIÓN
// ==========================================

async function removeSong(filename) {

    const result =
        await window.pywebview.api
            .remove_song_from_playlist(
                playlistId,
                filename
            );


    if (!result.success) {

        alert(result.error);

        return;
    }


    currentPlaylist =
        result.playlist;


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
// UTILIDAD
// ==========================================

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
    loadPlaylist
);