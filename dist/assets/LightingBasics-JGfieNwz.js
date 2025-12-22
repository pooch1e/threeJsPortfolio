import{E as w,L as x,k as b,l as L,S as P,U as C,C as D,M as u,m as v,d as z,T,P as H,D as S,I as G}from"./index-FcQRNp8M.js";class F extends w{constructor(e,t={}){const i=t.font;if(i===void 0)super();else{const o=i.generateShapes(e,t.size);t.depth===void 0&&(t.depth=50),t.bevelThickness===void 0&&(t.bevelThickness=10),t.bevelSize===void 0&&(t.bevelSize=8),t.bevelEnabled===void 0&&(t.bevelEnabled=!1),super(o,t)}this.type="TextGeometry"}}class I extends x{constructor(e){super(e)}load(e,t,i,o){const a=this,r=new b(this.manager);r.setPath(this.path),r.setRequestHeader(this.requestHeader),r.setWithCredentials(this.withCredentials),r.load(e,function(h){const l=a.parse(JSON.parse(h));t&&t(l)},i,o)}parse(e){return new _(e)}}class _{constructor(e){this.isFont=!0,this.type="Font",this.data=e}generateShapes(e,t=100){const i=[],o=k(e,t,this.data);for(let a=0,r=o.length;a<r;a++)i.push(...o[a].toShapes());return i}}function k(c,e,t){const i=Array.from(c),o=e/t.resolution,a=(t.boundingBox.yMax-t.boundingBox.yMin+t.underlineThickness)*o,r=[];let h=0,l=0;for(let d=0;d<i.length;d++){const p=i[d];if(p===`
`)h=0,l-=a;else{const g=N(p,o,h,l,t);h+=g.offsetX,r.push(g.path)}}return r}function N(c,e,t,i,o){const a=o.glyphs[c]||o.glyphs["?"];if(!a){console.error('THREE.Font: character "'+c+'" does not exists in font family '+o.familyName+".");return}const r=new L;let h,l,d,p,g,m,f,y;if(a.o){const s=a._cachedOutline||(a._cachedOutline=a.o.split(" "));for(let n=0,M=s.length;n<M;)switch(s[n++]){case"m":h=s[n++]*e+t,l=s[n++]*e+i,r.moveTo(h,l);break;case"l":h=s[n++]*e+t,l=s[n++]*e+i,r.lineTo(h,l);break;case"q":d=s[n++]*e+t,p=s[n++]*e+i,g=s[n++]*e+t,m=s[n++]*e+i,r.quadraticCurveTo(g,m,d,p);break;case"b":d=s[n++]*e+t,p=s[n++]*e+i,g=s[n++]*e+t,m=s[n++]*e+i,f=s[n++]*e+t,y=s[n++]*e+i,r.bezierCurveTo(g,m,f,y,d,p);break}}return{offsetX:a.ha*e,path:r}}var B=`varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    

    
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    
    vNormal = modelNormal.xyz;
    vPosition = modelPosition.xyz;
}`,E=`uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vPosition;

vec3 ambientLight(vec3 lightColor, float lightIntensity) {
  return lightColor * lightIntensity;
}
vec3 directionalLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition) {

  vec3 lightDirection = normalize(lightPosition);

  float shading = dot(normal, lightDirection);
  
  shading = clamp(shading, 0.0, 1.0);

  return lightColor * lightIntensity * shading; 
 
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
vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower, vec3 position, float lightDecay) {

  
  vec3 lightDelta = lightPosition - position;
  vec3 lightDirection = normalize(lightDelta);
  float lightDistance = length(lightDelta);

  float shading = dot(normal, lightDirection);
  
  shading = clamp(shading, 0.0, 1.0);

  vec3 reflection = reflect(-lightDirection, normal);

  
  float specular = dot(reflection, viewDirection);
  specular = max(0.0, specular); 
  specular = pow(specular, specularPower); 

  float decay = 1.0 - lightDistance * lightDecay;
  decay = max(0.0, decay);
  return lightColor * lightIntensity * decay * (shading + specular);

}
void main() {
  vec3 normal = normalize(vNormal);
  vec3 color = uColor;
  
  vec3 viewDirection = normalize(cameraPosition - vPosition);

 
vec3 light = vec3(0);

 

light += pointLight(
        vec3(1.0, 0.1, 0.1), 
        1.0,                 
        normal,              
        vec3(0.0, 2.5, 0.0), 
        viewDirection,       
        20.0,                 
        vPosition,
        0.25 
 );

 color *= light;

    
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class j{constructor(e){this.world=e,this.scene=this.world.scene,this.debug=this.world.shaderExperience.debug,this.resources=this.world.resources,this.materialConfig={color:"#ffffff"},this.material=new P({vertexShader:B,fragmentShader:E,uniforms:{uColor:new C(new D(this.materialConfig.color))}}),this.resource=this.resources.items.suzanneModel,this.setModels(),this.setDebug(),this.setText()}setModels(){this.setSphere(),this.setSuzanne(),this.setTorus(),this.setLightHelper()}async setText(){const e=new I;let t;try{t=await e.loadAsync("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json")}catch(o){console.error("Failed to load font:",o);return}const i=new F("See source code for more light shader options!",{font:t,size:.2,depth:.2,curveSegments:12});i.center(),this.textMesh=new u(i,new v),this.textMesh.position.y=1.5,this.scene.add(this.textMesh)}setSphere(){this.sphereGeometry=new z(1),this.sphereMesh=new u(this.sphereGeometry,this.material),this.sphereMesh.position.x=4,this.scene.add(this.sphereMesh)}setSuzanne(){this.suzanneModel=this.resource.scene,this.suzanneModel.traverse(e=>{e.isMesh&&(e.material=this.material)}),this.scene.add(this.suzanneModel)}setTorus(){this.torusGeometry=new T(1),this.torusMesh=new u(this.torusGeometry,this.material),this.torusMesh.position.x=-4,this.scene.add(this.torusMesh)}setLightHelper(){this.directionalLightHelper=new u(new H,new v),this.directionalLightHelper.material.color.setRGB(.1,.1,1),this.directionalLightHelper.material.side=S,this.directionalLightHelper.position.set(0,0,3),this.pointLightHelper=new u(new G(.1,2),new v),this.pointLightHelper.material.color.setRGB(1,.1,.1),this.pointLightHelper.position.set(0,2.5,0),this.scene.add(this.pointLightHelper),this.scene.add(this.directionalLightHelper)}setDebug(){this.debug.active&&(this.debugFolder=this.debug.ui.addFolder("Lighting Basics"),this.debugFolder.addColor(this.materialConfig,"color").onChange(()=>{this.material.uniforms.uColor.value.set(this.materialConfig.color)}))}destroy(){this.suzanneModel&&(this.scene.remove(this.suzanneModel),this.suzanneModel.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),e.material&&(e.material.map&&e.material.map.dispose(),e.material.normalMap&&e.material.normalMap.dispose(),e.material.dispose()))})),this.sphereMesh&&(this.scene.remove(this.sphereMesh),this.sphereMesh.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),this.material?.dispose())})),this.torusMesh&&(this.scene.remove(this.torusMesh),this.torusMesh.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),this.material?.dispose())})),this.directionalLightHelper&&(this.scene.remove(this.directionalLightHelper),this.directionalLightHelper.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),this.material?.dispose())}),this.pointLightHelper&&(this.scene.remove(this.pointLightHelper),this.pointLightHelper.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),this.material?.dispose())}))),this.textMesh&&(this.scene.remove(this.textMesh),this.textMesh.geometry?.dispose()),this.debugFolder&&this.debug.ui.destroy()}update(e){e&&this.material&&(this.suzanneModel&&(this.suzanneModel.rotation.x=e.elapsedTime*.001,this.suzanneModel.rotation.y=e.elapsedTime*.002),this.sphereMesh.rotation.x=e.elapsedTime*.001,this.sphereMesh.rotation.y=e.elapsedTime*.002,this.torusMesh.rotation.x=e.elapsedTime*.001,this.torusMesh.rotation.y=e.elapsedTime*.002)}}export{j as default};
