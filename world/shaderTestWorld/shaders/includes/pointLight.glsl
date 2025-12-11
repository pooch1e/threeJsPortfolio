vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower, vec3 position, float lightDecay) {

  
  vec3 lightDelta = lightPosition - position;
  vec3 lightDirection = normalize(lightDelta);
  float lightDistance = length(lightDelta);

  float shading = dot(normal, lightDirection);
  // clamp shading so it cannot go below 0 (shadow)
  shading = clamp(shading, 0.0, 1.0);

  vec3 reflection = reflect(-lightDirection, normal);

  // Specular
  float specular = dot(reflection, viewDirection);
  specular = max(0.0, specular); // clamps to avoid negative numbers
  specular = pow(specular, specularPower); // quite strong spec highlight

  float decay = 1.0 - lightDistance * lightDecay;
  decay = max(0.0, decay);
  return lightColor * lightIntensity * decay * (shading + specular);

}