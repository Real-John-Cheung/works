precision mediump float;

uniform vec2 u_resolution; // provided by glslCanvas
uniform vec2 u_mouse; // provided by glslCanvas

float quadraticBezier(float x, vec2 refP){
    float epsilon = 0.00001;
    refP.x = clamp(refP.x, 0.0, 1.0);
    refP.y = clamp(refP.y, 0.0, 1.0);
    if (refP.x == 0.5) refP+=epsilon;

    float om2Ref = 1.0 - 2.0 * refP.x;
    float t = (sqrt(refP.x*refP.x + om2Ref*x) - refP.x)/om2Ref;
    float y = (1.0 - 2.0*refP.y) * (t * t) + (2.0 * refP.y) * t;
    return y;
}

void main(){
    vec2 nc = gl_FragCoord.xy / u_resolution;
    vec2 nm = u_mouse/u_resolution;
    vec3 c = vec3(0.5);
    float v = quadraticBezier(nc.x, nm);
    if (abs(nc.y - v) < 0.001) c = vec3(0.0, 1.0, 0.0);
    if (distance(gl_FragCoord.xy, u_mouse) < 5.0) c = vec3(1.0,0.0,0.0);

    gl_FragColor = vec4(c, 1.0);
}