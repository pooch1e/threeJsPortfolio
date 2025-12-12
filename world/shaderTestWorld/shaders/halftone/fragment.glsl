uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 uResolution;

#include ../includes/ambientLight.glsl
#include ../includes/specularLight.glsl


void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = uColor;

    // Lights
    vec3 light = vec3(0);

    // Ambient Light
    light += ambientLight(
        vec3(1.0), // Light color
        1.0        // Light intensity,
    );

    // Directional Light
    light += specularLight(
        vec3(1.0, 1.0, 1.0), // Light color
        1.0,                 // Light intensity
        normal,              // Normal
        vec3(1.0, 1.0, 0.0), // Light position
        viewDirection,       // View direction
        1.0                  // Specular power
    );

    color *= light;

    // Grid
    vec2 uv = gl_FragCoord.xy /uResolution;
    uv *= 50.0;
    uv = mod(uv, 1.0);

    // Final color
    gl_FragColor = vec4(uv, 1.0, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}