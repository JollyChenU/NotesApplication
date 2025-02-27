# Notes - A Modern Note-Taking Application
A note-taking application in development that supports Markdown editing, real-time preview, and note drag-and-drop sorting.

## Features
- ✨ Markdown editing with real-time preview
- 🔄 Note drag-and-drop sorting
- 💾 Auto-save functionality
- 🎨 Basic interface



## Technology Stack
### Frontend
- React 18
- Material-UI (MUI)
- React Markdown
- Axios
- Vite

### Backend
- Flask
- SQLAlchemy
- SQLite

## Installation
### Backend Setup
1. Install Python dependencies:
pip install -r requirements.txt
```

2. Run Flask server:
python app.py
```
Server will start at http://127.0.0.1:5000
### Frontend Setup
1. Enter frontend directory:
cd frontend
```

2. Install Node.js dependencies:
npm install
```

3. Start development server:
npm run dev
```
Application will start at http://localhost:5173
## Usage Guide
1. Create note: Click the "+" button in the top right corner
2. Edit note: Input directly in the text area, supporting Markdown syntax
3. Preview: Markdown rendering results are displayed in real-time below the editing area
4. Sort: Drag notes using the handle on the left to adjust order
5. Delete: Click the delete icon in the top right corner of the note

## Development Features
- React Hooks for state management
- Debounce optimization for improved input performance
- RESTful API design
- SQLite data persistence
- Real-time note saving
- Custom drag-and-drop sorting implementation


## Project Structure
```
Notes/
    ├── src/
```

## Development Plans
- [ ] Add user authentication system
- [ ] Support note tags and categories
- [ ] Add note search functionality
- [ ] Support image upload
- [ ] Add note sharing functionality
- [ ] Support dark mode


## Contribution Guide
Issues and Pull Requests are welcome!
## License
GNU General Public License v3.0