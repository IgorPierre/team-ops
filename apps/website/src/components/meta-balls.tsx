"use client";

import { useEffect, useRef } from "react";

import { ACCENT_HEX } from "@/lib/site";
import { cn } from "@/lib/styles";

function parseHexColor(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ];
}

function fract(x: number) {
  return x - Math.floor(x);
}

function hash31(p: number): [number, number, number] {
  const r: [number, number, number] = [fract(p * 0.1031), fract(p * 0.103), fract(p * 0.0973)];
  const dotVal = r[0] * (r[1] + 33.33) + r[1] * (r[2] + 33.33) + r[2] * (r[0] + 33.33);
  r[0] = fract(r[0] + dotVal);
  r[1] = fract(r[1] + dotVal);
  r[2] = fract(r[2] + dotVal);
  return r;
}

function hash33(v: [number, number, number]): [number, number, number] {
  const p: [number, number, number] = [fract(v[0] * 0.1031), fract(v[1] * 0.103), fract(v[2] * 0.0973)];
  const dotVal = p[0] * (p[1] + 33.33) + p[1] * (p[0] + 33.33) + p[2] * (p[2] + 33.33);
  p[0] = fract(p[0] + dotVal);
  p[1] = fract(p[1] + dotVal);
  p[2] = fract(p[2] + dotVal);
  return [fract((p[0] + p[1]) * p[2]), fract((p[0] + p[0]) * p[1]), fract((p[1] + p[0]) * p[0])];
}

const vertex = `#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec3 iMouse;
uniform vec3 iColor;
uniform vec3 iCursorColor;
uniform float iAnimationSize;
uniform int iBallCount;
uniform float iCursorBallSize;
uniform vec3 iMetaBalls[50];
uniform float iPixelSize;
uniform float iColorNum;
uniform bool enableTransparency;
out vec4 outColor;

const float bayerMatrix8x8[64] = float[64](
  0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
  8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
  2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
);

float getMetaBallValue(vec2 c, float r, vec2 p) {
  vec2 d = p - c;
  return (r * r) / dot(d, d);
}

vec3 dither(vec2 fc, vec3 color) {
  vec2 scaledCoord = floor(fc / iPixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
  float step = 1.0 / (iColorNum - 1.0);
  color += threshold * step;
  color = clamp(color - 0.12, 0.0, 1.0);
  return floor(color * (iColorNum - 1.0) + 0.5) / (iColorNum - 1.0);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float scale = iAnimationSize / iResolution.y;
  vec2 coord = (fc - iResolution.xy * 0.5) * scale;
  vec2 mouseW = (iMouse.xy - iResolution.xy * 0.5) * scale;
  float m1 = 0.0;
  for (int i = 0; i < 50; i++) {
    if (i >= iBallCount) break;
    m1 += getMetaBallValue(iMetaBalls[i].xy, iMetaBalls[i].z, coord);
  }
  float m2 = getMetaBallValue(mouseW, iCursorBallSize, coord);
  float total = m1 + m2;
  float f = smoothstep(-1.0, 1.0, (total - 1.3) / min(1.0, fwidth(total)));
  vec3 cFinal = vec3(0.0);
  if (total > 0.0) {
    float alpha1 = m1 / total;
    float alpha2 = m2 / total;
    cFinal = iColor * alpha1 + iCursorColor * alpha2;
  }
  vec3 d = dither(fc, cFinal);
  float a = enableTransparency ? dither(fc, vec3(f)).r : 1.0;
  outColor = vec4(d, a);
}
`;

type BallParam = {
  st: number;
  dtFactor: number;
  baseScale: number;
  toggle: number;
  radius: number;
};

export type MetaBallsProps = {
  className?: string;
  color?: string;
  cursorBallColor?: string;
  speed?: number;
  enableMouseInteraction?: boolean;
  hoverSmoothness?: number;
  animationSize?: number;
  ballCount?: number;
  clumpFactor?: number;
  cursorBallSize?: number;
  enableTransparency?: boolean;
  pixelSize?: number;
  colorNum?: number;
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "position");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function MetaBalls({
  className = "",
  color = ACCENT_HEX,
  cursorBallColor = ACCENT_HEX,
  speed = 0.3,
  enableMouseInteraction = true,
  hoverSmoothness = 0.15,
  animationSize = 30,
  ballCount = 15,
  clumpFactor = 1,
  cursorBallSize = 2,
  enableTransparency = true,
  pixelSize = 3,
  colorNum = 4,
}: MetaBallsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const program = createProgram(gl, vertex, fragment);
    if (!program) return;

    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const loc = {
      iTime: gl.getUniformLocation(program, "iTime"),
      iResolution: gl.getUniformLocation(program, "iResolution"),
      iMouse: gl.getUniformLocation(program, "iMouse"),
      iColor: gl.getUniformLocation(program, "iColor"),
      iCursorColor: gl.getUniformLocation(program, "iCursorColor"),
      iAnimationSize: gl.getUniformLocation(program, "iAnimationSize"),
      iBallCount: gl.getUniformLocation(program, "iBallCount"),
      iCursorBallSize: gl.getUniformLocation(program, "iCursorBallSize"),
      iMetaBalls: gl.getUniformLocation(program, "iMetaBalls[0]"),
      iPixelSize: gl.getUniformLocation(program, "iPixelSize"),
      iColorNum: gl.getUniformLocation(program, "iColorNum"),
      enableTransparency: gl.getUniformLocation(program, "enableTransparency"),
    };

    const [r1, g1, b1] = parseHexColor(color);
    const [r2, g2, b2] = parseHexColor(cursorBallColor);
    gl.uniform3f(loc.iColor, r1, g1, b1);
    gl.uniform3f(loc.iCursorColor, r2, g2, b2);
    gl.uniform1f(loc.iAnimationSize, animationSize);
    gl.uniform1f(loc.iCursorBallSize, cursorBallSize);
    gl.uniform1f(loc.iPixelSize, pixelSize);
    gl.uniform1f(loc.iColorNum, colorNum);
    gl.uniform1i(loc.enableTransparency, enableTransparency ? 1 : 0);

    const maxBalls = 50;
    const effectiveBallCount = Math.min(ballCount, maxBalls);
    gl.uniform1i(loc.iBallCount, effectiveBallCount);

    const ballParams: BallParam[] = [];
    for (let i = 0; i < effectiveBallCount; i++) {
      const h1 = hash31(i + 1);
      const h2 = hash33(h1);
      ballParams.push({
        st: h1[0] * (2 * Math.PI),
        dtFactor: 0.1 * Math.PI + h1[1] * (0.4 * Math.PI - 0.1 * Math.PI),
        baseScale: 5 + h1[1] * 5,
        toggle: Math.floor(h2[0] * 2),
        radius: 0.5 + h2[2] * 1.5,
      });
    }

    const balls = new Float32Array(maxBalls * 3);
    const mouseBallPos = { x: 0, y: 0 };
    let pointerInside = false;
    let pointerX = 0;
    let pointerY = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      const dpr = 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(loc.iResolution, canvas.width, canvas.height, 0);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!enableMouseInteraction) return;
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      pointerX = (px / rect.width) * canvas.width;
      pointerY = (1 - py / rect.height) * canvas.height;
    };
    const onPointerEnter = () => {
      if (enableMouseInteraction) pointerInside = true;
    };
    const onPointerLeave = () => {
      if (enableMouseInteraction) pointerInside = false;
    };

    container.appendChild(canvas);
    resize();
    window.addEventListener("resize", resize);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerenter", onPointerEnter);
    container.addEventListener("pointerleave", onPointerLeave);

    const startTime = performance.now();
    let raf = 0;
    const update = (t: number) => {
      raf = requestAnimationFrame(update);
      const elapsed = (t - startTime) * 0.001;
      gl.uniform1f(loc.iTime, elapsed);

      for (let i = 0; i < effectiveBallCount; i++) {
        const p = ballParams[i];
        const dt = elapsed * speed * p.dtFactor;
        const th = p.st + dt;
        const x = Math.cos(th);
        const y = Math.sin(th + dt * p.toggle);
        balls[i * 3] = x * p.baseScale * clumpFactor;
        balls[i * 3 + 1] = y * p.baseScale * clumpFactor;
        balls[i * 3 + 2] = p.radius;
      }
      gl.uniform3fv(loc.iMetaBalls, balls);

      let targetX: number;
      let targetY: number;
      if (pointerInside) {
        targetX = pointerX;
        targetY = pointerY;
      } else {
        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.5;
        targetX = cx + Math.cos(elapsed * speed) * canvas.width * 0.15;
        targetY = cy + Math.sin(elapsed * speed) * canvas.height * 0.15;
      }
      mouseBallPos.x += (targetX - mouseBallPos.x) * hoverSmoothness;
      mouseBallPos.y += (targetY - mouseBallPos.y) * hoverSmoothness;
      gl.uniform3f(loc.iMouse, mouseBallPos.x, mouseBallPos.y, 0);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerenter", onPointerEnter);
      container.removeEventListener("pointerleave", onPointerLeave);
      if (canvas.parentNode === container) container.removeChild(canvas);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    animationSize,
    ballCount,
    clumpFactor,
    color,
    colorNum,
    cursorBallColor,
    cursorBallSize,
    enableMouseInteraction,
    enableTransparency,
    hoverSmoothness,
    pixelSize,
    speed,
  ]);

  return <div ref={containerRef} className={cn("relative h-full w-full", className)} />;
}
