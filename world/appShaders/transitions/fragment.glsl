uniform float uProgress; // 0 = fully revealed, 1 = fully covered
uniform float uGridSize;
uniform vec3 uColor;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 cell = floor(uGridSize * vUv);
  float r = hash(cell);
  float mask = uProgress > r ? 1.0 : 0.0;

  gl_FragColor = vec4(uColor, mask);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
