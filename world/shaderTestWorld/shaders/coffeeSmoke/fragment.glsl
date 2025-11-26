varying vec2 vUv;

uniform float uTime;
uniform sampler2D uPerlinTexture;
void main() {
  
  // scale and animate
  vec2 smokeUv = vUv;
  smokeUv.x *= 0.5;
  smokeUv.y *= 0.3;
  smokeUv.y += uTime;


  float smoke = texture(uPerlinTexture, smokeUv).r;

  gl_FragColor = vec4(1, 1, 1, smoke);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}