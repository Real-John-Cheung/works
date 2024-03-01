precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

vec3 rgb2hsb( in vec3 c ){
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
                 vec4(c.gb, K.xy),
                 step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
                 vec4(c.r, p.yzx),
                 step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                d / (q.x + e),
                q.x);
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

#define TWO_PI 6.28318530718

void main(){
    float start = mod(u_time * 5.0, TWO_PI);
    vec2 nc = gl_FragCoord.xy / u_resolution;
    vec2 delta = nc - vec2(0.5, 0.5);
    if (delta.x * delta.x + delta.y * delta.y > 0.25){
        gl_FragColor = vec4(0.0);
    } else {
        float sat = length(delta) * 4.0;
        float ang = atan(delta.y, delta.x);
        ang = ang - start + TWO_PI;
        ang = mod(ang, TWO_PI);
        float hue = ang / TWO_PI;
        vec3 hsbC = vec3(hue, sat, 1.0);
        gl_FragColor = vec4(hsb2rgb(hsbC),1.0);
    }
}