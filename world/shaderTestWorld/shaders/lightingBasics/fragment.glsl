uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/ambientLight.glsl
#include ../includes/directionalLight.glsl
#include ../includes/specularLight.glsl
void main() {
  vec3 normal = normalize(vNormal);
  vec3 color = uColor;
  // View Direction vec
  vec3 viewDirection = normalize(vPosition - viewDirection);


 // Lights
vec3 light = vec3(0);

 // Ambient Light
/*
  vec3 light = vec3(0);
  light += ambientLight(
    vec3(1),       // Color
    0.2            // Intensity
    );
*/

// Directional Light
// vec3 light = vec3(0);
// light += directionalLight(
//         vec3(0.1, 0.1, 1.0), // Light color
//         1.0,                 // Light intensity,
//         normal,             // Normal
//         vec3(0.0, 0.0, 3.0)  // Light position
//     );


// Specular Light (hard)

light += specularLight(
        vec3(0.1, 0.1, 1.0), // Light color
        1.0,                 // Light intensity,
        normal,             // Normal
        vec3(0.0, 0.0, 3.0), // Light position
        viewDirection,
        20.0 // spec power
    );


 color *= light;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}