precision mediump float;

//glslCanvas resolve Lygia dependency for you
#include "lygia/math/cubic.glsl"

uniform vec2 u_resolution;
void main(){
    vec2 nc = gl_FragCoord.xy / u_resolution;
    vec3 c = vec3(cubic(nc.x));
    if (abs(nc.y - c.x) < 0.001) c = vec3(0.0, 1.0,0.0);
    gl_FragColor = vec4(c,1.0);
}
