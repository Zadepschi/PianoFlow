import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { melody } from "./data/melodyData";

const fullRange = [
  "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
  "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
];

const mobileRange = [
  "G3", "G#3", "A3", "A#3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4",
  "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5",
];

const hasSharpRight = {
  C: true, D: true, E: false, F: true, G: true, A: true, B: false,
};

const noteNamesRu = {
  C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si",
};

const PianoKeyboard = ({ currentNote, setCurrentNote }) => {
  const synth = useRef(null);
  const [showLabels, setShowLabels] = useState(true);
  const [useSolfege, setUseSolfege] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 840);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 540);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 840);
      setIsSmallMobile(window.innerWidth < 540);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Размеры клавиш в зависимости от экрана
  const keyWidth = isSmallMobile ? 23 : 40;
  const blackKeyWidth = isSmallMobile ? Math.floor(23 * 0.7) : 28;
  const whiteKeyHeight = isSmallMobile ? 130 : 180;
  const blackKeyHeight = isSmallMobile ? 80 : 110;

  const activeNotes = isMobile ? mobileRange : fullRange;

  // Обрезаем белые клавиши до 13 на маленьких экранах
  const whiteNotesFull = activeNotes.filter((n) => !n.includes("#"));
  const whiteNotes = isSmallMobile ? whiteNotesFull.slice(0, 13) : whiteNotesFull;
  const blackNotes = activeNotes.filter((n) => n.includes("#"));

  useEffect(() => {
    synth.current = new Tone.Synth().toDestination();
    return () => synth.current.dispose();
  }, []);

  const playNote = (note) => {
    synth.current.triggerAttackRelease(note, "8n");
    checkNote(note);
  };

  const checkNote = (pressedNote) => {
    const { measure, note: noteIndex } = currentNote;
    const expected = melody[measure]?.[noteIndex];
    if (!expected) return;

    const expectedNote = expected.note;
    if (pressedNote === expectedNote) {
      highlightKey(pressedNote, "green");
      let nextMeasure = measure;
      let nextNote = noteIndex + 1;

      if (nextNote >= melody[measure].length) {
        nextNote = 0;
        nextMeasure++;
      }

      if (nextMeasure < melody.length) {
        setCurrentNote({ measure: nextMeasure, note: nextNote });
      }
    } else {
      highlightKey(pressedNote, "red");
    }
  };

  const highlightKey = (note, color) => {
    const el = document.querySelector(`[data-note="${note}"]`);
    if (el) {
      const original = el.style.backgroundColor;
      el.style.backgroundColor = color;
      setTimeout(() => {
        el.style.backgroundColor = original || "";
      }, 300);
    }
  };

  const getLabel = (note) => {
    if (!showLabels) return "";
    const noteLetter = note[0];
    return useSolfege ? noteNamesRu[noteLetter] : note;
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setShowLabels(!showLabels)}>
          {showLabels ? "🎵 Notes OFF" : "🎵 Notes ON"}
        </button>
        {showLabels && (
          <button onClick={() => setUseSolfege(!useSolfege)} style={{ marginLeft: 10 }}>
            {useSolfege ? "🔘 A–B–C" : "🔘 Do–Re–Mi"}
          </button>
        )}
      </div>

      <div
        style={{
          position: "relative",
          width: whiteNotes.length * keyWidth,
          maxWidth: "100%",
          height: whiteKeyHeight,
          margin: "0 auto",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {whiteNotes.map((note) => (
          <div
            key={note}
            data-note={note}
            onMouseDown={() => playNote(note)}
            onTouchStart={() => playNote(note)}
            style={{
              width: keyWidth,
              height: whiteKeyHeight,
              border: "1px solid black",
              backgroundColor: "white",
              display: "inline-block",
              position: "relative",
              boxSizing: "border-box",
              userSelect: "none",
            }}
          >
            {showLabels && (
              <div
                style={{
                  position: "absolute",
                  bottom: 5,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 12,
                  color: "black",
                  userSelect: "none",
                }}
              >
                {getLabel(note)}
              </div>
            )}
          </div>
        ))}

        {whiteNotes.map((note, i) => {
          const noteName = note.slice(0, -1);
          const octave = note.slice(-1);
          if (!hasSharpRight[noteName]) return null;

          const blackNote = `${noteName}#${octave}`;
          if (!blackNotes.includes(blackNote)) return null;

          return (
            <div
              key={blackNote}
              data-note={blackNote}
              onMouseDown={() => playNote(blackNote)}
              onTouchStart={() => playNote(blackNote)}
              style={{
                position: "absolute",
                left: keyWidth * (i + 1) - blackKeyWidth / 2,
                width: blackKeyWidth,
                height: blackKeyHeight,
                backgroundColor: "black",
                borderRadius: "0 0 3px 3px",
                border: "1px solid #333",
                top: 0,
                zIndex: 2,
                cursor: "pointer",
                userSelect: "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PianoKeyboard;
