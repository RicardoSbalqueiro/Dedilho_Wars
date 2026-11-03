import { useCallback, useEffect, useMemo, useState } from 'react';
import { Frame } from './ui/common';
import { CharSelect, Controls, DifficultySelect, MainMenu, Settings, Splash, StageSelect } from './ui/Screens';
import type { MenuChoice } from './ui/Screens';
import { GameScreen } from './ui/GameScreen';
import { RadioPanel } from './ui/Radio';
import { audio } from './game/audio';
import { loadBindings } from './game/input';
import { applyPrefs, loadPrefs } from './game/prefs';
import type { CharId } from './game/data';
import type { Difficulty, GameConfig, Mode } from './game/engine';
import type { StageId } from './game/stage';

type Screen = 'splash' | 'menu' | 'diff' | 'select' | 'controls' | 'settings' | 'stage' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>(loadPrefs().difficulty);
  const [char, setChar] = useState<CharId>('caetano');
  const [opponent, setOpponent] = useState<CharId>('orango');
  const [gameKey, setGameKey] = useState(0);
  const [stageId, setStageId] = useState<StageId>('dojo');
  const [radioOpen, setRadioOpen] = useState(false);
  const openRadio = useCallback(() => setRadioOpen(true), []);
  const closeRadio = useCallback(() => setRadioOpen(false), []);

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
  const toStage = useCallback(() => { setScreen('stage'); }, []);

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
    } else if (c === 'radio') setRadioOpen(true);
    else if (c === 'controls') setScreen('controls');
    else setScreen('settings');
  }, []);

  const cfg: GameConfig = useMemo(
    () => ({ mode, p1: char, p2: opponent, stage: stageId, difficulty, bindings: loadBindings() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, char, opponent, stageId, difficulty, gameKey],
  );

  return (
    <Frame>
      {screen === 'splash' && <Splash onStart={start} />}
      {screen === 'menu' && <MainMenu onChoose={choose} onRadio={openRadio} suspended={radioOpen} />}
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
          suspended={radioOpen}
          onRadio={openRadio}
          onPick={(c, other) => {
            setChar(c);
            setOpponent(other);
            setScreen('stage');
          }}
          onBack={() => (mode === 'ai' ? setScreen('diff') : toMenu())}
        />
      )}
      {screen === 'stage' && <StageSelect p1={char} p2={opponent} initialStage={stageId} suspended={radioOpen} onRadio={openRadio} onBack={toSelect} onPick={(id) => { setStageId(id); setGameKey((k) => k + 1); audio.music('fight'); setScreen('game'); }} />}
      {screen === 'controls' && <Controls onBack={toMenu} />}
      {screen === 'settings' && <Settings onBack={toMenu} />}
      {screen === 'game' && <GameScreen key={gameKey} cfg={cfg} onExit={toMenu} onSelect={toSelect} onMap={toStage} onRadio={openRadio} inputSuspended={radioOpen} />}
      {radioOpen && <RadioPanel onBack={closeRadio} />}
    </Frame>
  );
}
