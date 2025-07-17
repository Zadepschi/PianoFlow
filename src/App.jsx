import { useState } from "react";
import NoteStaff from "./NoteStaff";
import PianoKeyboard from "./PianoKeyboard";
import HornerMelody from "./HornerMelody";


function App() {
  const [mode, setMode] = useState(1);
  const [currentNote, setCurrentNote] = useState({ measure: 0, note: 0 });

  return (
    <div className="container">
      <p className="paragraph">The mobile version of the project is under development.</p>
      <h1>PianoFlow</h1>

      <div className="mode-buttons">
        <button onClick={() => setMode(1)}>Free Play</button>
        <button onClick={() => setMode(2)}>Two Merry Geese</button>
        <button onClick={() => setMode(3)}>Titanic Theme</button>
      </div>

      {mode === 1 && (
        <>
          <PianoKeyboard />
        </>
      )}

      {mode === 2 && (
        <>
          <NoteStaff highlight={currentNote} />
          <PianoKeyboard
            currentNote={currentNote}
            setCurrentNote={setCurrentNote}
          />
        </>
      )}

      {mode === 3 && (
        <>
          <HornerMelody />
          <PianoKeyboard />
        </>
      )}
    </div>
  );
}

export default App; 