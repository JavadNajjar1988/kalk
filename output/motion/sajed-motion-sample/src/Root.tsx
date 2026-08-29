import {Composition} from 'remotion';
import {SajedTeaser} from './Composition';
import './index.css';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SajedFiveSecondTeaser"
      component={SajedTeaser}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
  );
};
