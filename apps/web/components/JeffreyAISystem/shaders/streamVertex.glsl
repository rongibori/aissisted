// AISSISTED — Signal stream vertex shader
// Renders a signal packet as a billboard sprite at the bezier-interpolated
// position. The position attribute is a unit quad; we scale + place it
// per-instance via attributes.

attribute vec3 instancePos;     // World position from bezierPoint()
attribute float instanceScale;  // Per-signal scale (intensity-driven)
attribute vec3 instanceColor;   // RGB in 0..1
attribute float instanceAlpha;  // 0..1

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vUv = uv;
  vColor = instanceColor;
  vAlpha = instanceAlpha;

  // Billboard: keep the quad facing the camera
  vec3 worldPos = instancePos;
  vec4 mvPos = modelViewMatrix * vec4(worldPos, 1.0);
  // Add the quad offset in view space so it always faces camera
  mvPos.xy += position.xy * instanceScale;

  gl_Position = projectionMatrix * mvPos;
}
