// AISSISTED — AI Core vertex shader
// Passes UVs + a normalized radial coordinate through to the fragment shader
// for the rim-glow + rotating arc effect.

uniform float uTime;
uniform float uActivity; // 0..1, drives radial throb amplitude

varying vec2 vUv;
varying float vRadial;
varying float vAngle;

void main() {
  vUv = uv;
  // Normalized 0..1 radial coordinate (uv is centered 0..1)
  vec2 c = uv - 0.5;
  vRadial = length(c) * 2.0;
  vAngle = atan(c.y, c.x);

  // Subtle vertex-level breathing — scales the ring slightly with activity.
  float breath = 1.0 + sin(uTime * 0.9) * 0.012 * uActivity;

  vec3 pos = position * breath;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
