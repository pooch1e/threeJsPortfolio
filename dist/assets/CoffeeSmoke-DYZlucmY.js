import{P as n,R as t,S as i,U as s,D as o,M as r}from"./index-FcQRNp8M.js";var a=`varying vec2 vUv;

uniform float uTime;
uniform sampler2D uPerlinTexture;

vec2 rotate2D(vec2 value, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  mat2 m = mat2(c, s, -s, c);
  return m * value;
}

void main() {
  
  vUv = uv;

  vec3 newPosition = position;

  
  float twistPerlin = texture2D(uPerlinTexture, vec2(0.5, uv.y * 0.2 + uTime * 0.005)).r;
  float angle = twistPerlin * 10.0;
  newPosition.xz = rotate2D(newPosition.xz, angle);

  
  vec2 windOffset = vec2(
    texture2D(uPerlinTexture, vec2(0.25, uTime * 0.01)).r - 0.5,
    texture2D(uPerlinTexture, vec2(0.75, uTime * 0.01)).r - 0.5
  );
  windOffset *= pow(uv.y, 2.0) * 10.0;
  newPosition.xz += windOffset;

  

  
 gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

}`,m=`varying vec2 vUv;

uniform float uTime;
uniform sampler2D uPerlinTexture;

void main() {
  
  
  vec2 smokeUv = vUv;

  smokeUv.x *= 0.5;
  smokeUv.y *= 0.3;
  smokeUv.y -= uTime * 0.03;

  float smoke = texture(uPerlinTexture, smokeUv).r;

    
  smoke = smoothstep(0.4, 1.0, smoke);

  
    
  
  smoke *= smoothstep(0.0, 0.1, vUv.x);
  
  smoke *= smoothstep(1.0, 0.9, vUv.x);
  
  smoke *= smoothstep(0.0, 0.1, vUv.y);
  
  smoke *= smoothstep(1.0, 0.9, vUv.y);

  gl_FragColor = vec4(0.6, 0.3, 0.2, smoke);
  

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class h{constructor(e){this.world=e,this.scene=this.world.scene,this.debug=this.world.shaderExperience.debug,this.resources=this.world.resources,this.mousePos={x:0,y:0},this.resource=this.resources.items.coffeeSmokeModel,this.smokeTexture=this.resources.items.perlinNoisePng,this.setModel(),this.setSmoke(),this.setDebug()}setModel(){this.model=this.resource.scene;const e=this.model.getObjectByName("baked");e&&e.material&&e.material.map&&(e.material.map.anisotropy=8),this.scene.add(this.model)}setSmoke(){this.smokeGeometry=new n(1,1,16,64),this.smokeGeometry.translate(0,.5,0),this.smokeGeometry.scale(1.5,6,1.5),this.smokeTexture.wrapS=t,this.smokeTexture.wrapT=t,this.material=new i({wireframe:!1,vertexShader:a,fragmentShader:m,side:o,transparent:!0,depthWrite:!1,uniforms:{uPerlinTexture:new s(this.smokeTexture),uTime:new s(0),uMousePos:new s(this.mousePos)}}),this.smoke=new r(this.smokeGeometry,this.material),this.smoke.position.y=1.83,this.scene.add(this.smoke)}setDebug(){}update(e){e&&this.material&&(this.material.uniforms.uTime.value=e.elapsedTime*.02)}destroy(){this.model&&(this.scene.remove(this.model),this.model.traverse(e=>{e.isMesh&&(e.geometry?.dispose(),e.material&&(e.material.map&&e.material.map.dispose(),e.material.normalMap&&e.material.normalMap.dispose(),e.material.dispose()))})),this.smoke&&(this.scene.remove(this.smoke),this.smokeGeometry?.dispose(),this.material?.dispose(),this.smokeTexture?.dispose()),this.debugFolder&&this.debug.ui.destroy()}}export{h as default};
