uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;


uniform vec2 uResolution;

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

    // PARAMS
    float repitions = 50.0;
    vec3 directions = vec3(0.0, -1.0, 0.0);
    float low = - 0.8;
    float high = 1.5;
    float intensity = dot(normal, directions);
    vec3 pointColor = vec3(1.0, 0.0, 0.0);

    // Grid
    vec2 uv = gl_FragCoord.xy /uResolution.y;
    uv *= repitions;
    uv = mod(uv, 1.0);

    float point = distance(uv, vec2(0.5));
    point = 1.0 - step(0.5 * intensity, point);

    // color
    color = mix(color, pointColor, point);

    
    intensity = smoothstep(low, high, intensity);

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}