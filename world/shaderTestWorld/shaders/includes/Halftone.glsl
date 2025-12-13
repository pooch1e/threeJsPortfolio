vec3 Halftone(vec3 color, float repititions, vec3 directions, float high, float low, float intensity, vec3 pointColor, vec3 normal) {
  // color = base color
  // repitions = repitions of uv
  // directions = direction of neighbours to calc norms
  // high, low = 
  // intensity =
  // pointColor = color of point inside uv grid
  // normal = direction vertex is facing

  float intensity = dot(normal, direction);
    intensity = smoothstep(low, high, intensity);

    vec2 uv = gl_FragCoord.xy / uResolution.y;
    uv *= repititions;
    uv = mod(uv, 1.0);

    float point = distance(uv, vec2(0.5));
    point = 1.0 - step(0.5 * intensity, point);

    return mix(color, pointColor, point);

  

}

