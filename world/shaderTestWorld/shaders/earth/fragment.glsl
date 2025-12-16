varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Uniforms
uniform sampler2D uEarthDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    // Color
    vec3 color = vec3(0.0);

    

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}