#include ../../world/shaderTestWorld/shaders/includes/perlinClassic3D;

void main(){
    // plan is generate perlin noise, then sample it for rgb values
    
    
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

}