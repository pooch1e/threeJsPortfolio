
#include ../includes/simplexNoise4d.glsl

uniform float uTime;
uniform sampler2D uBase;
void main() {

  float time = uTime * 0.002;

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 particle = texture2D(uParticles, uv);
  vec4 base = texture2D(uBase, uv);
  
   // Dead
    if(particle.a >= 1.0)
    {
        particle.a = 0.0;
    }
    // Alive
    else
    {
  // Flow field
    vec3 flowField = vec3(
      simplexNoise4d(vec4(particle.xyz, time)), simplexNoise4d(vec4(particle.xyz, time)), simplexNoise4d(vec4(particle.xyz, time))
      );
    flowField = normalize(flowField);
    particle.xyz += flowField * 0.01;

    // Decay
    particle.a += 0.01;
    }
  gl_FragColor = particle;
}
