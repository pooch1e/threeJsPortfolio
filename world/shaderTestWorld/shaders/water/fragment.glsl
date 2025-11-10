
uniform vec3 uDepthColour;
uniform vec3 uSurfaceColour;

uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
void main()
{
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColour, uSurfaceColour, mixStrength);
    
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
}