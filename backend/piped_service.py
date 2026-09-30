# ==========================================
# AURA · MÚSICA ONLINE
# ==========================================
#
# ANTES: este servicio usaba Piped
# (https://piped.video).
#
# Piped ya no tiene instancias públicas
# que funcionen. De la lista oficial
# solo sobreviven dos, y devuelven
# el vídeo sin audio:
#
#   pipedapi.ducks.party     -> audioStreams: []
#   api.piped.private.coffee -> audioStreams: []
#
# Por eso AURA usa ahora yt-dlp,
# que sigue extrayendo el audio
# correctamente. La interfaz de este
# archivo no ha cambiado, así que
# piped_app_test.py y piped.html
# siguen funcionando igual.
# ==========================================

import re

import yt_dlp


# ==========================================
# AJUSTES
# ==========================================

ENGINE_NAME = "YouTube (yt-dlp)"


SEARCH_LIMIT = 20


TIMEOUT = 20


VIDEO_ID_PATTERN = re.compile(
    r"^[A-Za-z0-9_-]{1,64}$"
)


ERROR_PREFIX_PATTERN = re.compile(
    r"^ERROR:\s*"
    r"(\[[^\]]+\]\s*)?"
)


# ==========================================
# ERRORES
# ==========================================

def friendly_error(
    error
):
    text = str(
        error
    )


    text = ERROR_PREFIX_PATTERN.sub(
        "",
        text
    ).strip()


    # ==================================
    # TRADUCCIONES
    # ==================================

    translations = [

        (
            (
                "Sign in to confirm",
                "not a bot",
                "Sign in to view"
            ),

            "YouTube pide verificación. "
            "Prueba con otra canción."

        ),

        (
            "Private video",

            "Ese vídeo es privado."
        ),

        (
            (
                "video is unavailable",
                "Video unavailable",
                "has been removed"
            ),

            "Ese vídeo ya no está "
            "disponible."

        ),

        (
            (
                "members-only",
                "join this channel"
            ),

            "Ese vídeo es para "
            "miembros del canal."
        ),

        (
            (
                "This live event",
                "premieres in"
            ),

            "Ese vídeo aún no "
            "se ha emitido."
        ),

        (
            "HTTP Error 429",

            "YouTube está limitando "
            "las peticiones. Espera "
            "un momento."

        ),

        (
            (
                "Unable to download webpage",
                "Connection refused",
                "Name or service not known",
                "Temporary failure in name resolution"
            ),

            "No hay conexión con "
            "YouTube."

        ),

        (
            "Sign in",

            "YouTube pide verificación. "
            "Prueba con otra canción."
        )

    ]


    for patterns, message in translations:

        if isinstance(
            patterns,
            str
        ):

            patterns = (patterns,)


        for pattern in patterns:

            if pattern in text:

                return message


    if not text:

        return (
            "Error desconocido de yt-dlp."
        )


    return text


# ==========================================
# OPCIONES DE YOUTUBE-DL
# ==========================================

class QuietLogger:

    def debug(
        self,
        message
    ):
        pass


    def info(
        self,
        message
    ):
        pass


    def warning(
        self,
        message
    ):
        pass


    def error(
        self,
        message
    ):
        pass


def get_options(
    extract_flat=False
):
    return {

        "quiet": True,

        "no_warnings": True,

        "noprogress": True,

        "noplaylist": True,

        "skip_download": True,

        "socket_timeout": TIMEOUT,

        "ignoreerrors": False,

        "logger": QuietLogger(),

        "extract_flat": extract_flat

    }


# ==========================================
# MINIATURA
# ==========================================

def get_thumbnail(
    entry
):
    thumbnails = (
        entry.get(
            "thumbnails"
        )
        or []
    )


    if thumbnails:

        return (
            thumbnails[0].get(
                "url",
                ""
            )
        )


    video_id = (
        entry.get(
            "id",
            ""
        )
    )


    if video_id:

        return (
            "https://i.ytimg.com/vi/"
            f"{video_id}/hqdefault.jpg"
        )


    return ""


# ==========================================
# ARTISTA
# ==========================================

def get_artist(
    entry
):
    for key in (

        "channel",
        "uploader",
        "artist"

    ):

        value = (
            entry.get(
                key
            )
        )


        if value:

            return str(
                value
            )


    return "Desconocido"


# ==========================================
# CONVERTIR RESULTADO
# ==========================================

def get_channel_id(
    entry
):
    # channel_id es el "UC..." estable. uploader_id puede
    # ser el "@nombre" y cambiar en cualquier momento.
    for key in (
        "channel_id",
        "uploader_id"
    ):

        value = entry.get(
            key
        )

        if value:
            return str(
                value
            )

    return ""


def to_item(
    entry
):
    video_id = str(
        entry.get(
            "id",
            ""
        )
    )

    channel_id = get_channel_id(
        entry
    )

    return {

        "type": "youtube",

        "videoId": video_id,

        "title": str(
            entry.get(
                "title",
                "Sin título"
            )
        ),

        "artist": get_artist(
            entry
        ),

        "thumbnail": get_thumbnail(
            entry
        ),

        "duration": int(
            entry.get(
                "duration"
            )
            or 0
        ),

        "url": (
            "https://www.youtube.com"
            f"/watch?v={video_id}"
        ),

        # ==================================
        # ARTISTA
        # ==================================
        # yt-dlp ya devuelve esto en la
        # busqueda, asi que no cuesta
        # ninguna llamada extra.

        "channelId": channel_id,

        "channelName": str(
            entry.get(
                "channel"
            )
            or entry.get(
                "uploader"
            )
            or ""
        ),

        "channelVerified": bool(
            entry.get(
                "channel_is_verified"
            )
        ),

        "channelFollowers": int(
            entry.get(
                "channel_follower_count"
            )
            or 0
        ),

        "channelUrl": str(
            entry.get(
                "channel_url"
            )
            or entry.get(
                "uploader_url"
            )
            or ""
        ),

        "source": ENGINE_NAME,

        "pipedInstance": ENGINE_NAME

    }


# ==========================================
# CANCIONES DE UN ARTISTA
# ==========================================
#
# Se leen de la pestana "/videos" del
# canal. No hace falta el filtro de
# busqueda: con la URL del canal
# yt-dlp devuelve los ultimos(~0,8s).
# ==========================================

# Los canales de YouTube empiezan por "UC"
# y siguen con 22 caracteres.
CHANNEL_ID_PATTERN = re.compile(
    r"^UC[A-Za-z0-9_-]{22}$"
)


CHANNEL_LIMIT = 50


CHANNEL_FETCH = 60


# Directos y videos de mas de 15 minutos
# no son canciones: se descartan.
MAX_CHANNEL_SECONDS = 900


def get_avatar(
    data
):
    thumbnails = (
        data.get(
            "thumbnails"
        )
        or []
    )

    if not thumbnails:
        return ""

    # La ultima suele ser la de mayor
    # resolucion.
    return str(
        thumbnails[-1].get(
            "url",
            ""
        )
    )


def get_channel_options():

    options = get_options(
        extract_flat="in_playlist"
    )

    options["noplaylist"] = False

    options["playlistend"] = CHANNEL_FETCH

    return options


def is_usable_song(
    entry
):
    if not entry:
        return False

    if not entry.get("id"):
        return False

    duration = int(
        entry.get("duration")
        or 0
    )

    if (
        duration
        and duration > MAX_CHANNEL_SECONDS
    ):
        return False

    return True


def get_channel_videos(
    channel_id,
    limit=CHANNEL_LIMIT
):
    channel_id = str(
        channel_id or ""
    ).strip()

    if not CHANNEL_ID_PATTERN.match(
        channel_id
    ):
        return {
            "success": False,
            "error":
                "El identificador del "
                "artista no es valido.",
            "items": []
        }

    try:

        limit = int(limit)

    except (TypeError, ValueError):

        limit = CHANNEL_LIMIT

    limit = max(
        1,
        min(limit, CHANNEL_LIMIT)
    )

    url = (
        "https://www.youtube.com"
        f"/channel/{channel_id}/videos"
    )

    try:

        with yt_dlp.YoutubeDL(
            get_channel_options()
        ) as youtube_dl:

            data = youtube_dl.extract_info(
                url,
                download=False
            )

        if not data:
            return {
                "success": False,
                "error":
                    "No se pudo leer el "
                    "artista.",
                "items": []
            }

        items = [
            to_item(entry)

            for entry in (
                data.get("entries") or []
            )

            if is_usable_song(entry)
        ]

        return {

            "success": True,

            "artist": {
                "channelId": channel_id,
                "name": str(
                    data.get("channel")
                    or data.get("uploader")
                    or ""
                ),
                "avatar": get_avatar(data),
                "verified": bool(
                    data.get(
                        "channel_is_verified"
                    )
                ),
                "followers": int(
                    data.get(
                        "channel_follower_count"
                    )
                    or 0
                )
            },

            "instance": ENGINE_NAME,

            "items": items[:limit]

        }

    except Exception as error:

        return {
            "success": False,
            "error": friendly_error(error),
            "items": []
        }


# ==========================================
# BUSCAR
# ==========================================

def search(
    query
):
    query = str(
        query or ""
    ).strip()


    if not query:

        return {

            "success": False,

            "error": "La búsqueda está vacía.",

            "items": []

        }


    target = (
        f"ytsearch{SEARCH_LIMIT}:{query}"
    )


    try:

        with yt_dlp.YoutubeDL(
            get_options(
                extract_flat=True
            )
        ) as youtube_dl:

            data = youtube_dl.extract_info(
                target,
                download=False
            )


        entries = (
            data.get(
                "entries"
            )
            or []
        )


        items = []


        for entry in entries:

            if not entry:

                continue


            if not entry.get(
                "id"
            ):

                continue


            items.append(
                to_item(
                    entry
                )
            )


        if not items:

            return {

                "success": False,

                "error":
                    "No se encontró nada "
                    "para esa búsqueda.",

                "instance": ENGINE_NAME,

                "items": []

            }


        return {

            "success": True,

            "instance": ENGINE_NAME,

            "items": items

        }


    except Exception as error:

        return {

            "success": False,

            "error": friendly_error(
                error
            ),

            "instance": ENGINE_NAME,

            "items": []

        }


# ==========================================
# ELEGIR FORMATO DE AUDIO
# ==========================================

def get_format_rank(
    format_entry
):
    codec = str(
        format_entry.get(
            "acodec"
        )
        or ""
    ).lower()


    if (
        codec.startswith(
            "mp4a"
        )
        or codec == "aac"
    ):

        return 0


    if "opus" in codec:

        return 1


    if (
        "vorbis" in codec
        or codec == "mp3"
    ):

        return 2


    return 3


def get_format_bitrate(
    format_entry
):
    for key in (

        "abr",
        "tbr",
        "vbr"

    ):

        value = (
            format_entry.get(
                key
            )
        )


        if value:

            try:

                return int(
                    value
                )

            except (TypeError, ValueError):

                continue


    return 0


def select_audio_format(
    formats
):
    usable = [

        format_entry

        for format_entry in formats

        if (
            format_entry.get(
                "url"
            )
            and format_entry.get(
                "acodec"
            )
            not in (None, "none")
        )

    ]


    if not usable:

        return None


    audio_only = [

        format_entry

        for format_entry in usable

        if format_entry.get(
            "vcodec"
        ) in (None, "none")

    ]


    candidates = (
        audio_only
        if audio_only
        else usable
    )


    candidates.sort(
        key=lambda format_entry: (
            get_format_rank(
                format_entry
            ),
            -get_format_bitrate(
                format_entry
            )
        )
    )


    return candidates[0]


def get_mime_type(
    format_entry
):
    mime_type = (
        format_entry.get(
            "mime_type"
        )
    )


    if mime_type:

        return str(
            mime_type
        )


    extension = str(
        format_entry.get(
            "ext",
            ""
        )
    ).lower()


    if extension in ("m4a", "mp4", "m4b"):

        return "audio/mp4"


    if extension in ("webm", "weba"):

        return "audio/webm"


    if extension == "mp3":

        return "audio/mpeg"


    if not extension:

        return ""


    return f"audio/{extension}"


def get_quality(
    format_entry
):
    bitrate = get_format_bitrate(
        format_entry
    )


    if bitrate:

        return (
            f"{int(bitrate)} kbps"
        )


    return str(
        format_entry.get(
            "format_note",
            ""
        )
    )


# ==========================================
# OBTENER STREAM DE AUDIO
# ==========================================

def get_audio_stream(
    video_id
):
    video_id = str(
        video_id or ""
    ).strip()


    if not video_id:

        return {

            "success": False,

            "error":
                "No se recibió ningún videoId."

        }


    if not VIDEO_ID_PATTERN.match(
        video_id
    ):

        return {

            "success": False,

            "error":
                "El identificador del "
                "vídeo no es válido."

        }


    url = (
        "https://www.youtube.com"
        f"/watch?v={video_id}"
    )


    try:

        with yt_dlp.YoutubeDL(
            get_options()
        ) as youtube_dl:

            data = youtube_dl.extract_info(
                url,
                download=False
            )


        if not data:

            return {

                "success": False,

                "error":
                    "yt-dlp no devolvió "
                    "información del vídeo."

            }


        selected = select_audio_format(
            data.get(
                "formats"
            )
            or []
        )


        if selected is None:

            return {

                "success": False,

                "error":
                    "No se encontró ningún "
                    "formato de audio."

            }


        return {

            "success": True,

            "videoId": video_id,

            "url":
                selected.get(
                    "url",
                    ""
                ),

            "format":
                selected.get(
                    "format_id",
                    ""
                ),

            "mimeType": get_mime_type(
                selected
            ),

            "quality": get_quality(
                selected
            ),

            "bitrate": get_format_bitrate(
                selected
            ),

            "duration": int(
                data.get(
                    "duration"
                )
                or 0
            ),

            "instance": ENGINE_NAME

        }


    except Exception as error:

        return {

            "success": False,

            "error": friendly_error(
                error
            )

        }


# ==========================================
# CANCIONES RELACIONADAS
# ==========================================
#
# YouTube genera una "radio" para cada
# vídeo con el identificador RDAMVM:
#
#   https://www.youtube.com/watch?v=ID
#   &list=RDAMVMID
#
# Esa lista es el algoritmo oficial de
# recomendaciones, así que se usa
# directamente. Sin videoId (canciones
# locales) se recurre a una búsqueda por
# artista + título.
# ==========================================

RELATED_LIMIT = 20


RELATED_FETCH = 30


MAX_RELATED_SECONDS = 900


def get_radio_options(
):
    options = get_options(
        extract_flat="in_playlist"
    )


    options["noplaylist"] = False

    options["playlistend"] = RELATED_FETCH

    return options


def build_related_url(
    video_id
):
    return (
        "https://www.youtube.com/watch"
        f"?v={video_id}"
        f"&list=RDAMVM{video_id}"
    )


def is_usable_related(
    entry,
    seed_id
):
    if not entry:

        return False


    video_id = str(
        entry.get(
            "id",
            ""
        )
    )


    if (
        not video_id
        or video_id == seed_id
    ):

        return False


    if not VIDEO_ID_PATTERN.match(
        video_id
    ):

        return False


    duration = int(
        entry.get(
            "duration"
        )
        or 0
    )


    if (
        duration
        and duration > MAX_RELATED_SECONDS
    ):

        return False


    return True


def related_by_radio(
    video_id
):
    with yt_dlp.YoutubeDL(
        get_radio_options()
    ) as youtube_dl:

        data = youtube_dl.extract_info(
            build_related_url(
                video_id
            ),
            download=False
        )


    return [
        to_item(entry)
        for entry in (
            (data or {}).get(
                "entries"
            ) or []
        )
        if is_usable_related(
            entry,
            video_id
        )
    ]


def normalize_text(
    value
):
    return re.sub(
        r"[^a-z0-9]+",
        " ",
        str(
            value or ""
        ).lower()
    ).strip()
def is_same_song(
    item_title,
    title
):
    seed = normalize_text(
        title
    )

    candidate = normalize_text(
        item_title
    )


    if not seed:

        return False


    if (
        seed in candidate
        or candidate in seed
    ):

        return True


    return False


def pick_seed(
    items,
    title
):
    for item in items:

        if is_same_song(
            item.get(
                "title"
            ),
            title
        ):

            return item.get(
                "videoId"
            )


    if items:

        return items[0].get(
            "videoId"
        )


    return ""


def related_by_search(
    title,
    artist
):
    query = " ".join(
        part
        for part in (
            str(artist or "").strip(),
            str(title or "").strip()
        )
        if part
    )

    if not query:

        return (
            "",
            []
        )


    result = search(
        query
    )

    if not result.get(
        "success"
    ):

        return (
            "",
            []
        )


    items = (
        result.get(
            "items"
        ) or []
    )


    seed = pick_seed(
        items,
        title
    )


    fallback = [
        item
        for item in items
        if not is_same_song(
            item.get(
                "title"
            ),
            title
        )
    ]


    if not fallback:

        fallback = items


    return (
        seed,
        fallback
    )


def get_related(
    video_id="",
    title="",
    artist=""
):
    video_id = str(
        video_id or ""
    ).strip()


    fallback = []


    if VIDEO_ID_PATTERN.match(
        video_id
    ):

        seed = video_id

    else:

        try:

            seed, fallback = (
                related_by_search(
                    title,
                    artist
                )
            )

        except Exception as error:

            return {
                "success": False,
                "error": friendly_error(
                    error
                ),
                "instance": ENGINE_NAME,
                "items": []
            }


    if VIDEO_ID_PATTERN.match(
        str(
            seed or ""
        )
    ):

        try:

            items = related_by_radio(
                seed
            )

        except Exception as error:

            if fallback:

                items = fallback

            else:

                return {
                    "success": False,
                    "error": friendly_error(
                        error
                    ),
                    "instance": ENGINE_NAME,
                    "items": []
                }


    else:

        items = fallback


    if not items:

        return {
            "success": False,
            "error":
                "No se encontraron "
                "canciones relacionadas.",
            "instance": ENGINE_NAME,
            "items": []
        }


    return {
        "success": True,
        "instance": ENGINE_NAME,
        "items": items[:RELATED_LIMIT]
    }


# ==========================================
# PRUEBA DIRECTA
# ==========================================

if __name__ == "__main__":

    print(
        "=" * 60
    )

    print(
        "AURA · MÚSICA ONLINE"
    )

    print(
        "=" * 60
    )


    query = input(
        "\nBusca una canción: "
    ).strip()


    result = search(
        query
    )


    print()


    if not result.get(
        "success"
    ):

        print(
            "ERROR:",
            result.get(
                "error"
            )
        )

    else:

        items = result.get(
            "items",
            []
        )

        print(
            f"{len(items)} resultados "
            f"vía {result.get('instance')}"
        )

        print()


        for position, item in enumerate(
            items[:5],
            start=1
        ):

            print(
                f"{position}. "
                f"{item['title']}"
            )

            print(
                "   ",
                item["artist"]
            )


        print()


        first = items[0]


        print(
            "Obteniendo audio de:"
        )

        print(
            first["title"]
        )

        print()


        stream = get_audio_stream(
            first["videoId"]
        )


        if stream.get(
            "success"
        ):

            print(
                "OK",
                stream.get(
                    "format"
                ),
                stream.get(
                    "quality"
                )
            )

            print(
                stream.get(
                    "url"
                )[:120]
            )

        else:

            print(
                "ERROR:",
                stream.get(
                    "error"
                )
            )
