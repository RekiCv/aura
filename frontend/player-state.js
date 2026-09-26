// ==========================================
// REPRODUCTOR COMPARTIDO
// ==========================================
// Un unico elemento de audio para toda la app.
// Cada pagina lo usa en vez de crear el suyo,
// asi la musica no se corta al cambiar de menu.
//
// Tambien vive aqui el motor de
// recomendaciones: cuando una cancion
// termina y no hay nada mas en la cola,
// se busca una relacionada y sigue sola.

const PLAYER_STATE_KEY =
    "aura_player_state";

const AUTO_RECOMMEND_KEY =
    "aura_auto_recommend";

const RECENT_KEY =
    "aura_recent_ids";

const RECENT_MAX = 24;

const RELATED_TRIES = 5;

const playerAudio =
    new Audio();

playerAudio.volume = 0.65;

let playerMeta = {
    title: "",
    artist: "",
    videoId: "",
    source: ""
};

let lastSaveTime = 0;

let nextHandler = null;

let lookingRelated = false;


// ==========================================
// ETIQUETAS DEL REPRODUCTOR
// ==========================================

function getPlayerLabels() {

    return {
        title: document.getElementById(
            "currentTitle"
        ),

        artist: document.getElementById(
            "currentArtist"
        ),

        play: document.getElementById(
            "playButton"
        )
    };

}


function readPlayerLabels() {

    const labels =
        getPlayerLabels();


    if (
        labels.title &&
        labels.title.textContent.trim()
    ) {

        playerMeta.title =
            labels.title.textContent.trim();

    }


    if (
        labels.artist &&
        labels.artist.textContent.trim()
    ) {

        playerMeta.artist =
            labels.artist.textContent.trim();

    }

}


// ==========================================
// AVISO
// ==========================================

function playerToast(
    message
) {

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
// HISTORIAL DE SONADOS
// ==========================================

function getRecentIds() {

    try {

        const list =
            JSON.parse(
                localStorage.getItem(
                    RECENT_KEY
                ) || "[]"
            );

        return Array.isArray(list)
            ? list
            : [];

    } catch (error) {

        return [];

    }

}


function rememberId(
    videoId
) {

    if (!videoId) {

        return;

    }


    const list =
        getRecentIds().filter(
            (id) => id !== videoId
        );

    list.unshift(
        videoId
    );


    try {

        localStorage.setItem(
            RECENT_KEY,
            JSON.stringify(
                list.slice(
                    0,
                    RECENT_MAX
                )
            )
        );

    } catch (error) {

        console.error(error);

    }

}


// ==========================================
// RECOMENDACIONES
// ==========================================

function isAutoRecommend() {

    try {

        const value =
            localStorage.getItem(
                AUTO_RECOMMEND_KEY
            );

        return value !== "0";

    } catch (error) {

        return true;

    }

}


function paintRecommendButton() {

    const button =
        document.getElementById(
            "autoRecommendButton"
        );

    if (!button) {

        return;

    }


    const active =
        isAutoRecommend();

    button.classList.toggle(
        "active",
        active
    );

    button.title =
        active
            ? "Recomendaciones automáticas activadas"
            : "Recomendaciones automáticas desactivadas";

    button.setAttribute(
        "aria-pressed",
        active
            ? "true"
            : "false"
    );

}


function setAutoRecommend(
    active
) {

    try {

        localStorage.setItem(
            AUTO_RECOMMEND_KEY,
            active
                ? "1"
                : "0"
        );

    } catch (error) {

        console.error(error);

    }

    paintRecommendButton();

    playerToast(
        active
            ? "Recomendaciones automáticas activadas."
            : "Recomendaciones automáticas desactivadas."
    );

}


function setTrack(
    meta
) {

    const data =
        meta || {};

    playerMeta = {
        title:
            data.title ||
            "",
        artist:
            data.artist ||
            "",
        videoId:
            data.videoId ||
            "",
        source:
            data.source ||
            ""
    };

    rememberId(
        playerMeta.videoId
    );

    savePlayerState(
        true
    );

}


function setNextHandler(
    handler
) {

    nextHandler =
        handler || null;

}


function clearNextHandler() {

    nextHandler = null;

}


async function playRecommended() {

    if (lookingRelated) {

        return;

    }


    if (
        typeof window.pywebview ===
            "undefined" ||
        !window.pywebview.api
    ) {

        return;

    }


    if (
        navigator.onLine === false
    ) {

        playerToast(
            "Sin conexión: no hay recomendaciones."
        );

        return;

    }

    lookingRelated = true;

    playerToast(
        "Buscando canciones relacionadas..."
    );


    let items = [];

    try {

        const result =
            await window.pywebview.api
                .get_related(
                    playerMeta.videoId || "",
                    playerMeta.title || "",
                    playerMeta.artist || ""
                );

        if (
            result &&
            result.success
        ) {

            items =
                result.items || [];

        }

    } catch (error) {

        console.error(
            "No se pudieron buscar relacionadas:",
            error
        );

    }


    const recent =
        getRecentIds();

    const fresh =
        items.filter(
            (item) =>
                item &&
                item.videoId &&
                !recent.includes(
                    item.videoId
                )
        );

    const ordered = [
        ...fresh,
        ...items
    ];

    const candidates = [];

    for (const item of ordered) {

        if (
            item &&
            item.videoId &&
            !candidates.some(
                (other) =>
                    other.videoId ===
                    item.videoId
            )
        ) {

            candidates.push(
                item
            );

        }

        if (
            candidates.length >=
            RELATED_TRIES
        ) {

            break;

        }

    }


    for (const item of candidates) {

        try {

            const stream =
                await window.pywebview.api
                    .get_online_stream(
                        item.videoId
                    );

            if (
                !stream ||
                !stream.success
            ) {

                continue;

            }


            playerMeta = {
                title:
                    item.title || "",
                artist:
                    item.artist || "",
                videoId:
                    item.videoId,
                source:
                    "online"
            };

            rememberId(
                item.videoId
            );

            // Las etiquetas se pintan antes de
            // tocar el audio: el evento "play"
            // vuelve a leerlas y si no, se
            // quedarian con la cancion anterior.

            paintPlayerLabels();

            playerAudio.src =
                stream.url;

            await playerAudio.play();

            savePlayerState(
                true
            );

            lookingRelated = false;

            return;

        } catch (error) {

            console.error(
                "No se pudo reproducir la relacionada:",
                error
            );

        }

    }

    lookingRelated = false;

    playerToast(
        "No se encontraron canciones relacionadas."
    );

}


function handleEnded() {

    if (nextHandler) {

        nextHandler();

        return;

    }


    if (!isAutoRecommend()) {

        return;

    }

    playRecommended();

}


function paintPlayerLabels() {

    const labels =
        getPlayerLabels();


    if (
        labels.title &&
        playerMeta.title
    ) {

        labels.title.textContent =
            playerMeta.title;

    }


    if (
        labels.artist &&
        playerMeta.artist
    ) {

        labels.artist.textContent =
            playerMeta.artist;

    }


    if (labels.play) {

        labels.play.textContent =
            playerAudio.paused
                ? "▶"
                : "Ⅱ";

    }

}


// ==========================================
// GUARDAR ESTADO
// ==========================================

function savePlayerState(force) {

    if (!playerAudio.src) {
        return;
    }


    const now = Date.now();

    if (
        !force &&
        now - lastSaveTime < 1500
    ) {

        return;

    }

    lastSaveTime = now;

    readPlayerLabels();


    try {

        localStorage.setItem(
            PLAYER_STATE_KEY,
            JSON.stringify({

                src: playerAudio.src,

                currentTime:
                    playerAudio.currentTime || 0,

                volume: playerAudio.volume,

                playing: !playerAudio.paused,

                title: playerMeta.title,

                artist: playerMeta.artist,

                videoId:
                    playerMeta.videoId,

                source:
                    playerMeta.source

            })
        );

    } catch (error) {

        console.error(
            "No se pudo guardar el estado:",
            error
        );

    }

}


// ==========================================
// RESTAURAR ESTADO
// ==========================================

function restorePlayer() {

    let state = null;


    try {

        state = JSON.parse(
            localStorage.getItem(
                PLAYER_STATE_KEY
            ) || "null"
        );

    } catch (error) {

        state = null;

    }


    if (
        !state ||
        !state.src
    ) {

        return false;

    }


    playerMeta = {
        title: state.title || "",
        artist: state.artist || "",
        videoId: state.videoId || "",
        source: state.source || ""
    };


    const resume = () => {

        if (state.currentTime) {

            try {

                playerAudio.currentTime =
                    state.currentTime;

            } catch (error) {

                console.error(
                    "No se pudo recuperar la posicion:",
                    error
                );

            }

        }


        if (state.playing) {

            playerAudio.play()
                .catch(() => {

                    console.error(
                        "No se pudo continuar la reproduccion"
                    );

                });

        }

    };


    playerAudio.src =
        state.src;

    playerAudio.volume =
        state.volume ?? 0.65;


    if (playerAudio.readyState >= 1) {

        resume();

    } else {

        playerAudio.addEventListener(
            "loadedmetadata",
            resume,
            {once: true}
        );

    }


    paintPlayerLabels();

    return true;

}


// ==========================================
// OLVIDAR (NUEVA EJECUCION)
// ==========================================

function forgetPlayer() {

    try {

        localStorage.removeItem(
            PLAYER_STATE_KEY
        );

    } catch (error) {

        console.error(error);

    }

    playerAudio.removeAttribute("src");

    playerMeta = {
        title: "",
        artist: "",
        videoId: "",
        source: ""
    };

}


// ==========================================
// GUARDADO AUTOMATICO
// ==========================================

playerAudio.addEventListener(
    "timeupdate",
    () => {

        savePlayerState();

    }
);


playerAudio.addEventListener(
    "play",
    () => {

        savePlayerState(true);

    }
);


playerAudio.addEventListener(
    "pause",
    () => {

        savePlayerState(true);

    }
);


playerAudio.addEventListener(
    "ended",
    () => {

        savePlayerState(
            true
        );

        handleEnded();

    }
);


playerAudio.addEventListener(
    "volumechange",
    () => {

        savePlayerState(true);

    }
);


window.addEventListener(
    "beforeunload",
    () => {

        savePlayerState(true);

    }
);


window.addEventListener(
    "pagehide",
    () => {

        savePlayerState(true);

    }
);


// ==========================================
// BOTÓN DE RADIO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        paintRecommendButton();

        const button =
            document.getElementById(
                "autoRecommendButton"
            );

        if (button) {

            button.addEventListener(
                "click",
                () => {

                    setAutoRecommend(
                        !isAutoRecommend()
                    );

                }
            );

        }

    }
);


// ==========================================
// API
// ==========================================

window.AuraPlayer = {

    audio: playerAudio,

    restore: restorePlayer,

    save: savePlayerState,

    forget: forgetPlayer,

    setTrack: setTrack,

    setNextHandler: setNextHandler,

    clearNextHandler: clearNextHandler,

    playRecommended: playRecommended,

    isAutoRecommend: isAutoRecommend,

    setAutoRecommend: setAutoRecommend

};
