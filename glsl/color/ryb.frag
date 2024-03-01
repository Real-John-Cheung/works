precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

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
    float start = 0.0;
    vec2 nc = gl_FragCoord.xy / u_resolution;
    vec2 delta = nc - vec2(0.5, 0.5);
    if (delta.x * delta.x + delta.y * delta.y > 0.25){
        gl_FragColor = vec4(0.0);
    } else {
        float sat = length(delta) * 4.0;
        float ang = atan(delta.y, delta.x);
        ang = ang - start + TWO_PI;
        ang = mod(ang, TWO_PI);
        float hue = 1.0 - pow(ang / TWO_PI, 1.6);
        vec3 hsbC = vec3(hue, sat, 1.0);
        gl_FragColor = vec4(hsb2rgb(hsbC),1.0);
    }
}