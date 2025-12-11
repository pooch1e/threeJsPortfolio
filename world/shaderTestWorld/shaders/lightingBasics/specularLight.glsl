vec3 specularLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower) {

  vec3 lightDirection = normalize(lightPosition);

  float shading = dot(normal, lightDirection);
  // clamp shading so it cannot go below 0 (shadow)
  shading = clamp(shading, 0.0, 1.0);

  vec3 reflection = reflect(-lightDirection, normal);

  // Specular
  float specular = dot(reflection, viewDirection);
  specular = max(0.0, specular); // clamps to avoid negative numbers
  specular = pow(specular, specularPower); // quite strong spec highlight

  return lightColor * lightIntensity * (shading + specular);
 
}