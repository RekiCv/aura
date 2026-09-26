import sys
import webview
from pathlib import Path
import shutil
import tkinter as tk
from tkinter import filedialog
import json

from mutagen import File as MutagenFile


# ==========================================
# RUTAS
# ==========================================

if getattr(sys, "frozen", False):

    BASE_DIR = Path(sys._MEIPASS)

    APP_DIR = Path(sys.executable).resolve().parent

else:

    BASE_DIR = Path(__file__).resolve().parent.parent
    APP_DIR = BASE_DIR


HTML_FILE = BASE_DIR / "frontend" / "index.html"


# ==========================================
# BIBLIOTECA
# ==========================================

LIBRARY_DIR = APP_DIR / "library"

LIBRARY_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ==========================================
# PLAYLISTS
# ==========================================

PLAYLISTS_DIR = APP_DIR / "playlists"

PLAYLISTS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ==========================================
# MÚSICA INCLUIDA CON AURA
# ==========================================

DEMO_LIBRARY_DIR = BASE_DIR / "library"


def install_demo_music():

    if not DEMO_LIBRARY_DIR.exists():
        return

    for demo_file in DEMO_LIBRARY_DIR.iterdir():

        if not demo_file.is_file():
            continue

        destination = LIBRARY_DIR / demo_file.name

        if destination.exists():
            continue

        shutil.copy2(
            demo_file,
            destination
        )


install_demo_music()


# ==========================================
# METADATOS
# ==========================================

def get_tag(tags, key, default=""):

    if not tags:
        return default

    value = tags.get(key)

    if value is None:
        return default

    if isinstance(value, list):

        if len(value) == 0:
            return default

        return str(value[0])

    return str(value)


def get_song_metadata(file):

    metadata = {
        "title": file.stem,
        "artist": "",
        "album": "",
        "album_artist": "",
        "genre": "",
        "year": "",
        "track": "",
        "disc": "",
        "composer": "",
        "comment": ""
    }

    try:

        audio = MutagenFile(file, easy=True)

        if audio is None:
            return metadata

        tags = audio.tags

        if not tags:
            return metadata

        metadata["title"] = get_tag(
            tags,
            "title",
            file.stem
        )

        metadata["artist"] = get_tag(
            tags,
            "artist"
        )

        metadata["album"] = get_tag(
            tags,
            "album"
        )

        metadata["album_artist"] = get_tag(
            tags,
            "albumartist"
        )

        metadata["genre"] = get_tag(
            tags,
            "genre"
        )

        metadata["year"] = get_tag(
            tags,
            "date"
        )

        metadata["track"] = get_tag(
            tags,
            "tracknumber"
        )

        metadata["disc"] = get_tag(
            tags,
            "discnumber"
        )

        metadata["composer"] = get_tag(
            tags,
            "composer"
        )

        metadata["comment"] = get_tag(
            tags,
            "comment"
        )

    except Exception as error:

        print(
            f"Error leyendo metadatos de {file.name}: {error}"
        )

    return metadata


# ==========================================
# API DE AURA
# ==========================================

class AuraAPI:

    # ======================================
    # BIBLIOTECA
    # ======================================

    def select_music(self):

        root = tk.Tk()
        root.withdraw()

        files = filedialog.askopenfilenames(
            title="Añadir música a AURA",
            filetypes=[
                (
                    "Archivos de audio",
                    "*.mp3 *.wav *.flac *.ogg *.m4a *.aac"
                ),
                (
                    "Todos los archivos",
                    "*.*"
                )
            ]
        )

        root.destroy()

        added = []

        for file in files:

            source = Path(file)

            destination = LIBRARY_DIR / source.name

            if destination.exists():

                counter = 1

                while True:

                    destination = (
                        LIBRARY_DIR
                        / f"{source.stem} ({counter}){source.suffix}"
                    )

                    if not destination.exists():
                        break

                    counter += 1

            shutil.copy2(
                source,
                destination
            )

            added.append(
                destination.name
            )

        return added


    def get_library(self):

        songs = []

        extensions = {
            ".mp3",
            ".wav",
            ".flac",
            ".ogg",
            ".m4a",
            ".aac"
        }

        if not LIBRARY_DIR.exists():
            return songs

        for file in LIBRARY_DIR.iterdir():

            if (
                file.is_file()
                and file.suffix.lower() in extensions
            ):

                metadata = get_song_metadata(file)

                songs.append({
                    "name": file.name,
                    "url": file.as_uri(),
                    "title": metadata["title"],
                    "artist": metadata["artist"],
                    "album": metadata["album"],
                    "album_artist": metadata["album_artist"],
                    "genre": metadata["genre"],
                    "year": metadata["year"],
                    "track": metadata["track"],
                    "disc": metadata["disc"],
                    "composer": metadata["composer"],
                    "comment": metadata["comment"]
                })

        songs.sort(
            key=lambda song:
            song["title"].lower()
        )

        return songs


    def update_metadata(self, filename, metadata):

        file = LIBRARY_DIR / filename

        if not file.exists():
            return {
                "success": False,
                "error": "El archivo no existe."
            }

        try:

            audio = MutagenFile(file, easy=True)

            if audio is None:
                return {
                    "success": False,
                    "error": "AURA no puede editar los metadatos de este archivo."
                }

            if audio.tags is None:
                audio.add_tags()

            fields = {
                "title": "title",
                "artist": "artist",
                "album": "album",
                "albumartist": "albumartist",
                "genre": "genre",
                "date": "date",
                "tracknumber": "tracknumber",
                "discnumber": "discnumber",
                "composer": "composer",
                "comment": "comment"
            }

            for field, tag in fields.items():

                value = metadata.get(field, "")

                if value is None:
                    value = ""

                value = str(value).strip()

                if value:
                    audio[tag] = [value]
                else:
                    if tag in audio:
                        del audio[tag]

            audio.save()

            return {
                "success": True
            }

        except Exception as error:

            print(
                f"Error guardando metadatos: {error}"
            )

            return {
                "success": False,
                "error": str(error)
            }


    # ======================================
    # PLAYLISTS
    # ======================================

    def _playlist_path(self, playlist_id):

        return PLAYLISTS_DIR / f"{playlist_id}.json"


    def get_playlists(self):

        playlists = []

        if not PLAYLISTS_DIR.exists():
            return playlists

        for file in PLAYLISTS_DIR.glob("*.json"):

            try:

                with open(
                    file,
                    "r",
                    encoding="utf-8"
                ) as playlist_file:

                    playlist = json.load(
                        playlist_file
                    )

                playlists.append(playlist)

            except Exception as error:

                print(
                    f"Error leyendo playlist {file.name}: {error}"
                )

        playlists.sort(
            key=lambda playlist:
            playlist.get("name", "").lower()
        )

        return playlists


    def create_playlist(self, name):

        name = str(name).strip()

        if not name:
            return {
                "success": False,
                "error": "La playlist necesita un nombre."
            }

        playlist_id = name

        invalid_characters = '<>:"/\\|?*'

        for character in invalid_characters:
            playlist_id = playlist_id.replace(
                character,
                ""
            )

        playlist_id = playlist_id.strip()

        if not playlist_id:
            return {
                "success": False,
                "error": "El nombre de la playlist no es válido."
            }

        base_id = playlist_id
        counter = 2

        while self._playlist_path(playlist_id).exists():

            playlist_id = f"{base_id} {counter}"

            counter += 1

        playlist = {
            "id": playlist_id,
            "name": name,
            "songs": []
        }

        try:

            with open(
                self._playlist_path(playlist_id),
                "w",
                encoding="utf-8"
            ) as playlist_file:

                json.dump(
                    playlist,
                    playlist_file,
                    ensure_ascii=False,
                    indent=4
                )

            return {
                "success": True,
                "playlist": playlist
            }

        except Exception as error:

            return {
                "success": False,
                "error": str(error)
            }


    def get_playlist(self, playlist_id):

        path = self._playlist_path(
            playlist_id
        )

        if not path.exists():
            return None

        try:

            with open(
                path,
                "r",
                encoding="utf-8"
            ) as playlist_file:

                return json.load(
                    playlist_file
                )

        except Exception as error:

            print(
                f"Error leyendo playlist: {error}"
            )

            return None


    def add_song_to_playlist(
        self,
        playlist_id,
        filename
    ):

        playlist = self.get_playlist(
            playlist_id
        )

        if playlist is None:
            return {
                "success": False,
                "error": "La playlist no existe."
            }

        song = LIBRARY_DIR / filename

        if not song.exists():
            return {
                "success": False,
                "error": "La canción no existe en la biblioteca."
            }

        if filename in playlist["songs"]:

            return {
                "success": False,
                "error": "La canción ya está en la playlist."
            }

        playlist["songs"].append(
            filename
        )

        try:

            with open(
                self._playlist_path(playlist_id),
                "w",
                encoding="utf-8"
            ) as playlist_file:

                json.dump(
                    playlist,
                    playlist_file,
                    ensure_ascii=False,
                    indent=4
                )

            return {
                "success": True,
                "playlist": playlist
            }

        except Exception as error:

            return {
                "success": False,
                "error": str(error)
            }


    def remove_song_from_playlist(
        self,
        playlist_id,
        filename
    ):

        playlist = self.get_playlist(
            playlist_id
        )

        if playlist is None:
            return {
                "success": False,
                "error": "La playlist no existe."
            }

        if filename in playlist["songs"]:

            playlist["songs"].remove(
                filename
            )

        try:

            with open(
                self._playlist_path(playlist_id),
                "w",
                encoding="utf-8"
            ) as playlist_file:

                json.dump(
                    playlist,
                    playlist_file,
                    ensure_ascii=False,
                    indent=4
                )

            return {
                "success": True,
                "playlist": playlist
            }

        except Exception as error:

            return {
                "success": False,
                "error": str(error)
            }


    def delete_playlist(self, playlist_id):

        path = self._playlist_path(
            playlist_id
        )

        if not path.exists():

            return {
                "success": False,
                "error": "La playlist no existe."
            }

        try:

            path.unlink()

            return {
                "success": True
            }

        except Exception as error:

            return {
                "success": False,
                "error": str(error)
            }


# ==========================================
# VENTANA
# ==========================================

api = AuraAPI()

window = webview.create_window(
    "AURA",
    HTML_FILE.as_uri(),
    width=1200,
    height=800,
    js_api=api
)

webview.start()