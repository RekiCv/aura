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
    loadPlaylists
);