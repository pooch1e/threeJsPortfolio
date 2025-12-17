varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Uniforms
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);

    // Color
    vec3 color = vec3(0.0);


    // Color is black and white here------:

    // Calculates how close normal (ie side facing sun) is to light. If +1 it is facing, if -1 it is shadow and if 0.5 is perpendicular
    float sunOrientation = dot(uSunDirection, normal);
    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);

    
    //Day/Night
    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    // Cloud texture
    vec2 cloudColor = texture2D(uSpecularCloudsTexture, vUv).rg;
    float cloudsMix = cloudColor.g;
    cloudsMix = smoothstep(0.5, 1.0, cloudColor.g);

    cloudsMix *= dayMix; // clouds dissapear at night

    color = mix(color, vec3(1.0), cloudsMix);

    // Fresnel
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);
    
    // Atmosphere
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);


    // Specular
    vec3 reflection = reflect(- uSunDirection, normal);
    float specular = - dot(reflection, viewDirection);
    specular = max(specular, 0.0);
    specular = pow(specular, 32.0);

    specular *= cloudColor.r;
    

    vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);
    color += specular * specularColor;
    
    
    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}