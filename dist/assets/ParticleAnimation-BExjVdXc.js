import{o as p,p as d,V as a,P as o,S as v,U as r,B as c,b as x,M as P,m as w,D as g}from"./index-FcQRNp8M.js";var y=`uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;

varying vec3 vColor;

attribute float aIntensity;
attribute float aAngles;

void main()
{

     
    float pictureIntensity = texture2D(uPictureTexture, uv).r;

    
    vec3 newPosition = position;
    float displacementIntensity = texture2D(uDisplacementTexture, uv).r; 
    
    displacementIntensity = smoothstep(0.1, 1.0, displacementIntensity); 

    vec3 displacementDirection = vec3(
        cos(aAngles) * 0.2,
        sin(aAngles) * 0.2,
        1.0
    );

    displacementDirection = normalize(displacementDirection);

    displacementDirection *= displacementIntensity;
    displacementDirection *= 3.0;
    displacementDirection *= aIntensity; 
    newPosition += displacementDirection;

    

    
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    
    gl_PointSize = 0.015 * pictureIntensity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    
    vColor = vec3(pow(pictureIntensity, 2.0));
}`,D=`varying vec3 vColor;

void main()
{

    
    vec2 uv = gl_PointCoord;
    float distanceToCenter = distance(uv, vec2(0.5));

    if(distanceToCenter > 0.5)
        discard;

    

    gl_FragColor = vec4(vColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}`;class C{constructor(t,e=null){this.world=t,this.scene=t.scene,this.resources=this.world.resources,this.canvas2D=e,this.ctx2D=e?e.getContext("2d"):null,this.mouse=this.world.shaderExperience.mouse,this.raycaster=new p,this.canvasTexture=new d(this.canvas2D),this.glowTexture=this.resources.items.glowTexture,this.imageTexture=this.resources.items.joelTypeTexture,this.displacementParams={screenCursor:new a(9999,9999),prevScreenCursor:new a(9999,9999),canvasWidth:128,canvasHeight:128},this.setup2DCanvas(),this.setParticles(),this.setInteractivePlane(),this.setupMouseEvents()}setup2DCanvas(){this.ctx2D&&(this.canvas2D.width=this.displacementParams.canvasWidth,this.canvas2D.height=this.displacementParams.canvasHeight,this.ctx2D.fillStyle="black",this.ctx2D.fillRect(0,0,this.canvas2D.width,this.canvas2D.height))}setupMouseEvents(){this.handleMouseMove=(t,e)=>{this.displacementParams.screenCursor.copy(t)},this.mouse.on("move",this.handleMouseMove)}setParticles(){this.particlesGeometry=new o(10,10,128,128),this.particlesGeometry.setIndex(null),this.particlesGeometry.deleteAttribute("normal"),this.particlesMaterial=new v({vertexShader:y,fragmentShader:D,uniforms:{uResolution:new r(new a(this.world.shaderExperience.sizes.width*this.world.shaderExperience.sizes.pixelRatio,this.world.shaderExperience.sizes.height*this.world.shaderExperience.sizes.pixelRatio)),uPictureTexture:new r(this.imageTexture),uDisplacementTexture:new r(this.canvasTexture)}});const t=new Float32Array(this.particlesGeometry.attributes.position.count),e=new Float32Array(this.particlesGeometry.attributes.position.count);for(let i=0;i<this.particlesGeometry.attributes.position.count;i++)t[i]=Math.random(),e[i]=Math.random()*Math.PI*2;this.particlesGeometry.setAttribute("aIntensity",new c(t,1)),this.particlesGeometry.setAttribute("aAngles",new c(e,1)),this.particles=new x(this.particlesGeometry,this.particlesMaterial),this.scene.add(this.particles)}setInteractivePlane(){this.interactivePlane=new P(new o(10,10),new w({color:"red",visible:!1,side:g})),this.scene.add(this.interactivePlane)}update(t){if(this.raycaster&&this.interactivePlane){const e=this.world.shaderExperience.camera.instance||this.world.shaderExperience.camera.perspectiveCamera;this.raycaster.setFromCamera(this.displacementParams.screenCursor,e);const i=this.raycaster.intersectObject(this.interactivePlane);if(i.length>0){const n=i[0];if(this.ctx2D&&n.uv){this.ctx2D.globalCompositeOperation="source-over",this.ctx2D.globalAlpha=.02,this.ctx2D.fillRect(0,0,this.canvas2D.width,this.canvas2D.height);const l=n.uv.x*this.canvas2D.width,h=(1-n.uv.y)*this.canvas2D.height,u=this.displacementParams.prevScreenCursor.distanceTo(this.displacementParams.screenCursor);this.displacementParams.prevScreenCursor.copy(this.displacementParams.screenCursor);const m=Math.min(u*10,1);this.ctx2D.globalCompositeOperation="lighten";const s=this.displacementParams.canvasWidth*.25;this.ctx2D.globalAlpha=m,this.ctx2D.drawImage(this.glowTexture.image,l-s/2,h-s/2,s,s),this.canvasTexture.needsUpdate=!0}}}}destroy(){this.mouse&&this.handleMouseMove&&this.mouse.off("move",this.handleMouseMove),this.particles&&this.scene.remove(this.particles),this.interactivePlane&&this.scene.remove(this.interactivePlane),this.particlesGeometry&&this.particlesGeometry.dispose(),this.interactivePlane?.geometry&&this.interactivePlane.geometry.dispose(),this.particlesMaterial&&this.particlesMaterial.dispose(),this.interactivePlane?.material&&this.interactivePlane.material.dispose(),this.canvasTexture&&this.canvasTexture.dispose(),this.ctx2D&&this.ctx2D.clearRect(0,0,this.canvas2D.width,this.canvas2D.height)}}export{C as default};
