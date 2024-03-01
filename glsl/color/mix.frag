precision mediump float;
uniform float u_time;
void main(){
    vec3 c1 = vec3(0.149, 0.141, 0.912);
    vec3 c2 = vec3(1.0, 0.833, 0.224);

    vec3 c = mix(c1, c2, abs(sin(u_time)));
    gl_FragColor = vec4(c, 1.0);
}