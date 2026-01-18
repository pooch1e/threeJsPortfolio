#include ../includes/simplexNoise4d.glsl
attribute tangent vec4;

float getWobble(position) {
  return simplexNoise4d(vec4(
    position, //x, y, z
    0.0 // W
  ))
}

void main(){
  // Compute crossproduct
  vec3 biTangent = cross(normal, tangent.xyz);

  // Work out neighbours
  // Neighbour Pos
  float shift = 0.001;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  // Wobble 
  // Use vec 3 vertex (first 3) of simplex noise to calculate height of vertex, use the 4th value to calculate change over time
  float wobble = getWobble(csm_Position);

  csm_Position += wobble * normal;
}