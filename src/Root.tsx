import { Composition } from "remotion";
import { CloudFlight } from "./CloudFlight";
import { DURATION, FPS, HEIGHT, SAF_DURATION, SAF_FPS, WIDTH } from "./storyboard";
import { Saffron } from "./saffron/Saffron";

// 1080x1920 olarak tasarlanır; 4K için render'da --scale=2 kullanılır (2160x3840).
export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="CloudFlight"
    component={CloudFlight}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
  <Composition id="Saffron" component={Saffron} durationInFrames={SAF_DURATION} fps={SAF_FPS} width={1080} height={1920} />
  </>
);
