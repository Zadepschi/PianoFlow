import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { melody } from "./data/melodyData";

const fullWhiteNotes = [
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5", "E5", "F5", "G5", "A5", "B5",
];

const reducedWhiteNotes = [
  "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5", "E5",
];

const hasSharpRight = {
  C: true,
  D: true,
  E: false,
  F: true,
  G: true,
  A: true,
  B: false,
};

const keyWidth = 40;
const blackKeyWidth = 28;
const blackKeyHeight = 110;
const whiteKeyHeight = 180;

const noteNamesRu = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

const PianoKeyboard = ({ currentNote, setCurrentNote }) => {
  const synth = useRef(null);
  const [showLabels, setShowLabels] = useState(true);
  const [useSolfege, setUseSolfege] = useState(false);
  const [whiteNotesToShow, setWhiteNotesToShow] = useState(fullWhiteNotes);
  const [isRotated, setIsRotated] = useState(false);

  // Разблокировка аудио контекста при первом взаимодействии
  useEffect(() => {
    const unlockAudio = async () => {
      try {
        await Tone.start();
        console.log("Audio context unlocked");
        document.removeEventListener("touchstart", unlockAudio);
        document.removeEventListener("mousedown", unlockAudio);
      } catch (e) {
        console.warn("Tone.js unlock failed", e);
      }
    };

    document.addEventListener("touchstart", unlockAudio, { once: true });
    document.addEventListener("mousedown", unlockAudio, { once: true });

    return () => {
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("mousedown", unlockAudio);
    };
  }, []);

  // Обработка поворота экрана
  useEffect(() => {
    const handleResize = () => {
      setIsRotated(window.innerWidth < 665);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Создание и очистка синтезатора
  useEffect(() => {
    synth.current = new Tone.Synth().toDestination();
    return () => synth.current.dispose();
  }, []);

  // Адаптация количества белых клавиш под ширину экрана
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 858) {
        setWhiteNotesToShow(reducedWhiteNotes);
      } else {
        setWhiteNotesToShow(fullWhiteNotes);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
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

  if (isRotated) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          color: "white",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              width: 60,
              height: 100,
              border: "3px solid white",
              borderRadius: 12,
              margin: "0 auto",
              position: "relative",
              animation: "rotateIcon 2s infinite linear",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                bottom: 6,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
        </div>
        <p style={{ fontSize: 20, marginBottom: 8 }}>📱 Rotate the device</p>
        <p style={{ fontSize: 14, opacity: 0.8 }}>rotate the device to play the piano</p>
        <style>
          {`
            @keyframes rotateIcon {
              0% { transform: rotate(0deg); }
              25% { transform: rotate(20deg); }
              50% { transform: rotate(0deg); }
              75% { transform: rotate(-20deg); }
              100% { transform: rotate(0deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="block"
    style={{ textAlign: "center" }}>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setShowLabels(!showLabels)}>
          {showLabels ? "🎵 Notes OFF" : "🎵 Notes ON"}
        </button>
        {showLabels && (
          <button onClick={() => setUseSolfege(!useSolfege)} style={{ marginLeft: 10 }}>
            {useSolfege ? "🔘 Switch to A–B–C" : "🔘 Switch to Do–Re–Mi"}
          </button>
        )}
      </div>

      <div
      
        style={{
          position: "relative",
          width: keyWidth * whiteNotesToShow.length,
          height: whiteKeyHeight,
          margin: "0 auto",
          userSelect: "none",
        }}
      >
        {whiteNotesToShow.map((note, i) => (
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
              cursor: "pointer",
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

        {whiteNotesToShow.map((note, i) => {
          const noteName = note.slice(0, -1);
          const octave = note.slice(-1);
          if (!hasSharpRight[noteName]) return null;
          const blackNote = `${noteName}#${octave}`;

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
