
uniform vec3 uDepthColour;
uniform vec3 uSurfaceColour;

uniform float uColorOffset;
uniform float uColorMultiplier;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/specularLight.glsl

void main()
{

    //varyings
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    
    // Base Colour
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    // smooth gradient
    mixStrength = smoothstep(0.0, 1.0, mixStrength);

    vec3 color = mix(uDepthColour, uSurfaceColour, mixStrength);


        // Lights
    vec3 light = vec3(0);

    light += specularLight(
        vec3(1.0),            // Light color
        1.0,                  // Light intensity,
        normal,               // Normal
        vec3(-1.0, 0.5, 0.0), // Light position
        viewDirection,        // View direction
        30.0                  // Specular power
    );

    color *= light;
    
    // Final Colour
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
    #include <tonemapping_fragment>
   
}