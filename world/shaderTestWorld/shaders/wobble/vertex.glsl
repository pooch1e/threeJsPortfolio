#include ../includes/simplexNoise4d.glsl
void main(){
  // Wobble 
  // Use vec 3 vertex (first 3) of simplex noise to calculate height of vertex, use the 4th value to calculate change over time
  float wobble = simplexNoise4d(vec4(
    csm_Position, // x, y, z
    0.0 // Time
  ));

  csm_Position += wobble * normal;
}