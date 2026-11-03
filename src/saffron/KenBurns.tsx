import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Cam, IMAGES, ImageKey } from "../storyboard";

const W = 1080;
const H = 1920;

/**
 * Görseli kadrajı tamamen dolduracak şekilde yerleştirir ve odak noktası/yakınlık arasında
 * yumuşak bir kamera hareketi yapar. Kenarlar asla boş kalmaz (sınırlar kırpılır).
 */
export const KenBurns: React.FC<{ img: ImageKey; from: Cam; to: Cam; durationInFrames: number }> = ({
  img,
  from,
  to,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const meta = IMAGES[img];
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
  });
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const zoom = lerp(from.zoom, to.zoom);
  const fx = lerp(from.x, to.x);
  const fy = lerp(from.y, to.y);

  const cover = Math.max(W / meta.w, H / meta.h);
  const s = cover * zoom;
  const dw = meta.w * s;
  const dh = meta.h * s;
  const left = Math.min(0, Math.max(W - dw, W / 2 - fx * dw));
  const top = Math.min(0, Math.max(H - dh, H / 2 - fy * dh));

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Img
        src={staticFile(meta.src)}
        style={{
          position: "absolute",
          width: dw,
          height: dh,
          transform: `translate(${left}px, ${top}px)`,
          transformOrigin: "0 0",
          left: 0,
          top: 0,
          // Büyütülen düşük çözünürlüklü görsellerde hafif netlik/kontrast desteği, renkler korunur
          filter: "contrast(1.04) saturate(1.04)",
          maxWidth: "none",
        }}
      />
    </AbsoluteFill>
  );
};
