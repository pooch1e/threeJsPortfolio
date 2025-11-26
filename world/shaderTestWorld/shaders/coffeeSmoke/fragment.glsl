varying vec2 vUv;
uniform sampler2D uPerlinTexture;
void main() {
  

  float smoke = texture(uPerlinTexture, vUv).r;

  gl_FragColor = vec4(1, 1, 1, smoke);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}