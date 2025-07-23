import { useEffect, useRef, useState } from "react";
import { Renderer, Stave, StaveNote, Voice, Formatter, Barline } from "vexflow";
import * as Tone from "tone";
import { melody } from "./data/melodyData";

const durationToVF = {
  "4n": "q",
  "2n": "h"
};

const NoteStaff = ({ highlight }) => {
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoHighlight, setAutoHighlight] = useState({ measure: -1, note: -1 });
  const timeoutsRef = useRef([]);

  const renderStaves = () => {
    const div = containerRef.current;
    div.innerHTML = "";

    const renderer = new Renderer(div, Renderer.Backends.SVG);
    const width = 850;
    const height = 230;
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont("Arial", 10);

    const firstStaveWidth = 320;
    const regularStaveWidth = 160;
    const stavesPerLine = 4;
    const lineSpacing = 80;

    let x = 10;
    let y = 40;

    melody.forEach((measure, measureIndex) => {
      if (measureIndex > 0 && measureIndex % stavesPerLine === 0) {
        x = 10;
        y += lineSpacing;
      }

      const isFirst = measureIndex === 0 || measureIndex === stavesPerLine;
      const isLast = measureIndex === melody.length - 1;
      const staveWidth = isFirst ? firstStaveWidth : regularStaveWidth;

      const stave = new Stave(x, y, staveWidth);

      if (isFirst) {
        stave.addClef("treble").addTimeSignature("4/4");
      }

      if (measureIndex === 4) {
        stave.setBegBarType(Barline.type.REPEAT_BEGIN);
      }
      if (measureIndex === 7) {
        stave.setEndBarType(Barline.type.REPEAT_END);
      }
      if (isLast) {
        stave.setEndBarType(Barline.type.END);
      }

      stave.setContext(context).draw();

      const notes = measure.map(({ note, duration }, noteIndex) => {
        const staveNote = new StaveNote({
          keys: [note.replace(/(\d)/, "/$1")],
          duration: durationToVF[duration],
        });

        const isAuto = autoHighlight.measure === measureIndex && autoHighlight.note === noteIndex;
        const isUser = highlight.measure === measureIndex && highlight.note === noteIndex;

        if (isAuto || isUser) {
          staveNote.setStyle({ fillStyle: "#B6F500", strokeStyle: "#B6F500" });
        } else {
          staveNote.setStyle({ fillStyle: "black", strokeStyle: "black" });
        }

        return staveNote;
      });

      const voice = new Voice({ num_beats: 4, beat_value: 4 });
      voice.setStrict(true);
      voice.addTickables(notes);

      const formatWidth = isFirst ? staveWidth - 60 : staveWidth - 20;
      new Formatter().joinVoices([voice]).format([voice], formatWidth);
      voice.draw(context, stave);

      x += staveWidth;
    });
  };

  const playMelody = async () => {
    await Tone.start();
    setIsPlaying(true);
    const synth = new Tone.Synth().toDestination();

    let time = 0;

    const playNote = (note, duration, measureIndex, noteIndex) => {
      const timeoutId = setTimeout(() => {
        setAutoHighlight({ measure: measureIndex, note: noteIndex });
        synth.triggerAttackRelease(note, duration);
      }, time * 1000);
      timeoutsRef.current.push(timeoutId);
      time += Tone.Time(duration).toSeconds();
    };

    // Меры до репризы (0–3)
    for (let i = 0; i < 4; i++) {
      melody[i].forEach((n, ni) => playNote(n.note, n.duration, i, ni));
    }

    // Реприза: меры 4–7 (2 раза)
    for (let repeat = 0; repeat < 2; repeat++) {
      for (let i = 4; i <= 7; i++) {
        melody[i].forEach((n, ni) => playNote(n.note, n.duration, i, ni));
      }
    }

    // После репризы
    for (let i = 8; i < melody.length; i++) {
      melody[i].forEach((n, ni) => playNote(n.note, n.duration, i, ni));
    }

    const finalTimeout = setTimeout(() => {
      setAutoHighlight({ measure: -1, note: -1 });
      setIsPlaying(false);
    }, time * 1000 + 100);
    timeoutsRef.current.push(finalTimeout);
  };

  useEffect(() => {
    renderStaves();
  }, [highlight, autoHighlight]);

  useEffect(() => {
    return () => {
      // Очистить все таймеры при размонтировании
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      setIsPlaying(false);
    };
  }, []);

  return (
    <div>
      <button className="playButton"
        onClick={playMelody}
        disabled={isPlaying}
      >
        🔊 Listen
      </button>
      <div ref={containerRef}></div>
    </div>
  );
};

export default NoteStaff;
