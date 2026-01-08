
#include ../includes/simplexNoise4d.glsl

uniform float uTime;
void main() {

  float time = uTime * 0.002;

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 particle = texture2D(uParticles, uv);
  
  // Flow field
  vec3 flowField = vec3(
    simplexNoise4d(vec4(particle.xyz, time)), simplexNoise4d(vec4(particle.xyz, time)), simplexNoise4d(vec4(particle.xyz, time))
  );
  flowField = normalize(flowField);
  particle.xyz += flowField * 0.01;

  gl_FragColor = particle;
}
