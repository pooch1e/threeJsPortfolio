import{S as i,U as n,C as o,V as t}from"./index-FcQRNp8M.js";var a=`varying vec3 vNormal;
varying vec3 vPosition;
uniform vec2 uResolution;

void main()
{
    
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    
    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

    
    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
    
}`,r=`uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec2 uResolution;
uniform vec3 uShadowColor;
uniform float uShadowRepetitions;

uniform float uLightRepetitions;
uniform vec3 uLightColor;

uniform float uAlpha;

vec3 ambientLight(vec3 lightColor, float lightIntensity) {
  return lightColor * lightIntensity;
}
vec3 specularLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower) {

  vec3 lightDirection = normalize(lightPosition);

  float shading = dot(normal, lightDirection);
  
  shading = clamp(shading, 0.0, 1.0);

  vec3 reflection = reflect(-lightDirection, normal);

  
  float specular = dot(reflection, viewDirection);
  specular = max(0.0, specular); 
  specular = pow(specular, specularPower); 

  return lightColor * lightIntensity * (shading + specular);

}
vec3 halftone(
    vec3 color,
    float repetitions,
    vec3 direction,
    float low,
    float high,
    vec3 pointColor,
    vec3 normal
)
{
    
  
  
  
  
  
  

    float intensity = dot(normal, direction);
    intensity = smoothstep(low, high, intensity);

    vec2 uv = gl_FragCoord.xy / uResolution.y;
    uv *= repetitions;
    uv = mod(uv, 1.0);

    float point = distance(uv, vec2(0.5));
    point = 1.0 - step(0.5 * intensity, point);

    
    return mix(color, pointColor, point);
}

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = uColor;

    
    vec3 light = vec3(0);

    
    light += ambientLight(
        vec3(1.0), 
        1.0        
    );

    
    light += specularLight(
        vec3(1.0, 1.0, 1.0), 
        1.0,                 
        normal,              
        vec3(1.0, 1.0, 0.0), 
        viewDirection,       
        1.0                  
    );

    color *= light;

    
    
    

    
    color = halftone(
        color,                 
        uShadowRepetitions,                  
        vec3(0.0, - 1.0, 0.0), 
        - 0.8,                 
        1.5,                   
        uShadowColor,   
        normal                 
    );

    
    color = halftone(
        color,               
        uLightRepetitions,   
        vec3(1.0, 1.0, 0.0), 
        0.5,                 
        1.5,                 
        uLightColor,         
        normal               
    );

    

    
    gl_FragColor = vec4(color, uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class h{constructor(e){this.world=e,this.scene=e.scene,this.debug=this.world.shaderExperience.debug,this.resources=this.world.resources,this.resource=this.resources.items.suzanneModel,this.sizes=this.world.shaderExperience.sizes,this.materialParameters={color:"#ff794d",shadowColor:"#8e19b8",lightColor:"#e5ffe0"},this.setModels(),this.setDebug()}setModels(){this.material=new i({vertexShader:a,fragmentShader:r,uniforms:{uColor:new n(new o(this.materialParameters.color)),uResolution:new n(new t(this.sizes.width*this.sizes.pixelRatio,this.sizes.height*this.sizes.pixelRatio)),uShadowRepetitions:new n(100),uShadowColor:new n(new o(this.materialParameters.shadowColor)),uLightRepetitions:new n(130),uLightColor:new n(new o(this.materialParameters.lightColor)),uAlpha:new n(1)}}),this.suzanneModel=this.resource.scene,this.suzanneModel.traverse(e=>{e.isMesh&&(e.material=this.material)}),this.scene.add(this.suzanneModel)}update(e){e&&this.suzanneModel&&(this.suzanneModel.rotation.x=e.elapsedTime*.002,this.suzanneModel.rotation.y=e.elapsedTime*.001)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Halftone UI"),this.debugFolder.addColor(this.materialParameters,"color").onChange(()=>{this.material.uniforms.uColor.value.set(this.materialParameters.color)}),this.debugFolder.add(this.material.uniforms.uShadowRepetitions,"value").min(1).max(100).step(1).name("repetitions"),this.debugFolder.addColor(this.materialParameters,"shadowColor").onChange(()=>{this.material.uniforms.uShadowColor.value.set(this.materialParameters.shadowColor)}),this.debugFolder.add(this.material.uniforms.uLightRepetitions,"value").min(1).max(300).step(1).name("repetitions"),this.debugFolder.addColor(this.materialParameters,"lightColor").onChange(()=>{this.material.uniforms.uLightColor.value.set(this.materialParameters.lightColor)}),this.debugFolder.add(this.material.uniforms.uAlpha,"value").min(0).max(1).step(.01).name("Alpha"))}destroy(){this.suzanneModel&&(this.scene.remove(this.suzanneModel),this.suzanneModel.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),e.material&&(e.material.map&&e.material.map.dispose(),e.material.normalMap&&e.material.normalMap.dispose(),e.material.dispose()))})),this.debugFolder&&this.debug.ui.destroy()}}export{h as default};
