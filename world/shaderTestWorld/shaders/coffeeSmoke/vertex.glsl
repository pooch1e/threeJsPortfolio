varying vec2 vUv;

void main() {
  // varyings
  vUv = uv;

  
 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}