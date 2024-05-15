precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

#define E 2.718281828459045
#define PI 3.14159265359

// from http://vis.computer.org/vis2004/DVD/infovis/papers/gossett.pdf 
vec3 ryb2rgb(vec3 c) {
    const vec3 white = vec3(1.);
    const vec3 red = vec3(1., 0., 0.);
    const vec3 yellow = vec3(1., 1., 0.);
    const vec3 blue = vec3(0.163, 0.373, 0.6);
    const vec3 violet = vec3(0.5, 0., 0.5);
    const vec3 green = vec3(0, 0.66, 0.2);
    const vec3 orange = vec3(1., 0.5, 0.);
    const vec3 black = vec3(0.2, 0.094, 0.);
    float r = c.x, y = c.y, b = c.z;
    if(c == vec3(0.))
        return white;
    if(c == vec3(0., 0., 1))
        return blue;
    if(c == vec3(0., 1., 0.))
        return yellow;
    if(c == vec3(0., 1., 1.))
        return green;
    if(c == vec3(1., 0., 0.))
        return red;
    if(c == vec3(1., 0., 1.))
        return violet;
    if(c == vec3(1., 1., 0.))
        return orange;
    if(c == vec3(1., 1., 1.))
        return black;
    float fW = (1. - r) * (1. - b) * (1. - y);
    float fR = r * (1. - b) * (1. - y);
    float fB = (1. - r) * b * (1. - y);
    float fV = r * b * (1. - y);
    float fY = (1. - r) * (1. - b) * y;
    float fO = r * (1. - b) * y;
    float fG = (1. - r) * b * y;
    float fBlack = r * b * y;
    return white * fW + red * fR + blue * fB + violet * fV + yellow * fY + orange * fO + green * fG + black * fBlack;
}

float normalDis(float x, float mean, float stddev) {
    float f1 = 1. / (stddev * sqrt(2. * PI));
    float index = -0.5 * pow(((x - mean) / stddev), 2.);
    return f1 * pow(E, index);
}

void main() {
    vec2 nc = gl_FragCoord.xy / u_resolution;
    vec3 res = vec3(0.);

    if(nc.y < 0.01) {

    } else if(nc.y < 0.2) {
        // 1: R
        float v = normalDis(nc.x, 0.2, 0.1);
        res = ryb2rgb(vec3(v, 0., 0.));
    } else if(nc.y < 0.21) {

    } else if(nc.y < 0.4) {
        // 2: Y
        float v = smoothstep(0.1, 0.5, nc.x) - smoothstep(0.5, 0.8, nc.x);
        res = ryb2rgb(vec3(0, v, 0));
    } else if(nc.y < 0.41) {

    } else if(nc.y < 0.6) {
        // 3: B
        float v = smoothstep(0.1, 0.3, nc.x) - smoothstep(0.7, 0.8, nc.x);
        res = ryb2rgb(vec3(0., 0., v));
    } else if(nc.y < 0.61) {

    } else if(nc.y < 0.8) {
        // 4
        float v1 = normalDis(nc.x, 0.2, 0.1);
        float v2 = smoothstep(0.1, 0.5, nc.x) - smoothstep(0.5, 0.8, nc.x);
        float v3 = smoothstep(0.1, 0.3, nc.x) - smoothstep(0.7, 0.8, nc.x);
        res = ryb2rgb(vec3(v2, v1, v3));
    } else if(nc.y < 0.81) {

    } else {
        //5 
        float v1 = 1. - smoothstep(0., 0.5, nc.x);
        float v2 = smoothstep(0., 0.5, nc.x) - smoothstep(0.5, 1., nc.x);
        float v3 = smoothstep(0.5, 1., nc.x);
        res = ryb2rgb(vec3(v1, v2, v3));
    }

    gl_FragColor = vec4(res, 1.);
}