import { useState, useEffect } from "react";
import NoteStaff from "./NoteStaff";
import PianoKeyboard from "./PianoKeyboard";
import HornerMelody from "./HornerMelody";

function App() {
  const [mode, setMode] = useState(1);
  const [currentNote, setCurrentNote] = useState({ measure: 0, note: 0 });
  const [showButtons, setShowButtons] = useState(true);
  const [canShowHorner, setCanShowHorner] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setShowButtons(width >= 845);
      setCanShowHorner(width >= 1182);
    };

    handleResize(); // Проверить при первом рендере
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ⚠️ Защита от режима 3, если ширина стала < 1182
  useEffect(() => {
    if (!canShowHorner && mode === 3) {
      setMode(1);
    }
  }, [canShowHorner, mode]);

  return (
    <div className="container">
      <h1>PianoFlow</h1>

      {showButtons && (
        <div className="mode-buttons">
          <button onClick={() => setMode(1)}>Free Play</button>
          <button onClick={() => setMode(2)}>Two Merry Geese</button>
          {canShowHorner && (
            <button onClick={() => setMode(3)}>Titanic Theme</button>
          )}
        </div>
      )}

      {mode === 1 && <PianoKeyboard />}

      {mode === 2 && (
        <>
          <NoteStaff highlight={currentNote} />
          <PianoKeyboard currentNote={currentNote} setCurrentNote={setCurrentNote} />
        </>
      )}

      {mode === 3 && canShowHorner && (
        <>
          <HornerMelody />
          <PianoKeyboard />
        </>
      )}
    </div>
  );
}

export default App;
