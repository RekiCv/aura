# AURA

Reproductor de música de escritorio. Interfaz en HTML/CSS/JavaScript
dentro de una ventana nativa, y un backend en Python que se encarga
de la biblioteca, los metadatos y la búsqueda en YouTube.

Dos tipos de música:

- **Biblioteca local** — copias de tus archivos a `library/`, con
  etiquetas leídas por [mutagen](https://mutagen.readthedocs.io/).
- **Música online** — búsquedas en YouTube vía
  [yt-dlp](https://github.com/yt-dlp/yt-dlp), sin descargar nada a disco.

Al buscar se muestran hasta **4 artistas** antes de las canciones, con el
canal verificado primero. Pinchar en uno abre su página con sus canciones.
Esa lista se arma agrupando los resultados por canal: los datos de canal
ya vienen en la propia búsqueda, así que no añade ninguna llamada extra.
La lista completa de un artista sí se pide al abrirlo (~1 s).

---

## Requisitos

- **Python 3.10 o superior** (probado con 3.14)
- **Windows**: el runtime **WebView2** (ya viene con Windows 11 y con
  Chrome/Edge instalados). Sin él pywebview no abre la ventana.
  Se descarga de [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/).

---

## Instalación

```bash
git clone <url-del-repo>
cd aura

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

pip install -r requirements.txt
```

## Uso en desarrollo

```bash
python backend/main.py
```

No hace falta compilar nada para desarrollar. La ventana se abre en
1200×800 y es redimensionable.

---

## Compilar el ejecutable

En Windows, con el entorno virtual activo:

```bash
compilar.bat
```

Genera `dist\AURA.exe` (un único archivo, sin instalación).

> `compilar.bat` borra `build\`, `dist\` y `AURA.spec` antes de
> compilar, y `PyInstaller` regenera el `.spec`. Por eso el `.spec`
> no está en el control de versiones.

Si `yt-dlp` deja de funcionar (YouTube cambia con frecuencia), hay
que actualizarlo y recompilar:

```bash
pip install -U yt-dlp
compilar.bat
```

---

## Estructura

```
aura/
├── backend/
│   ├── main.py          API, biblioteca, playlists, ventana
│   ├── piped_service.py Búsqueda y streams con yt-dlp
│   ├── piped-test.py    Banco de pruebas (resto del motor Piped)
│   └── piped_app_test.py  Ventana de pruebas
├── frontend/
│   ├── index.html       Pantalla de inicio
│   ├── menu.html        Menú principal, búsqueda online y artistas
│   ├── library.html     Biblioteca local
│   ├── playlist.html    Contenido de una playlist
│   ├── artist.html      Canciones de un artista de YouTube
│   ├── settings.html    Ajustes (todavía sin implementar)
│   ├── player-state.js  Reproductor compartido entre páginas
│   └── piped.html       Resto del motor Piped (obsoleto)
├── library/             Tu música. Incluye demo.mp3
├── playlists/           Playlists en JSON
├── config/settings.json Reservado para los ajustes
├── assets/              Iconos y tipografía
└── compilar.bat         Compila el ejecutable
```

### Cómo se relacionan backend y frontend

El backend expone una clase (`AuraAPI`) como `js_api` de pywebview, así
que desde JavaScript se llama a `window.pywebview.api.<metodo>(...)`.
Cada método devuelve un objeto con `"success"` y, si aplica, `"error"`
en español o `"items"`.

| Método | Qué hace |
| --- | --- |
| `select_music()` | Abre el diálogo de archivos y copia a `library/` |
| `get_library()` | Lista la biblioteca con sus metadatos |
| `update_metadata(nombre, campos)` | Escribe etiquetas en el archivo |
| `create_playlist(nombre)` | Crea una playlist en `playlists/` |
| `get_playlist(id)` / `get_playlists()` | Lee playlists |
| `delete_playlist(id)` | Borra una playlist |
| `add_song_to_playlist(id, archivo)` | Añade canción local |
| `remove_song_from_playlist(id, archivo)` | Quita canción local |
| `add_online_song_to_playlist(id, canción)` | Añade canción de YouTube |
| `remove_online_song_from_playlist(id, videoId)` | Quita canción de YouTube |
| `search_online(consulta)` | Busca en YouTube |
| `get_online_stream(videoId)` | Devuelve la URL de audio |
| `get_related(videoId, título, artista)` | Canciones relacionadas |
| `get_artist(channelId, límite)` | Canciones de un artista |

### Sobre el reproductor

Cada página es un documento HTML independiente, no hay router. Al
cambiar de página se destruye el documento y con él su elemento de
audio. `player-state.js` salva posición, volumen y canción en
`localStorage` y la página siguiente la restaura. Por eso al navegar
hay una interrupción audible breve.

---

## Estado del proyecto

Cosas que se saben y no están resueltas:

- **Ajustes no hace nada todavía.** `config/settings.json` está vacío y
  `settings.html` no guarda nada. La sección es un placeholder.
- **La música online se corta al cambiar de página.** Las URLs de
  YouTube caducan, así que la canción online no sobrevive a la
  navegación (la local sí).
- **`piped.html`, `piped-test.html` y los `piped-*.py` son restos.**
  El motor Piped ya no tiene instancias públicas que funcionen y se
  sustituyó por yt-dlp. Borrados de la interfaz, pero aún en el repo.
- **No hay tests.**
- **Accesibilidad y diseño responsive sin hacer.** Solo hay un
  `@media` en todo el proyecto: por debajo de ~900 px de ancho el
  reproductor se solapa.
