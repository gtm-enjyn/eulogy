import { Composition } from 'remotion';
import { Film, FPS, TOTAL_FRAMES } from './Film';

export const Root = () => (
  <Composition id="Eulogy" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
