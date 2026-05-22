import { Composition } from 'remotion';
import { DailyFocus3D } from './components/DailyFocus3D';

export const RemotionRoot = () => {
  return (
    <Composition
      id="DailyFocus3D"
      component={DailyFocus3D}
      durationInFrames={210}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
