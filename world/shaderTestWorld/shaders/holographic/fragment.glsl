varying vec3 vPosition;
void main()
{

  // Stripes pattern
  float stripes = vPosition.y;
  
    // Final color
    gl_FragColor = vec4(stripes, stripes, stripes, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}