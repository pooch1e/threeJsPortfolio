varying vec2 vUv;
varying vec3 position;


void main() {
  gl_Position = position;

  vUv = uv;
}