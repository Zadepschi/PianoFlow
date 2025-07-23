import { useEffect, useRef, useState } from "react";
import { Renderer, Stave, StaveNote, Voice, Formatter, Barline, Beam, Tuplet, Volta } from "vexflow";
import * as Tone from "tone";
import { hornerMelody } from "./data/hornerMelodyData";

const durationToVF = {
  "16n": "16", "16n.": "16d", "8n": "8", "8n.": "8d",
  "4n": "q", "4n.": "qd", "2n": "h", "1n": "w"
};

const durationToSeconds = {
  "16n": 0.25, "16n.": 0.375, "8n": 0.5, "8n.": 0.75,
  "4n": 1.0, "4n.": 1.5, "2n": 2.0, "1n": 4.0
};

const HornerMelody = ({ onPlayNote }) => {
  const containerRef = useRef(null);
  const [highlight, setHighlight] = useState({ measure: -1, note: -1 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const synth = useRef(null);

  useEffect(() => {
    synth.current = new Tone.Synth().toDestination();
    return () => synth.current.dispose();
  }, []);

  const renderStaves = (highlightNote) => {
    const div = containerRef.current;
    div.innerHTML = "";

    const renderer = new Renderer(div, Renderer.Backends.SVG);
    const context = renderer.getContext();
    renderer.resize(1200, 330);
    context.setFont("Arial", 10);

    const rowConfigs = [5, 4, 6];
    const totalRowWidth = 1100;
    const spacingY = 100;
    let xStart = 10;
    let y = -10;

    const rowCustomWidths = [
      null,
      [1.5, 1, 1, 0.5],
      [1.5, 1, 1, 1, 1, 0.5]
    ];

    let measureIndex = 0;

    rowConfigs.forEach((measuresInRow, rowNumber) => {
      const customWidths = rowCustomWidths[rowNumber];
      const widthUnitSum = customWidths
        ? customWidths.reduce((sum, w) => sum + w, 0)
        : measuresInRow;

      let x = xStart;

      for (let i = 0; i < measuresInRow; i++) {
        const measure = hornerMelody[measureIndex];
        const relativeUnit = customWidths ? customWidths[i] : 1;
        const staveWidth = (relativeUnit / widthUnitSum) * totalRowWidth;

        const stave = new Stave(x, y, staveWidth);

        if (i === 0) {
          stave.addClef("treble");
          if (measureIndex === 0) stave.addTimeSignature("4/4");
        }

        if (measureIndex === 5) stave.setBegBarType(Barline.type.REPEAT_BEGIN);
        if (measureIndex === 8) stave.setEndBarType(Barline.type.REPEAT_END);
        if (measureIndex === 9) stave.setBegBarType(Barline.type.REPEAT_BEGIN);
        if (measureIndex === 12) stave.setEndBarType(Barline.type.REPEAT_END);
        if (measureIndex === 14 || measureIndex === hornerMelody.length - 1) {
          stave.setEndBarType(Barline.type.END);
        }

        if (measureIndex === 12) {
          stave.setVoltaType(Volta.type.BEGIN_END, "1.", 40);
        }
        if (measureIndex === 13) {
          stave.setVoltaType(Volta.type.BEGIN, "2.", 40);
        }

        stave.setContext(context).draw();

        const notes = measure.map(({ note, duration }, noteIndex) => {
          const vfDuration = durationToVF[duration] || "q";
          const staveNote = new StaveNote({
            keys: [note.replace(/(\d)/, "/$1")],
            duration: vfDuration
          });

          if (
            highlightNote.measure === measureIndex &&
            highlightNote.note === noteIndex
          ) {
            const style = highlightNote.error
              ? { fillStyle: "red", strokeStyle: "red" }
              : { fillStyle: "red", strokeStyle: "red" };
            staveNote.setStyle(style);
          }

          return staveNote;
        });

        const tuplets = [];
        for (let i = 0; i < measure.length - 2; i++) {
          const a = measure[i], b = measure[i + 1], c = measure[i + 2];
          if (a.tuplet && b?.tuplet && c?.tuplet) {
            tuplets.push(new Tuplet([notes[i], notes[i + 1], notes[i + 2]]));
            i += 2;
          }
        }

        const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false).addTickables(notes);
        const beams = Beam.generateBeams(notes);
        const formatter = new Formatter();

        if (measureIndex === 5 || measureIndex === 9) {
          formatter.formatToStave([voice], stave);
        } else {
          formatter.joinVoices([voice]).format([voice], staveWidth - 20);
        }

        voice.draw(context, stave);
        beams.forEach(beam => beam.setContext(context).draw());
        tuplets.forEach(tuplet => tuplet.setContext(context).draw());

        x += staveWidth;
        measureIndex++;
      }

      y += spacingY;
    });
  };

  useEffect(() => {
    renderStaves(highlight);
  }, [highlight]);

  const handleKeyPress = (pressedNote) => {
    const measure = hornerMelody[currentMeasureIndex];
    if (!measure) return;

    const expected = measure[currentNoteIndex];

    if (pressedNote === expected.note) {
      synth.current.triggerAttackRelease(pressedNote, "8n");
      setHighlight({ measure: currentMeasureIndex, note: currentNoteIndex });

      const nextNote = currentNoteIndex + 1;
      if (nextNote < measure.length) {
        setCurrentNoteIndex(nextNote);
      } else {
        setCurrentMeasureIndex(currentMeasureIndex + 1);
        setCurrentNoteIndex(0);
      }
    } else {
      setHighlight({ measure: currentMeasureIndex, note: currentNoteIndex, error: true });
      setTimeout(() => {
        setHighlight({ measure: currentMeasureIndex, note: currentNoteIndex });
      }, 300);
    }
  };

  // подключение внешнего onKeyPress
  useEffect(() => {
    if (onPlayNote) {
      onPlayNote(handleKeyPress);
    }
  }, [handleKeyPress]);

  const playMelody = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    await Tone.start();

    const playMeasure = async (measure, measureIndex) => {
      for (let noteIndex = 0; noteIndex < measure.length; noteIndex++) {
        const { note, duration, tuplet } = measure[noteIndex];
        setHighlight({ measure: measureIndex, note: noteIndex });

        let dur = durationToSeconds[duration] || 0.5;
        if (tuplet) dur *= 2 / 3;

        synth.current.triggerAttackRelease(note, dur);
        await new Promise(res => setTimeout(res, dur * 1000));
      }
    };

    for (let i = 0; i <= 4; i++) await playMeasure(hornerMelody[i], i);
    for (let r = 0; r < 2; r++) for (let i = 5; i <= 8; i++) await playMeasure(hornerMelody[i], i);
    for (let r = 0; r < 2; r++) {
      for (let i = 9; i <= 11; i++) await playMeasure(hornerMelody[i], i);
      if (r === 0) await playMeasure(hornerMelody[12], 12);
      else {
        await playMeasure(hornerMelody[13], 13);
        await playMeasure(hornerMelody[14], 14);
      }
    }
    await playMeasure(hornerMelody[15], 15);

    setHighlight({ measure: -1, note: -1 });
    setIsPlaying(false);
  };

  return (
    <div>
      <button className="playButton"
       onClick={playMelody} 
       disabled={isPlaying}>
        🔊 Listen
      </button>
      <div ref={containerRef}></div>
    </div>
  );
};

export default HornerMelody;
