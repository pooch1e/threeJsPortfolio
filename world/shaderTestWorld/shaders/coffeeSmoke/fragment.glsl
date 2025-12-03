varying vec2 vUv;

uniform float uTime;
uniform sampler2D uPerlinTexture;



void main() {
  
  // scale and animate
  vec2 smokeUv = vUv;

  smokeUv.x *= 0.5;
  smokeUv.y *= 0.3;
  smokeUv.y -= uTime * 0.03;


  float smoke = texture(uPerlinTexture, smokeUv).r;

    //remap + normalise with smooth step
  smoke = smoothstep(0.4, 1.0, smoke);

  // Edges
  /*
    Test tone
    smoke = 1.0;
  */  
  // Left edge
  smoke *= smoothstep(0.0, 0.1, vUv.x);
  // Right edge
  smoke *= smoothstep(1.0, 0.9, vUv.x);
  // Top Edge
  smoke *= smoothstep(0.0, 0.1, vUv.y);
  // Bottom Edge
  smoke *= smoothstep(1.0, 0.9, vUv.y);

  gl_FragColor = vec4(0.6, 0.3, 0.2, smoke);
  gl_FragColor = vec4(1, 0, 0, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}