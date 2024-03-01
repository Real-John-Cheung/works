
precision mediump float;


uniform vec2 u_resolution; // provided by glslCanvas

void main(){
    //mapping the coordinate to 0.0 - 1.0, works better in glsl
    vec2 normalizedCoord = gl_FragCoord.xy / u_resolution;
    //in glsl, the origin is on the bottom left of the surface/canvas
    float y = normalizedCoord.y;
    vec3 c = vec3(y);
    //line y = x
    if (normalizedCoord.x == normalizedCoord.y) c = vec3(0.0,1.0,0.0);
    gl_FragColor = vec4(c, 1.0);
}