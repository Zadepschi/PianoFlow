import React, { useEffect, useRef } from 'react';
import { VexFlow } from 'vexflow';

const SheetMusic = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      
    
      const renderer = new VexFlow.Renderer(ctx, VexFlow.Renderer.Backends.CANVAS);
      renderer.resize(500, 200);
      
    
      const context = renderer.getContext();
      
    
      const stave = new VexFlow.Stave(10, 40, 400);
      stave.addClef('treble');
      stave.addTimeSignature('4/4');
      stave.setContext(context).draw();
      
    
      const notes = [
        new VexFlow.StaveNote({
          clef: 'treble',
          keys: ['c/4', 'e/4', 'g/4'],
          duration: 'q'
        }),
        new VexFlow.StaveNote({
          clef: 'treble',
          keys: ['d/4', 'f/4', 'a/4'],
          duration: 'q'
        })
      ];
      
   
      const voice = new VexFlow.Voice({
        num_beats: 4,
        beat_value: 4
      });
      
      voice.addTickables(notes);
      new VexFlow.Formatter().joinVoices([voice]).formatToStave([voice], stave);
      

      voice.draw(context, stave);
    }
  }, []);

  return (
    <canvas ref={canvasRef} width="500" height="200"></canvas>
  );
};

export default SheetMusic;
