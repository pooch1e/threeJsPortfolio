
uniform vec3 uDepthColour;
uniform vec3 uSurfaceColour;

uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
void main()
{
    // Base Colour
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    vec3 color = mix(uDepthColour, uSurfaceColour, mixStrength);
    
    // Final Colour
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
}