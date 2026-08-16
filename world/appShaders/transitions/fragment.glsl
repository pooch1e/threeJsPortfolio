//uniforms
uniform float uProgress;
uniform float uGridSize;

varying vec2 vUv;

// random arbitrary fraction function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 cell = floor(uGridSize * vUv);// turns into grid

  float r = hash(cell);


  gl_FragColor = vec4y(vUv.x, vUv.y, 0.0, 0.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
