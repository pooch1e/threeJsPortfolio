uniform sampler2D uTexture;
void main() {

  float textureAlpha = texture2D(uTexture, gl_PointCoord).r;
  
  
  // Final Colour
  gl_FragColor = vec4(1, 1, 1, textureAlpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}