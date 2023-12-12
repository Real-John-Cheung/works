/**
 * pink Noise based on https://gist.github.com/tom-merchant/5ced03a0638b06138ee7d11c0c209aa4 
 */
class PinkNoise {

    /**
     * 
     * @param {Object} opts 
     * @param {number} opts.seed seed for RNG
     * @param {number} opts.start positive int
     */
    constructor(opts){
        let seed = opts && opts.seed ? opts.seed : undefined;
        this.counter = opts && opts.start ? opts.start : 0;
        this.counter = this.counter % trailingZero.length;
        this.rand = new MiddleSquareRand(seed);
        this.octaveVals = new Array(9).fill(0);
        this.out = 0;
    }

    /**
     * return next pink noise value
     */
    next(){
        let octave = trailingZero[this.counter];

        this.out -= this.octaveVals[octave];
        this.octaveVals[octave] = this.rand.next() / (2147483647);
        this.octaveVals[octave] /= 10 - octave;
        this.out += this.octaveVals[octave];
        this.counter ++;
        this.counter = this.counter % trailingZero.length;

        return this.out;
    }
}

/**
 * https://gist.github.com/psema4/6c11e96a56a63e7c7e94ae3312a93fe7
 */
class MiddleSquareRand{
    constructor(seed){
        this.x = 0;
        this.w = 0;
        this.s = seed || 0x45ad4ece;
    }

    setSeed(seed){
        this.s = seed;
    }

    next(){
        this.x *= this.x;
        this.x += (this.w += this.s);
        this.x = (this.x >>> 16) | (this.x << 16);
        this.x = (this.x < 0) ? this.x * -1 : this.x;

        return this.x
    }
}

const trailingZero = [8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0];
