varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Uniforms
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    // Color
    vec3 color = vec3(0.0);

    // Light direction
    vec3 uSunDirection = vec3(0.0, 0.0, 1.0);
    // Calculates how close normal (ie side facing sun) is to light. If +1 it is facing, if -1 it is shadow and if 0.5 is perpendicular
    float sunOrientation = dot(uSunDirection, normal);
    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);

    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    
    
    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}