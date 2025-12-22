import{S as t,A as o,D as n,U as s,C as r,d as a,M as i,T as h}from"./index-FcQRNp8M.js";var l=`varying vec3 vPosition;
varying vec3 vNormal;
uniform float uTime;

float random2D(vec2 value)
{
    return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
void main() {

     
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    vNormal = modelNormal.xyz;

    
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    
    float glitchTime= uTime - modelPosition.y;
    float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) * sin(glitchTime * 8.74);
    glitchStrength /= 3.0;
    
    glitchStrength = smoothstep(0.2, 1.0, glitchStrength); 
    glitchStrength *= 0.25;

    modelPosition.x += (random2D(modelPosition.xz + uTime) - 0.5) * glitchStrength;
    modelPosition.z += (random2D(modelPosition.zx + uTime) - 0.5) * glitchStrength;

    
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    
    vPosition = modelPosition.xyz;
}`,m=`varying vec3 vPosition;
uniform float uTime;
varying vec3 vNormal;
uniform vec3 uColor;
void main()
{

  
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
        normal *= - 1.0;

    
    float stripes = mod((vPosition.y - uTime * 0.2) * 20.0, 1.0);
    stripes = pow(stripes, 3.0);

    

     
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);

    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;

    
    float falloff = smoothstep(0.8, 0.0, fresnel);

    holographic *= falloff;
    
  
    
    gl_FragColor = vec4(uColor, holographic);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class p{constructor(e){this.world=e,this.scene=this.world.scene,this.debug=this.world.shaderExperience.debug,this.resources=this.world.resources,this.paramaters={color:"#70c1ff"},this.material=new t({vertexShader:l,fragmentShader:m,transparent:!0,depthWrite:!1,uniforms:{uTime:new s(0),uColor:new s(new r(this.paramaters.color))},side:n,blending:o}),this.resource=this.resources.items.suzanneModel,this.setModels(),this.setDebug()}setModels(){this.setSphere(),this.setSuzanne(),this.setTorus()}setSphere(){this.sphereGeometry=new a(1),this.sphereMesh=new i(this.sphereGeometry,this.material),this.sphereMesh.position.x=1,this.sphereMesh.position.y=2,this.scene.add(this.sphereMesh)}setSuzanne(){this.suzanneModel=this.resource.scene,this.suzanneModel.traverse(e=>{e.isMesh&&(e.material=this.material)}),this.suzanneModel.position.y=2,this.scene.add(this.suzanneModel)}setTorus(){this.torusGeometry=new h(1),this.torusMesh=new i(this.torusGeometry,this.material),this.torusMesh.position.x=-2,this.torusMesh.position.y=2,this.scene.add(this.torusMesh)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Holograph UI"),this.debugFolder.addColor(this.paramaters,"color").onChange(()=>{this.material.uniforms.uColor.value.set(this.paramaters.color)}))}update(e){e&&this.material&&(this.sphereMesh.rotation.x=e.elapsedTime*.002,this.sphereMesh.rotation.y=e.elapsedTime*.001,this.suzanneModel.rotation.x=e.elapsedTime*.002,this.suzanneModel.rotation.y=e.elapsedTime*.001,this.torusMesh.rotation.x=e.elapsedTime*.002,this.torusMesh.rotation.y=e.elapsedTime*.001,this.material.uniforms.uTime.value=e.elapsedTime)}destroy(){this.suzanneModel&&(this.scene.remove(this.suzanneModel),this.suzanneModel.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),e.material&&(e.material.map&&e.material.map.dispose(),e.material.normalMap&&e.material.normalMap.dispose(),e.material.dispose()))})),this.sphereMesh&&(this.scene.remove(this.sphereMesh),this.sphereMesh.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),this.material?.dispose())})),this.torusMesh&&(this.scene.remove(this.torusMesh),this.torusMesh.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),this.material?.dispose())})),this.debugFolder&&this.debug.ui.destroy()}}export{p as default};
