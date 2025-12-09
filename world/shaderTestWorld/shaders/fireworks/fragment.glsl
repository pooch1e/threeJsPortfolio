uniform sampler2D uTexture;
void main() {

  vec4 textureColor = texture2D(uTexture, gl_PointCoord);
  
  
  // Final Colour
  gl_FragColor = textureColor;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}