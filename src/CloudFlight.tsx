import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import {
  AQUA,
  BOLT_CORE,
  BOLT_GLOW,
  CLOUD_RES,
  FOV,
  GLOW,
  PINK,
  ROT_SPEED,
  STRIKES,
  THUNDER_DELAY,
} from "./storyboard";
import { BOLTS, camZ, strikeIntensity, strikeWorld } from "./clouds/scene";
import { FRAG, makeNoiseVolume, VERT } from "./clouds/shader";

type GLState = { gl: WebGL2RenderingContext; prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

const NOISE_SIZE = 96;
let noiseCache: Uint8Array | null = null;

const setupGL = (canvas: HTMLCanvasElement): GLState => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false })!;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader error");
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link error");
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  noiseCache ??= makeNoiseVolume(NOISE_SIZE, 7);
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_3D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8, NOISE_SIZE, NOISE_SIZE, NOISE_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, noiseCache);
  for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, p, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const u: GLState["u"] = {};
  for (const n of ["uNoise", "uRes", "uCamZ", "uRot", "uFov", "uFlash", "uPink", "uAqua", "uGlow"])
    u[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(u.uNoise, 0);
  return { gl, prog, u };
};

export const CloudFlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const glRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<GLState | null>(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const gw = Math.round(width * dpr * CLOUD_RES);
  const gh = Math.round(height * dpr * CLOUD_RES);

  useLayoutEffect(() => {
    const t = frame / fps;
    const cz = camZ(t);
    const flashes = STRIKES.map((s, i) => ({ i, I: strikeIntensity(s, t), w: strikeWorld(s) }));

    // 1) Hacimli bulutlar (WebGL)
    if (!state.current) state.current = setupGL(glRef.current!);
    const { gl, u } = state.current;
    gl.viewport(0, 0, gw, gh);
    gl.uniform2f(u.uRes, gw, gh);
    gl.uniform1f(u.uCamZ, cz);
    gl.uniform1f(u.uRot, t * ROT_SPEED);
    gl.uniform1f(u.uFov, FOV);
    gl.uniform3fv(u.uPink, PINK);
    gl.uniform3fv(u.uAqua, AQUA);
    gl.uniform3fv(u.uGlow, GLOW);
    const fl = new Float32Array(16);
    flashes.forEach((f, k) => fl.set([f.w.x, f.w.y, f.w.z, f.I], k * 4));
    gl.uniform4fv(u.uFlash, fl);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();

    // 2) Şimşek çizgileri (tam çözünürlükte, keskin)
    const ctx = fxRef.current!.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    for (const f of flashes) {
      const z = f.w.z - cz;
      if (f.I < 0.25 || z < 2) continue;
      const k = height / (FOV * z);
      const px = cx + f.w.x * k;
      const py = cy - f.w.y * k;
      const bolt = BOLTS[f.i];
      const paths = [bolt.main, ...bolt.branches];
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const strokes: [number, string, number][] = [
        [40, BOLT_GLOW, 0.07],
        [16, BOLT_GLOW, 0.22],
        [6, BOLT_CORE, 0.55],
        [2.8, BOLT_CORE, 1],
      ];
      for (const [w, color, a] of strokes) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = Math.min(1, f.I) * a;
        paths.forEach((path, pi) => {
          ctx.lineWidth = w * (pi === 0 ? 1 : 0.45);
          ctx.beginPath();
          path.forEach(([x, y], j) => {
            const X = px + x * k;
            const Y = py - y * k;
            if (j === 0) ctx.moveTo(X, Y);
            else ctx.lineTo(X, Y);
          });
          ctx.stroke();
        });
      }
      ctx.restore();
    }
  }, [frame, fps, width, height, dpr, gw, gh]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <canvas ref={glRef} width={gw} height={gh} style={{ position: "absolute", width, height }} />
      <canvas
        ref={fxRef}
        width={width * dpr}
        height={height * dpr}
        style={{ position: "absolute", width, height }}
      />
      {STRIKES.map((s, i) => (
        <Sequence key={i} from={Math.round((s.t + THUNDER_DELAY[i]) * fps)} layout="none">
          <Audio src={staticFile(`thunder-${i + 1}.wav`)} volume={0.75 * s.power + 0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
