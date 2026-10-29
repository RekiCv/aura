# AURA

AURA is a desktop music player built with an HTML, CSS, and JavaScript interface running inside a native window, powered by a Python backend that manages the music library, metadata, playlists, and online music playback.

## Features

- **Local Library** — Import your music files into `library/`, with metadata read using Mutagen.
- **Online Music** — Search for and play music online without downloading files to your computer.
- **Artist Pages** — Explore artists and browse their available songs.
- **Playlists** — Create and manage playlists containing local and online tracks.
- **Metadata Management** — Edit tags and organize your local music collection.
- **Standalone Executable** — Build a single Windows executable without requiring a traditional installation.

## Requirements

- Python 3.10 or later.

## Installation

Go to the **Releases** section and download the latest version. You don't need to compile it yourself.

## Building the Windows Executable

With the virtual environment activated, run:

```bat
compilar.bat
```

This generates `dist/AURA.exe`, a standalone executable that does not require a traditional installation.

The build script removes the previous build files before compiling. PyInstaller then generates the required specification file automatically.

If online playback stops working due to changes in external services, updating the relevant dependencies and rebuilding the application may help.

## Project Structure

```text
aura/
├── backend/
│   ├── main.py
│   ├── piped_service.py
│   ├── piped-test.py
│   └── piped_app_test.py
├── frontend/
│   ├── index.html
│   ├── menu.html
│   ├── library.html
│   ├── playlist.html
│   ├── artist.html
│   ├── settings.html
│   ├── player-state.js
│   └── piped.html
├── library/             Local music files
├── playlists/           Playlist data in JSON format
├── config/
│   └── settings.json
├── assets/              Icons and fonts
└── compilar.bat         Windows build script
```

## Architecture

AURA uses Python for its backend and HTML, CSS, and JavaScript for its frontend. The application runs inside a native desktop window provided by PyWebView.

Each page is an independent HTML document rather than part of a single-page application. Shared playback state is preserved between pages using `player-state.js` and browser local storage, allowing the player to restore the current track, playback position, and volume when navigating. A brief audio interruption may occur during page transitions.

## Project Status

*AURA is an experimental project built primarily through vibecoding. It is a work in progress, created to explore desktop application development and experiment with different ideas. Some features may be incomplete or change over time.*

---

# ☕ Enjoying AURA?

If you like the project and want to support its development, consider leaving a donation! Every bit of support is appreciated and helps motivate future improvements.

<p align="center">
  <a href="https://donatr.ee/senkiu?utm_source=copy&amp;utm_medium=share">
    <img src="https://img.shields.io/badge/☕_Support_AURA-Donate-purple?style=for-the-badge" alt="Support AURA with a donation"/>
  </a>
</p>

<p align="center">
  <sub>Made with curiosity, code, and a little vibecoding.</sub>
</p>
