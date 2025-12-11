vec3 directionalLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition) {

  vec3 lightDirection = normalize(lightPosition);

  float shading = dot(normal, lightDirection);
  // clamp shading so it cannot go below 0 (shadow)
  shading = clamp(shading, 0.0, 1.0);

  return lightColor * lightIntensity * shading; 
 
}