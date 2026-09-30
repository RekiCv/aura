// ==========================================
// ARTISTA
// ==========================================
//
// Página de un artista de YouTube. Las
// canciones llegan con get_artist(), que
// lee la pestaña /videos del canal.
// ==========================================


// ==========================================
// ESTADO
// ==========================================

let artist = null;

let songs = [];

let queue = [];

let queueIndex = -1;

let playingId = "";

let artistTitle = "";


// ==========================================
// ELEMENTOS
// ==========================================

const artistName =
    document.getElementById("artistName");

const artistMeta =
    document.getElementById("artistMeta");

const artistAvatar =
    document.getElementById("artistAvatar");

const artistSongs =
    document.getElementById("artistSongs");

const playAllButton =
    document.getElementById("playAllButton");

const backButton =
    document.getElementById("backButton");

const playlistList =
    document.getElementById("playlistList");


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


const audio = window.AuraPlayer.audio;


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


function formatTime(seconds) {

    const total =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );

    const minutes =
        Math.floor(total / 60);

    const rest =
        total % 60;

    return `${minutes}:${String(rest).padStart(2, "0")}`;

}


function formatFollowers(count) {

    const numero = Number(count) || 0;

    if (numero >= 1000000) {
        return `${(numero / 1000000).toFixed(1).replace(".0", "")} M`;
    }

    if (numero >= 1000) {
        return `${(numero / 1000).toFixed(0)} mil`;
    }

    return `${numero}`;

}


function showToast(message) {

    let toast =
        document.getElementById("auraToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "auraToast";

        toast.className =
            "aura-toast";

        document.body.appendChild(toast);

    }

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer =
        setTimeout(
            () => toast.classList.remove("show"),
            2600
        );

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


// ==========================================
// CABECERA
// ==========================================

function renderHeader() {

    const nombre =
        artist?.name
        || artistTitle
        || "Artista";

    document.title =
        `AURA — ${nombre}`;

    artistName.textContent =
        nombre;


    const partes = [];

    if (artist?.verified) {
        partes.push("Verificado");
    }

    if (artist?.followers) {
        partes.push(
            `${formatFollowers(artist.followers)} seguidores`
        );
    }

    partes.push(
        songs.length === 1
            ? "1 canción"
            : `${songs.length} canciones`
    );

    artistMeta.textContent =
        partes.join(" · ");


    if (artist?.avatar) {

        const image =
            document.createElement("img");

        image.src =
            artist.avatar;

        image.alt =
            nombre;

        image.addEventListener(
            "error",
            () => image.remove()
        );

        artistAvatar.textContent = "";

        artistAvatar.appendChild(image);

    }

}


// ==========================================
// LISTA
// ==========================================

function renderSongs() {

    artistSongs.innerHTML = "";


    if (songs.length === 0) {

        artistSongs.innerHTML = `
            <div class="empty-playlist">

                <div class="empty-icon">
                    ♫
                </div>

                <h2>
                    Este artista no tiene canciones
                </h2>

                <p>
                    Puede que el canal no sea público
                    o que no tenga vídeos.
                </p>

            </div>
        `;

        return;

    }


    songs.forEach(
        (song, index) => {

            const row =
                document.createElement("div");

            row.className =
                "song-item";

            if (song.videoId === playingId) {
                row.classList.add("playing");
            }

            row.innerHTML = `
                <div class="song-number">
                    ${index + 1}
                </div>

                <div class="song-main">

                    <strong>
                        ${escapeHtml(song.title)}
                    </strong>

                    <span>
                        ${
                            song.duration
                                ? formatTime(song.duration)
                                : escapeHtml(song.artist || "YouTube")
                        }
                    </span>

                </div>

                <span class="song-badge">
                    YOUTUBE
                </span>
            `;

            row.addEventListener(
                "click",
                () => startFrom(index)
            );

            artistSongs.appendChild(row);

        }
    );

}


// ==========================================
// COLA
// ==========================================

function buildQueue(fromIndex = 0) {

    queue = songs.map(
        (song) => ({
            type: "online",
            key: song.videoId,
            videoId: song.videoId,
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            thumbnail: song.thumbnail
        })
    );

    queueIndex = fromIndex;

    window.AuraPlayer.setNextHandler(
        playNext
    );

}


function startFrom(index) {

    buildQueue(index);

    playCurrent();

}


function playAll() {

    if (songs.length === 0) {
        return;
    }

    startFrom(0);

}


async function playCurrent() {

    const song =
        queue[queueIndex];


    if (!song) {
        stopPlayback();
        return;
    }


    playingId =
        song.videoId;

    renderSongs();

    currentTitle.textContent =
        song.title;

    currentArtist.textContent =
        song.artist;

    window.AuraPlayer.setTrack({
        title: song.title,
        artist: song.artist,
        videoId: song.videoId,
        source: "online"
    });

    window.AuraPlayer.setNextHandler(
        playNext
    );

    playButton.textContent =
        "Ⅱ";

    showToast("Obteniendo audio...");


    try {

        const stream =
            await window.pywebview.api
                .get_online_stream(
                    song.videoId
                );


        if (!stream || !stream.success) {

            showToast(
                stream?.error
                || "No se pudo reproducir."
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

        showToast(
            "No se pudo reproducir la canción."
        );

    }

}


function playNext() {

    queueIndex += 1;

    if (queueIndex >= queue.length) {

        stopPlayback();

        return;

    }

    playCurrent();

}


function stopPlayback() {

    playingId = "";

    audio.removeAttribute("src");

    audio.load();

    playButton.textContent =
        "▶";

    currentTitle.textContent =
        "Nada reproduciéndose";

    currentArtist.textContent =
        "Selecciona una canción";

    renderSongs();

}


function togglePlay() {

    if (!audio.src) {
        return;
    }

    if (audio.paused) {
        safePlay();
        playButton.textContent = "Ⅱ";
        return;
    }

    audio.pause();

    playButton.textContent =
        "▶";

}


// ==========================================
// CARGAR
// ==========================================

function readParams() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const channel =
        (params.get("c") || "").trim();

    if (!/^UC[A-Za-z0-9_-]{22}$/.test(channel)) {
        return null;
    }

    return {
        channel,
        name:
            (params.get("n") || "").trim()
    };

}


async function loadArtist() {

    const params =
        readParams();

    if (!params) {

        artistName.textContent =
            "Artista no válido";

        artistMeta.textContent =
            "El enlace no apunta a ningún artista";

        artistSongs.innerHTML = `
            <div class="empty-playlist">

                <div class="empty-icon">
                    ♫
                </div>

                <h2>
                    No se pudo abrir este artista
                </h2>

                <p>
                    Vuelve al menú y busca de nuevo.
                </p>

            </div>
        `;

        return;

    }

    artistTitle =
        params.name;

    if (params.name) {
        artistName.textContent =
            params.name;
    }


    try {

        const result =
            await window.pywebview.api
                .get_artist(
                    params.channel,
                    50
                );


        if (!result || !result.success) {

            artistMeta.textContent =
                "No se pudo cargar";

            artistSongs.innerHTML = `
                <div class="empty-playlist">

                    <div class="empty-icon">
                        ♫
                    </div>

                    <h2>
                        ${escapeHtml(result?.error || "No se pudo leer el artista")}
                    </h2>

                </div>
            `;

            return;

        }

        artist =
            result.artist;

        songs =
            result.items || [];

        renderHeader();

        renderSongs();

    } catch (error) {

        console.error(
            "Error cargando el artista:",
            error
        );

        artistMeta.textContent =
            "No se pudo conectar con AURA";

        artistSongs.innerHTML = `
            <div class="empty-playlist">

                <div class="empty-icon">
                    ♫
                </div>

                <h2>
                    No se pudo conectar con AURA
                </h2>

            </div>
        `;

    }

}


// ==========================================
// LISTAS DEL SIDEBAR
// ==========================================

async function loadPlaylists() {

    try {

        const listas =
            await window.pywebview.api
                .get_playlists();

        if (!Array.isArray(listas)) {
            return;
        }

        playlistList.innerHTML = "";

        for (const lista of listas) {

            const button =
                document.createElement("button");

            button.className =
                "playlist-item";

            button.textContent =
                lista.name;

            button.addEventListener(
                "click",
                () => {
                    window.location.href =
                        "playlist.html?id="
                        + encodeURIComponent(lista.id);
                }
            );

            playlistList.appendChild(button);

        }

    } catch (error) {

        console.error(
            "Error cargando las listas:",
            error
        );

    }

}


// ==========================================
// REPRODUCTOR
// ==========================================

function updateProgress() {

    const total =
        audio.duration || 0;

    const actual =
        audio.currentTime || 0;

    currentTime.textContent =
        formatTime(actual);

    duration.textContent =
        formatTime(total);

    const percent =
        total
            ? (actual / total) * 100
            : 0;

    progressFill.style.width =
        `${percent}%`;

}


progressBar.addEventListener(
    "click",
    (event) => {

        if (!audio.duration) {
            return;
        }

        const rect =
            progressBar.getBoundingClientRect();

        const ratio =
            (event.clientX - rect.left)
            / rect.width;

        audio.currentTime =
            Math.max(
                0,
                Math.min(
                    1,
                    ratio
                )
            ) * audio.duration;

    }
);


volumeLine.addEventListener(
    "click",
    (event) => {

        const rect =
            volumeLine.getBoundingClientRect();

        const ratio =
            (event.clientX - rect.left)
            / rect.width;

        audio.volume =
            Math.max(
                0,
                Math.min(
                    1,
                    ratio
                )
            );

    }
);


playButton.addEventListener(
    "click",
    togglePlay
);

playAllButton.addEventListener(
    "click",
    playAll
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

backButton.addEventListener(
    "click",
    () => {
        window.location.href =
            "menu.html";
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
        playButton.textContent = "Ⅱ";
    }
);

audio.addEventListener(
    "pause",
    () => {
        playButton.textContent = "▶";
    }
);

// Las URLs de YouTube caducan. Si la
// cancion online se cae, se pasa a la
// siguiente en vez de quedarse muda.
audio.addEventListener(
    "error",
    () => {

        const song =
            queue[queueIndex];

        if (!song) {
            return;
        }

        playNext();

    }
);


function updateVolume() {

    volumeFill.style.width =
        `${(audio.volume || 0) * 100}%`;

}


audio.addEventListener(
    "loadedmetadata",
    () => {

        updateVolume();

        if (audio.src) {
            playButton.textContent = "Ⅱ";
        }

    }
);


updateVolume();


// ==========================================
// ARRANQUE
// ==========================================

window.addEventListener(
    "pywebviewready",
    () => {

        window.AuraPlayer.restore();

        loadArtist();

        loadPlaylists();

    }
);
