// AISSISTED — AI Core fragment shader
// Renders the central nucleus + soft inner glow + rotating arc segments.
// All three layers in one shader so we don't pay for multiple draw calls.

uniform float uTime;
uniform float uActivity;     // 0..1
uniform float uMode;         // 0=idle, 1=listening, 2=thinking, 3=speaking, 4=recommendation
uniform vec3  uAqua;
uniform vec3  uWhite;
uniform vec3  uRed;

varying vec2 vUv;
varying float vRadial;
varying float vAngle;

float arc(float angle, float center, float width, float feather) {
  float d = abs(mod(angle - center + 3.14159, 6.28318) - 3.14159);
  return smoothstep(width + feather, width, d);
}

void main() {
  // Background — core inner darkness
  vec3 col = vec3(0.02, 0.05, 0.10);
  float alpha = 0.0;

  // ── Nucleus (bright center) ───────────────────────────────────────
  float nucleus = smoothstep(0.20, 0.0, vRadial);
  vec3 nucleusColor = mix(uAqua, uWhite, 0.6 + 0.4 * uActivity);
  col += nucleus * nucleusColor * (0.8 + uActivity * 0.4);
  alpha += nucleus * (0.85 + uActivity * 0.15);

  // ── Inner glow halo ───────────────────────────────────────────────
  float halo = smoothstep(0.55, 0.20, vRadial) * (0.45 + uActivity * 0.35);
  col += halo * uAqua * 0.7;
  alpha += halo * 0.6;

  // ── Rotating arc segments (4 of them) ────────────────────────────
  float arcRadius = 0.78;
  float arcRing = smoothstep(0.05, 0.0, abs(vRadial - arcRadius));

  // Speed scales with mode: idle is slow, thinking spins fastest
  float spinSpeed = 0.18 + uActivity * 0.65;
  float a1 = uTime * spinSpeed;
  float a2 = -uTime * spinSpeed * 0.62 + 1.5;
  float a3 = uTime * spinSpeed * 0.41 + 3.1;
  float a4 = -uTime * spinSpeed * 0.83 + 4.6;

  float arcs = 0.0;
  arcs += arc(vAngle, a1, 0.55, 0.06);
  arcs += arc(vAngle, a2, 0.42, 0.06);
  arcs += arc(vAngle, a3, 0.34, 0.05);
  arcs += arc(vAngle, a4, 0.22, 0.05);
  arcs = clamp(arcs, 0.0, 1.0);

  vec3 arcColor = mix(uAqua, uWhite, 0.15 + uActivity * 0.45);
  // Recommendation mode — tint a hint of red into the dominant arc
  if (uMode > 3.5) {
    arcColor = mix(arcColor, uRed, 0.25);
  }
  col += arcRing * arcs * arcColor * (0.85 + uActivity * 0.55);
  alpha += arcRing * arcs * 0.85;

  // ── Outer fade ────────────────────────────────────────────────────
  float edgeFade = smoothstep(1.0, 0.92, vRadial);
  alpha *= edgeFade;
  col *= edgeFade;

  // Discard far-edge transparent pixels to keep the bounding sprite tight
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
