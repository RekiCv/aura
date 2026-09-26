import json
import urllib.parse
import urllib.request


# ==========================================
# INSTANCIAS PIPED
# ==========================================

PIPED_INSTANCES = [

    "https://pipedapi.ducks.party",

    "https://pipedapi.kavin.rocks",

    "https://pipedapi.leptons.xyz",

    "https://pipedapi.adminforge.de",

    "https://pipedapi.drgns.space",

    "https://pipedapi.owo.si",

    "https://api.piped.yt"

]


active_instance = None


# ==========================================
# PETICIONES
# ==========================================

def request_json(url):

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "AURA/1.0"
        }
    )

    with urllib.request.urlopen(
        request,
        timeout=15
    ) as response:

        return json.loads(
            response.read().decode("utf-8")
        )


# ==========================================
# BUSCAR INSTANCIA DISPONIBLE
# ==========================================

def find_working_instance():

    global active_instance


    instances = []


    if active_instance:

        instances.append(
            active_instance
        )


    for instance in PIPED_INSTANCES:

        if instance not in instances:

            instances.append(
                instance
            )


    for instance in instances:

        try:

            test_url = (
                f"{instance}"
                "/search?q=test&filter=videos"
            )


            data = request_json(
                test_url
            )


            if isinstance(
                data,
                dict
            ):

                active_instance = (
                    instance
                )


                print(
                    f"Piped activo: {instance}"
                )


                return instance


        except Exception as error:

            print(
                f"Piped no disponible "
                f"{instance}: {error}"
            )


    active_instance = None

    return None


# ==========================================
# BUSCAR
# ==========================================

def search(query):

    if not query:

        return {
            "success": False,
            "error": "La búsqueda está vacía.",
            "items": []
        }


    instance = (
        find_working_instance()
    )


    if not instance:

        return {
            "success": False,
            "error":
                "No hay ninguna instancia "
                "de Piped disponible.",
            "items": []
        }


    params = urllib.parse.urlencode({

        "q": query,

        "filter": "videos"

    })


    url = (
        f"{instance}"
        f"/search?{params}"
    )


    try:

        data = request_json(
            url
        )


        items = []


        for item in data.get(
            "items",
            []
        ):

            video_url = (
                item.get(
                    "url",
                    ""
                )
            )


            video_id = ""


            if video_url.startswith(
                "/watch?v="
            ):

                video_id = (
                    video_url
                    .split(
                        "/watch?v=",
                        1
                    )[1]
                )


            items.append({

                "type": "youtube",

                "videoId": video_id,

                "title":
                    item.get(
                        "title",
                        "Sin título"
                    ),

                "artist":
                    item.get(
                        "uploaderName",
                        "Desconocido"
                    ),

                "thumbnail":
                    item.get(
                        "thumbnail",
                        ""
                    ),

                "duration":
                    item.get(
                        "duration",
                        0
                    ),

                "url":
                    video_url,

                "source":
                    "piped",

                "pipedInstance":
                    instance

            })


        return {

            "success": True,

            "instance": instance,

            "items": items

        }


    except Exception as error:

        if (
            active_instance
            == instance
        ):

            active_instance = None


        return {

            "success": False,

            "error": str(error),

            "items": []

        }


# ==========================================
# OBTENER STREAM DE AUDIO
# ==========================================

def get_audio_stream(
    video_id
):

    if not video_id:

        return {

            "success": False,

            "error":
                "No se recibió ningún videoId."

        }


    instance = (
        find_working_instance()
    )


    if not instance:

        return {

            "success": False,

            "error":
                "No hay ninguna instancia "
                "de Piped disponible."

        }


    url = (
        f"{instance}"
        f"/streams/{video_id}"
    )


    try:

        data = request_json(
            url
        )


        audio_streams = (
            data.get(
                "audioStreams",
                []
            )
        )


        if not audio_streams:

            return {

                "success": False,

                "error":
                    "Piped no devolvió "
                    "ningún stream de audio."

            }


        # ==================================
        # FORMATOS PREFERIDOS
        # ==================================

        preferred_formats = [

            "M4A",

            "WEBMA",

            "WEBMA_OPUS",

            "OPUS",

            "MP3"

        ]


        selected = None


        for preferred in (
            preferred_formats
        ):

            for stream in (
                audio_streams
            ):

                stream_format = (
                    str(
                        stream.get(
                            "format",
                            ""
                        )
                    ).upper()
                )


                if (
                    stream_format
                    == preferred
                ):

                    selected = stream

                    break


            if selected:

                break


        # ==================================
        # SI NO HAY FORMATO PREFERIDO
        # ==================================

        if selected is None:

            selected = (
                audio_streams[0]
            )


        stream_url = (
            selected.get(
                "url",
                ""
            )
        )


        if not stream_url:

            return {

                "success": False,

                "error":
                    "El stream no contiene "
                    "una URL de audio."

            }


        return {

            "success": True,

            "videoId":
                video_id,

            "url":
                stream_url,

            "format":
                selected.get(
                    "format",
                    ""
                ),

            "mimeType":
                selected.get(
                    "mimeType",
                    ""
                ),

            "quality":
                selected.get(
                    "quality",
                    ""
                ),

            "bitrate":
                selected.get(
                    "bitrate",
                    0
                ),

            "instance":
                instance

        }


    except Exception as error:

        if (
            active_instance
            == instance
        ):

            active_instance = None


        return {

            "success": False,

            "error": str(error)

        }


# ==========================================
# PRUEBA DIRECTA
# ==========================================

if __name__ == "__main__":

    print(
        "=" * 60
    )

    print(
        "AURA · PIPED SERVICE"
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


    print(
        json.dumps(
            result,
            indent=4,
            ensure_ascii=False
        )
    )
