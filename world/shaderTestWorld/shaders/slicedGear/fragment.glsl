varying vec3 vPosition;

uniform float uSliceStart;
uniform float uSliceArc;

void main() {

  

  float angle = atan(vPosition.y, vPosition.x);
    angle -= uSliceStart;
    angle = mod(angle, PI * 2.0);

    if(angle > 0.0 && angle < uSliceArc)
        discard;



  // csm_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}