precision mediump float;


uniform vec2 u_resolution; // provided by glslCanvas
uniform vec2 u_mouse; // provided by glslCanvas

void main(){
    vec2 normalizedCoord = gl_FragCoord.xy / u_resolution;

    float y = normalizedCoord.y;
    vec3 c = vec3(y);
    // if (normalizedCoord.x == normalizedCoord.y) c = vec3(0.0,1.0,0.0);
    // stroke weight of the line, controlled by mouse x position
    float thickness = (u_mouse.x / u_resolution.x);
    // adding blury edge to the line, ratio => how close is the pixels to line y = -x
    float ratio = smoothstep(thickness, 0.0, abs((1.0 - normalizedCoord.x) - normalizedCoord.y));
    c = (1.0 - ratio) * c + ratio * vec3(0.0,1.0,0.0);
    gl_FragColor = vec4(c, 1.0);
}