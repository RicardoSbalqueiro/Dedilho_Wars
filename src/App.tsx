import { useCallback, useEffect, useMemo, useState } from 'react';
import { Frame } from './ui/common';
import { CharSelect, Controls, DifficultySelect, MainMenu, Settings, Splash } from './ui/Screens';
import type { MenuChoice } from './ui/Screens';
import { GameScreen } from './ui/GameScreen';
import { audio } from './game/audio';
import { loadBindings } from './game/input';
import { applyPrefs, loadPrefs } from './game/prefs';
import type { CharId } from './game/data';
import type { Difficulty, GameConfig, Mode } from './game/engine';

type Screen = 'splash' | 'menu' | 'diff' | 'select' | 'controls' | 'settings' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>(loadPrefs().difficulty);
  const [char, setChar] = useState<CharId>('caetano');
  const [opponent, setOpponent] = useState<CharId>('orango');
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    document.title = 'DEDILHO WARS';
    applyPrefs(loadPrefs());
  }, []);

  const start = useCallback(() => {
    audio.init();
    audio.music('menu');
    setScreen('menu');
  }, []);

  const toMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const toSelect = useCallback(() => { setScreen('select'); }, []);

  const choose = useCallback((c: MenuChoice) => {
    if (c === 'play') {
      setMode('ai');
      setScreen('diff');
    } else if (c === 'versus') {
      setMode('versus');
      setScreen('select');
    } else if (c === 'training') {
      setMode('training');
      setScreen('select');
    } else if (c === 'controls') setScreen('controls');
    else setScreen('settings');
  }, []);

  const cfg: GameConfig = useMemo(
    () => ({ mode, p1: char, p2: opponent, difficulty, bindings: loadBindings() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, char, opponent, difficulty, gameKey],
  );

  return (
    <Frame>
      {screen === 'splash' && <Splash onStart={start} />}
      {screen === 'menu' && <MainMenu onChoose={choose} />}
      {screen === 'diff' && (
        <DifficultySelect
          onPick={(d) => {
            setDifficulty(d);
            audio.confirm();
            setScreen('select');
          }}
          onBack={toMenu}
        />
      )}
      {screen === 'select' && (
        <CharSelect
          mode={mode}
          difficulty={difficulty}
          initialP1={char}
          initialP2={opponent}
          onPick={(c, other) => {
            setChar(c);
            setOpponent(other);
            setGameKey((k) => k + 1);
            audio.music('fight');
            setScreen('game');
          }}
          onBack={() => (mode === 'ai' ? setScreen('diff') : toMenu())}
        />
      )}
      {screen === 'controls' && <Controls onBack={toMenu} />}
      {screen === 'settings' && <Settings onBack={toMenu} />}
      {screen === 'game' && <GameScreen key={gameKey} cfg={cfg} onExit={toMenu} onSelect={toSelect} />}
    </Frame>
  );
}
