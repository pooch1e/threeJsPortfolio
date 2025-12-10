uniform sampler2D uTexture;
uniform vec3 color;
void main() {

  float textureAlpha = texture2D(uTexture, gl_PointCoord).r;
  
  
  // Final Colour
  gl_FragColor = vec4(color, textureAlpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}