// AISSISTED — Signal stream fragment shader
// Soft circular packet with center-bright falloff. Additive blending in JS.

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  if (r > 1.0) discard;

  // Bright core, soft halo — two falloff curves stacked
  float core = smoothstep(0.35, 0.0, r);
  float halo = smoothstep(1.0, 0.4, r) * 0.5;
  float a = (core + halo) * vAlpha;

  vec3 col = vColor * (0.7 + core * 0.6);
  gl_FragColor = vec4(col, a);
}
