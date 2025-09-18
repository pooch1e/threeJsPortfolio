export class Resizer {
  constructor(canvas, camera, renderer) {
    window.addEventListener('resize', () => {
      // Update sizes
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Update camera
      camera.aspect = canvas.width / canvas.height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(canvas.width, canvas.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}
