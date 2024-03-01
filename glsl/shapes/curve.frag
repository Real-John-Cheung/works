precision mediump float;


uniform vec2 u_resolution; // provided by glslCanvas
uniform vec2 u_mouse;// provided by glslCanvas

void main(){
    vec2 normalizedCoord = gl_FragCoord.xy / u_resolution;

    vec3 c = vec3(0.5);
    float v = pow(normalizedCoord.x, (u_mouse.x / u_resolution.x) * 5.0);
    if (abs(normalizedCoord.y - v) < 0.001) c = vec3(0.0,1.0,0.0); // if the pixel is close to the curve enough
    gl_FragColor = vec4(c, 1.0);
}