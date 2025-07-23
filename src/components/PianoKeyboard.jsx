import React, { useRef, useEffect } from 'react';
import * as Tone from 'tone';

const PianoKeyboard = () => {
  const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const synth = useRef(null);

  useEffect(() => {
 
    synth.current = new Tone.PolySynth().toDestination();
    return () => {
    
      if (synth.current) {
        synth.current.dispose();
      }
    };
  }, []);

  const handleKeyPress = (note) => {
    if (synth.current) {
      synth.current.triggerAttackRelease(note, '8n');
    }
  };

  return (
    <div className="piano-keyboard">
      {keys.map((key, index) => (
        <button
          key={key}
          className="white-key"
          onClick={() => handleKeyPress(key + '4')}
          style={{
            left: `${index * (100 / keys.length)}%`,
          }}
        >
          {key}
        </button>
      ))}
      <div className="black-keys">
        {['C', 'D', 'F', 'G', 'A'].map((key, index) => (
          <button
            key={key}
            className="black-key"
            onClick={() => handleKeyPress(key + '#4')}
            style={{
              left: `${(index + 1) * (100 / 6)}%`,
            }}
          >
            {key}#
          </button>
        ))}
      </div>
    </div>
  );
};

export default PianoKeyboard;
