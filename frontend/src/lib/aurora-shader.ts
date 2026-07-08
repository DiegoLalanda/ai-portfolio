/**
 * Fondo animado tipo "aurora" renderizado con WebGL puro (sin dependencias).
 * Portado 1:1 desde el diseño exportado de Stitch.
 */

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;

    float dist = distance(uv, mouse);
    vec2 mouseOffset = (uv - mouse) * smoothstep(0.5, 0.0, dist) * 0.05;
    vec2 distortedUv = uv + mouseOffset;

    float t = u_time * 0.2;

    float n1 = snoise(distortedUv * 2.0 + vec2(t * 0.5, t * 0.3));
    float n2 = snoise(distortedUv * 3.0 - vec2(t * 0.2, n1 * 0.5));
    float n3 = snoise(distortedUv * 5.0 + vec2(n2 * 0.4, t * 0.1));

    vec3 color1 = vec3(0.08, 0.0, 0.25);
    vec3 color2 = vec3(0.0, 0.3, 0.3);
    vec3 color3 = vec3(0.03, 0.03, 0.06);

    float intensity = smoothstep(-0.5, 1.0, n1 * n2 + n3 * 0.5);
    vec3 finalColor = mix(color3, color1, intensity);
    finalColor = mix(finalColor, color2, clamp(n2 * 0.8, 0.0, 1.0) * intensity);

    float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function initAuroraShader(canvas: HTMLCanvasElement): void {
  function syncSize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(syncSize).observe(canvas);
  }
  syncSize();

  const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  if (!gl) return;

  const program = gl.createProgram()!;
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const timeLocation = gl.getUniformLocation(program, "u_time");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const mouseLocation = gl.getUniformLocation(program, "u_mouse");

  const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  let animationFrameId = 0;
  let isRunning = true;

  window.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      const normalizedX = (event.clientX - rect.left) / rect.width;
      const normalizedY = 1 - (event.clientY - rect.top) / rect.height;
      mouse.x = normalizedX * canvas.width;
      mouse.y = normalizedY * canvas.height;
    }
  });

  function render(time: number) {
    if (!isRunning) return;
    if (typeof ResizeObserver === "undefined") syncSize();
    gl!.viewport(0, 0, canvas.width, canvas.height);
    if (timeLocation) gl!.uniform1f(timeLocation, time * 0.001);
    if (resolutionLocation) gl!.uniform2f(resolutionLocation, canvas.width, canvas.height);
    if (mouseLocation) gl!.uniform2f(mouseLocation, mouse.x, mouse.y);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    animationFrameId = requestAnimationFrame(render);
  }

  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    animationFrameId = requestAnimationFrame(render);
  }

  function stopLoop() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  startLoop();
}
