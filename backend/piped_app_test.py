import webview
from pathlib import Path
import importlib.util


# ==========================================
# RUTAS
# ==========================================

# Carpeta donde está ESTE archivo
BACKEND_DIR = Path(__file__).resolve().parent


# piped_service.py está en la misma carpeta
PIPED_SERVICE_FILE = (
    BACKEND_DIR
    / "piped_service.py"
)


# La carpeta backend está dentro de aura,
# por eso subimos una carpeta.
BASE_DIR = BACKEND_DIR.parent


HTML_FILE = (
    BASE_DIR
    / "frontend"
    / "piped.html"
)


# ==========================================
# COMPROBAR ARCHIVOS
# ==========================================

print()
print("=" * 60)
print("AURA · PIPED TEST")
print("=" * 60)

print()
print("Backend:")
print(BACKEND_DIR)

print()
print("Servicio Piped:")
print(PIPED_SERVICE_FILE)

print()
print("¿Existe piped_service.py?")
print(PIPED_SERVICE_FILE.exists())

print()
print("HTML:")
print(HTML_FILE)

print()
print("¿Existe piped.html?")
print(HTML_FILE.exists())

print()


if not PIPED_SERVICE_FILE.exists():

    raise FileNotFoundError(
        f"No se encuentra:\n{PIPED_SERVICE_FILE}"
    )


if not HTML_FILE.exists():

    raise FileNotFoundError(
        f"No se encuentra:\n{HTML_FILE}"
    )


# ==========================================
# CARGAR PIPED SERVICE
# ==========================================

spec = importlib.util.spec_from_file_location(
    "piped_service",
    PIPED_SERVICE_FILE
)


if spec is None or spec.loader is None:

    raise ImportError(
        "No se pudo cargar piped_service.py"
    )


piped_service = (
    importlib.util.module_from_spec(
        spec
    )
)


spec.loader.exec_module(
    piped_service
)


# ==========================================
# API PARA JAVASCRIPT
# ==========================================

class PipedAPI:


    def search_piped(
        self,
        query
    ):

        print()
        print("=" * 60)
        print("AURA · BUSCANDO EN PIPED")
        print("=" * 60)
        print(
            f"Búsqueda: {query}"
        )


        result = (
            piped_service.search(
                query
            )
        )


        print(
            f"Resultados: "
            f"{len(result.get('items', []))}"
        )


        return result


    def get_audio_stream(
        self,
        video_id
    ):

        print()
        print("=" * 60)
        print("AURA · OBTENIENDO AUDIO")
        print("=" * 60)
        print(
            f"Video ID: {video_id}"
        )


        result = (
            piped_service
            .get_audio_stream(
                video_id
            )
        )


        if result.get("success"):

            print(
                "Stream encontrado."
            )

            print(
                f"Formato: "
                f"{result.get('format')}"
            )

        else:

            print(
                "Error:"
            )

            print(
                result.get(
                    "error"
                )
            )


        return result


# ==========================================
# CREAR VENTANA
# ==========================================

api = PipedAPI()


window = webview.create_window(

    "AURA · Música online",

    HTML_FILE.as_uri(),

    width=1200,

    height=800,

    js_api=api

)


# ==========================================
# INICIAR
# ==========================================

print(
    "Abriendo AURA..."
)

print()


webview.start()