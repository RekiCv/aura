import json
import urllib.parse
import urllib.request


# ==========================================
# INSTANCIAS DE PIPED
# ==========================================

PIPED_INSTANCES = [

    "https://pipedapi.kavin.rocks",

    "https://pipedapi.leptons.xyz",

    "https://pipedapi.nosebs.ru",

    "https://pipedapi-libre.kavin.rocks",

    "https://piped-api.privacy.com.de",

    "https://pipedapi.adminforge.de",

    "https://api.piped.yt",

    "https://pipedapi.drgns.space",

    "https://pipedapi.owo.si",

    "https://pipedapi.ducks.party",

    "https://piped-api.codespace.cz",

    "https://pipedapi.reallyaweso.me",

    "https://api.piped.private.coffee",

    "https://pipedapi.darkness.services",

    "https://pipedapi.orangenet.cc"

]


# ==========================================
# BUSCAR EN UNA INSTANCIA
# ==========================================

def search_instance(
    instance,
    query
):

    params = urllib.parse.urlencode({
        "q": query,
        "filter": "videos"
    })

    url = (
        f"{instance}/search?{params}"
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "AURA/1.0"
        }
    )

    with urllib.request.urlopen(
        request,
        timeout=10
    ) as response:

        data = json.loads(
            response.read().decode(
                "utf-8"
            )
        )

    return data


# ==========================================
# BUSCADOR
# ==========================================

def search_piped(query):

    print()
    print(
        "Buscando una instancia de Piped..."
    )
    print()

    for instance in PIPED_INSTANCES:

        print(
            f"Probando: {instance}"
        )

        try:

            data = search_instance(
                instance,
                query
            )

            items = data.get(
                "items",
                []
            )

            print(
                "  ✓ FUNCIONA"
            )

            print(
                f"  Resultados: {len(items)}"
            )

            print()

            return (
                instance,
                data
            )

        except Exception as error:

            print(
                f"  ✗ {type(error).__name__}: "
                f"{error}"
            )

            print()

    return (
        None,
        None
    )


# ==========================================
# MOSTRAR RESULTADOS
# ==========================================

def show_results(data):

    items = data.get(
        "items",
        []
    )

    if not items:

        print(
            "No se encontraron resultados."
        )

        return


    print(
        f"Se encontraron "
        f"{len(items)} resultados."
    )

    print()


    for item in items[:10]:

        print(
            "Título:",
            item.get(
                "title",
                "Sin título"
            )
        )

        print(
            "Canal:",
            item.get(
                "uploaderName",
                "Desconocido"
            )
        )

        print(
            "ID:",
            item.get(
                "url",
                "Sin ID"
            )
        )

        print(
            "Miniatura:",
            item.get(
                "thumbnail",
                ""
            )
        )

        print(
            "-" * 60
        )


# ==========================================
# PROGRAMA
# ==========================================

if __name__ == "__main__":

    print(
        "=" * 60
    )

    print(
        "AURA · PRUEBA DE PIPED"
    )

    print(
        "=" * 60
    )


    query = input(
        "\nBusca una canción: "
    ).strip()


    if not query:

        print(
            "\nNo has escrito ninguna búsqueda."
        )

    else:

        instance, data = search_piped(
            query
        )


        if instance is None:

            print()
            print(
                "❌ NINGUNA INSTANCIA DE PIPED RESPONDIÓ."
            )
            print()

        else:

            print(
                "Instancia seleccionada:"
            )

            print(
                instance
            )

            print()

            show_results(
                data
            )