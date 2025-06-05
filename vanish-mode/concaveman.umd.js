(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.concaveman = factory());
})(this, (function () { 'use strict';

    function quickselect(arr, k, left, right, compare) {
        quickselectStep(arr, k, left || 0, right || (arr.length - 1), compare || defaultCompare$1);
    }

    function quickselectStep(arr, k, left, right, compare) {

        while (right > left) {
            if (right - left > 600) {
                var n = right - left + 1;
                var m = k - left + 1;
                var z = Math.log(n);
                var s = 0.5 * Math.exp(2 * z / 3);
                var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
                var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
                var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                quickselectStep(arr, k, newLeft, newRight, compare);
            }

            var t = arr[k];
            var i = left;
            var j = right;

            swap(arr, left, k);
            if (compare(arr[right], t) > 0) swap(arr, left, right);

            while (i < j) {
                swap(arr, i, j);
                i++;
                j--;
                while (compare(arr[i], t) < 0) i++;
                while (compare(arr[j], t) > 0) j--;
            }

            if (compare(arr[left], t) === 0) swap(arr, left, j);
            else {
                j++;
                swap(arr, j, right);
            }

            if (j <= k) left = j + 1;
            if (k <= j) right = j - 1;
        }
    }

    function swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    function defaultCompare$1(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    class RBush {
        constructor(maxEntries = 9) {
            // max entries in a node is 9 by default; min node fill is 40% for best performance
            this._maxEntries = Math.max(4, maxEntries);
            this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
            this.clear();
        }

        all() {
            return this._all(this.data, []);
        }

        search(bbox) {
            let node = this.data;
            const result = [];

            if (!intersects$1(bbox, node)) return result;

            const toBBox = this.toBBox;
            const nodesToSearch = [];

            while (node) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const childBBox = node.leaf ? toBBox(child) : child;

                    if (intersects$1(bbox, childBBox)) {
                        if (node.leaf) result.push(child);
                        else if (contains(bbox, childBBox)) this._all(child, result);
                        else nodesToSearch.push(child);
                    }
                }
                node = nodesToSearch.pop();
            }

            return result;
        }

        collides(bbox) {
            let node = this.data;

            if (!intersects$1(bbox, node)) return false;

            const nodesToSearch = [];
            while (node) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const childBBox = node.leaf ? this.toBBox(child) : child;

                    if (intersects$1(bbox, childBBox)) {
                        if (node.leaf || contains(bbox, childBBox)) return true;
                        nodesToSearch.push(child);
                    }
                }
                node = nodesToSearch.pop();
            }

            return false;
        }

        load(data) {
            if (!(data && data.length)) return this;

            if (data.length < this._minEntries) {
                for (let i = 0; i < data.length; i++) {
                    this.insert(data[i]);
                }
                return this;
            }

            // recursively build the tree with the given data from scratch using OMT algorithm
            let node = this._build(data.slice(), 0, data.length - 1, 0);

            if (!this.data.children.length) {
                // save as is if tree is empty
                this.data = node;

            } else if (this.data.height === node.height) {
                // split root if trees have the same height
                this._splitRoot(this.data, node);

            } else {
                if (this.data.height < node.height) {
                    // swap trees if inserted one is bigger
                    const tmpNode = this.data;
                    this.data = node;
                    node = tmpNode;
                }

                // insert the small tree into the large tree at appropriate level
                this._insert(node, this.data.height - node.height - 1, true);
            }

            return this;
        }

        insert(item) {
            if (item) this._insert(item, this.data.height - 1);
            return this;
        }

        clear() {
            this.data = createNode([]);
            return this;
        }

        remove(item, equalsFn) {
            if (!item) return this;

            let node = this.data;
            const bbox = this.toBBox(item);
            const path = [];
            const indexes = [];
            let i, parent, goingUp;

            // depth-first iterative tree traversal
            while (node || path.length) {

                if (!node) { // go up
                    node = path.pop();
                    parent = path[path.length - 1];
                    i = indexes.pop();
                    goingUp = true;
                }

                if (node.leaf) { // check current node
                    const index = findItem(item, node.children, equalsFn);

                    if (index !== -1) {
                        // item found, remove the item and condense tree upwards
                        node.children.splice(index, 1);
                        path.push(node);
                        this._condense(path);
                        return this;
                    }
                }

                if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
                    path.push(node);
                    indexes.push(i);
                    i = 0;
                    parent = node;
                    node = node.children[0];

                } else if (parent) { // go right
                    i++;
                    node = parent.children[i];
                    goingUp = false;

                } else node = null; // nothing found
            }

            return this;
        }

        toBBox(item) { return item; }

        compareMinX(a, b) { return a.minX - b.minX; }
        compareMinY(a, b) { return a.minY - b.minY; }

        toJSON() { return this.data; }

        fromJSON(data) {
            this.data = data;
            return this;
        }

        _all(node, result) {
            const nodesToSearch = [];
            while (node) {
                if (node.leaf) result.push(...node.children);
                else nodesToSearch.push(...node.children);

                node = nodesToSearch.pop();
            }
            return result;
        }

        _build(items, left, right, height) {

            const N = right - left + 1;
            let M = this._maxEntries;
            let node;

            if (N <= M) {
                // reached leaf level; return leaf
                node = createNode(items.slice(left, right + 1));
                calcBBox(node, this.toBBox);
                return node;
            }

            if (!height) {
                // target height of the bulk-loaded tree
                height = Math.ceil(Math.log(N) / Math.log(M));

                // target number of root entries to maximize storage utilization
                M = Math.ceil(N / Math.pow(M, height - 1));
            }

            node = createNode([]);
            node.leaf = false;
            node.height = height;

            // split the items into M mostly square tiles

            const N2 = Math.ceil(N / M);
            const N1 = N2 * Math.ceil(Math.sqrt(M));

            multiSelect(items, left, right, N1, this.compareMinX);

            for (let i = left; i <= right; i += N1) {

                const right2 = Math.min(i + N1 - 1, right);

                multiSelect(items, i, right2, N2, this.compareMinY);

                for (let j = i; j <= right2; j += N2) {

                    const right3 = Math.min(j + N2 - 1, right2);

                    // pack each entry recursively
                    node.children.push(this._build(items, j, right3, height - 1));
                }
            }

            calcBBox(node, this.toBBox);

            return node;
        }

        _chooseSubtree(bbox, node, level, path) {
            while (true) {
                path.push(node);

                if (node.leaf || path.length - 1 === level) break;

                let minArea = Infinity;
                let minEnlargement = Infinity;
                let targetNode;

                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    const area = bboxArea(child);
                    const enlargement = enlargedArea(bbox, child) - area;

                    // choose entry with the least area enlargement
                    if (enlargement < minEnlargement) {
                        minEnlargement = enlargement;
                        minArea = area < minArea ? area : minArea;
                        targetNode = child;

                    } else if (enlargement === minEnlargement) {
                        // otherwise choose one with the smallest area
                        if (area < minArea) {
                            minArea = area;
                            targetNode = child;
                        }
                    }
                }

                node = targetNode || node.children[0];
            }

            return node;
        }

        _insert(item, level, isNode) {
            const bbox = isNode ? item : this.toBBox(item);
            const insertPath = [];

            // find the best node for accommodating the item, saving all nodes along the path too
            const node = this._chooseSubtree(bbox, this.data, level, insertPath);

            // put the item into the node
            node.children.push(item);
            extend(node, bbox);

            // split on node overflow; propagate upwards if necessary
            while (level >= 0) {
                if (insertPath[level].children.length > this._maxEntries) {
                    this._split(insertPath, level);
                    level--;
                } else break;
            }

            // adjust bboxes along the insertion path
            this._adjustParentBBoxes(bbox, insertPath, level);
        }

        // split overflowed node into two
        _split(insertPath, level) {
            const node = insertPath[level];
            const M = node.children.length;
            const m = this._minEntries;

            this._chooseSplitAxis(node, m, M);

            const splitIndex = this._chooseSplitIndex(node, m, M);

            const newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
            newNode.height = node.height;
            newNode.leaf = node.leaf;

            calcBBox(node, this.toBBox);
            calcBBox(newNode, this.toBBox);

            if (level) insertPath[level - 1].children.push(newNode);
            else this._splitRoot(node, newNode);
        }

        _splitRoot(node, newNode) {
            // split root node
            this.data = createNode([node, newNode]);
            this.data.height = node.height + 1;
            this.data.leaf = false;
            calcBBox(this.data, this.toBBox);
        }

        _chooseSplitIndex(node, m, M) {
            let index;
            let minOverlap = Infinity;
            let minArea = Infinity;

            for (let i = m; i <= M - m; i++) {
                const bbox1 = distBBox(node, 0, i, this.toBBox);
                const bbox2 = distBBox(node, i, M, this.toBBox);

                const overlap = intersectionArea(bbox1, bbox2);
                const area = bboxArea(bbox1) + bboxArea(bbox2);

                // choose distribution with minimum overlap
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    index = i;

                    minArea = area < minArea ? area : minArea;

                } else if (overlap === minOverlap) {
                    // otherwise choose distribution with minimum area
                    if (area < minArea) {
                        minArea = area;
                        index = i;
                    }
                }
            }

            return index || M - m;
        }

        // sorts node children by the best axis for split
        _chooseSplitAxis(node, m, M) {
            const compareMinX = node.leaf ? this.compareMinX : compareNodeMinX;
            const compareMinY = node.leaf ? this.compareMinY : compareNodeMinY;
            const xMargin = this._allDistMargin(node, m, M, compareMinX);
            const yMargin = this._allDistMargin(node, m, M, compareMinY);

            // if total distributions margin value is minimal for x, sort by minX,
            // otherwise it's already sorted by minY
            if (xMargin < yMargin) node.children.sort(compareMinX);
        }

        // total margin of all possible split distributions where each node is at least m full
        _allDistMargin(node, m, M, compare) {
            node.children.sort(compare);

            const toBBox = this.toBBox;
            const leftBBox = distBBox(node, 0, m, toBBox);
            const rightBBox = distBBox(node, M - m, M, toBBox);
            let margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);

            for (let i = m; i < M - m; i++) {
                const child = node.children[i];
                extend(leftBBox, node.leaf ? toBBox(child) : child);
                margin += bboxMargin(leftBBox);
            }

            for (let i = M - m - 1; i >= m; i--) {
                const child = node.children[i];
                extend(rightBBox, node.leaf ? toBBox(child) : child);
                margin += bboxMargin(rightBBox);
            }

            return margin;
        }

        _adjustParentBBoxes(bbox, path, level) {
            // adjust bboxes along the given tree path
            for (let i = level; i >= 0; i--) {
                extend(path[i], bbox);
            }
        }

        _condense(path) {
            // go through the path, removing empty nodes and updating bboxes
            for (let i = path.length - 1, siblings; i >= 0; i--) {
                if (path[i].children.length === 0) {
                    if (i > 0) {
                        siblings = path[i - 1].children;
                        siblings.splice(siblings.indexOf(path[i]), 1);

                    } else this.clear();

                } else calcBBox(path[i], this.toBBox);
            }
        }
    }

    function findItem(item, items, equalsFn) {
        if (!equalsFn) return items.indexOf(item);

        for (let i = 0; i < items.length; i++) {
            if (equalsFn(item, items[i])) return i;
        }
        return -1;
    }

    // calculate node's bbox from bboxes of its children
    function calcBBox(node, toBBox) {
        distBBox(node, 0, node.children.length, toBBox, node);
    }

    // min bounding rectangle of node children from k to p-1
    function distBBox(node, k, p, toBBox, destNode) {
        if (!destNode) destNode = createNode(null);
        destNode.minX = Infinity;
        destNode.minY = Infinity;
        destNode.maxX = -Infinity;
        destNode.maxY = -Infinity;

        for (let i = k; i < p; i++) {
            const child = node.children[i];
            extend(destNode, node.leaf ? toBBox(child) : child);
        }

        return destNode;
    }

    function extend(a, b) {
        a.minX = Math.min(a.minX, b.minX);
        a.minY = Math.min(a.minY, b.minY);
        a.maxX = Math.max(a.maxX, b.maxX);
        a.maxY = Math.max(a.maxY, b.maxY);
        return a;
    }

    function compareNodeMinX(a, b) { return a.minX - b.minX; }
    function compareNodeMinY(a, b) { return a.minY - b.minY; }

    function bboxArea(a)   { return (a.maxX - a.minX) * (a.maxY - a.minY); }
    function bboxMargin(a) { return (a.maxX - a.minX) + (a.maxY - a.minY); }

    function enlargedArea(a, b) {
        return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) *
               (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
    }

    function intersectionArea(a, b) {
        const minX = Math.max(a.minX, b.minX);
        const minY = Math.max(a.minY, b.minY);
        const maxX = Math.min(a.maxX, b.maxX);
        const maxY = Math.min(a.maxY, b.maxY);

        return Math.max(0, maxX - minX) *
               Math.max(0, maxY - minY);
    }

    function contains(a, b) {
        return a.minX <= b.minX &&
               a.minY <= b.minY &&
               b.maxX <= a.maxX &&
               b.maxY <= a.maxY;
    }

    function intersects$1(a, b) {
        return b.minX <= a.maxX &&
               b.minY <= a.maxY &&
               b.maxX >= a.minX &&
               b.maxY >= a.minY;
    }

    function createNode(children) {
        return {
            children,
            height: 1,
            leaf: true,
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity
        };
    }

    // sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
    // combines selection algorithm with binary divide & conquer approach

    function multiSelect(arr, left, right, n, compare) {
        const stack = [left, right];

        while (stack.length) {
            right = stack.pop();
            left = stack.pop();

            if (right - left <= n) continue;

            const mid = left + Math.ceil((right - left) / n / 2) * n;
            quickselect(arr, mid, left, right, compare);

            stack.push(left, mid, mid, right);
        }
    }

    class TinyQueue {
        constructor(data = [], compare = defaultCompare) {
            this.data = data;
            this.length = this.data.length;
            this.compare = compare;

            if (this.length > 0) {
                for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
            }
        }

        push(item) {
            this.data.push(item);
            this.length++;
            this._up(this.length - 1);
        }

        pop() {
            if (this.length === 0) return undefined;

            const top = this.data[0];
            const bottom = this.data.pop();
            this.length--;

            if (this.length > 0) {
                this.data[0] = bottom;
                this._down(0);
            }

            return top;
        }

        peek() {
            return this.data[0];
        }

        _up(pos) {
            const {data, compare} = this;
            const item = data[pos];

            while (pos > 0) {
                const parent = (pos - 1) >> 1;
                const current = data[parent];
                if (compare(item, current) >= 0) break;
                data[pos] = current;
                pos = parent;
            }

            data[pos] = item;
        }

        _down(pos) {
            const {data, compare} = this;
            const halfLength = this.length >> 1;
            const item = data[pos];

            while (pos < halfLength) {
                let left = (pos << 1) + 1;
                let best = data[left];
                const right = left + 1;

                if (right < this.length && compare(data[right], best) < 0) {
                    left = right;
                    best = data[right];
                }
                if (compare(best, item) >= 0) break;

                data[pos] = best;
                pos = left;
            }

            data[pos] = item;
        }
    }

    function defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    var flat$1 = function pointInPolygonFlat (point, vs, start, end) {
        var x = point[0], y = point[1];
        var inside = false;
        if (start === undefined) start = 0;
        if (end === undefined) end = vs.length;
        var len = (end-start)/2;
        for (var i = 0, j = len - 1; i < len; j = i++) {
            var xi = vs[start+i*2+0], yi = vs[start+i*2+1];
            var xj = vs[start+j*2+0], yj = vs[start+j*2+1];
            var intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

    var nested$1 = function pointInPolygonNested (point, vs, start, end) {
        var x = point[0], y = point[1];
        var inside = false;
        if (start === undefined) start = 0;
        if (end === undefined) end = vs.length;
        var len = end - start;
        for (var i = 0, j = len - 1; i < len; j = i++) {
            var xi = vs[i+start][0], yi = vs[i+start][1];
            var xj = vs[j+start][0], yj = vs[j+start][1];
            var intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    var pointInPolygon = function pointInPolygon (point, vs, start, end) {
        if (vs.length > 0 && Array.isArray(vs[0])) {
            return nested$1(point, vs, start, end);
        } else {
            return flat$1(point, vs, start, end);
        }
    };
    var nested = nested$1;
    var flat = flat$1;
    pointInPolygon.nested = nested;
    pointInPolygon.flat = flat;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var orient2d_min = createCommonjsModule(function (module, exports) {
    !function(t,e){e(exports);}(commonjsGlobal,function(t){const e=134217729,n=33306690738754706e-32;function r(t,e,n,r,o){let f,i,u,c,s=e[0],a=r[0],d=0,l=0;a>s==a>-s?(f=s,s=e[++d]):(f=a,a=r[++l]);let p=0;if(d<t&&l<n)for(a>s==a>-s?(u=f-((i=s+f)-s),s=e[++d]):(u=f-((i=a+f)-a),a=r[++l]),f=i,0!==u&&(o[p++]=u);d<t&&l<n;)a>s==a>-s?(u=f-((i=f+s)-(c=i-f))+(s-c),s=e[++d]):(u=f-((i=f+a)-(c=i-f))+(a-c),a=r[++l]),f=i,0!==u&&(o[p++]=u);for(;d<t;)u=f-((i=f+s)-(c=i-f))+(s-c),s=e[++d],f=i,0!==u&&(o[p++]=u);for(;l<n;)u=f-((i=f+a)-(c=i-f))+(a-c),a=r[++l],f=i,0!==u&&(o[p++]=u);return 0===f&&0!==p||(o[p++]=f),p}function o(t){return new Float64Array(t)}const f=33306690738754716e-32,i=22204460492503146e-32,u=11093356479670487e-47,c=o(4),s=o(8),a=o(12),d=o(16),l=o(4);t.orient2d=function(t,o,p,b,y,h){const M=(o-h)*(p-y),x=(t-y)*(b-h),j=M-x;if(0===M||0===x||M>0!=x>0)return j;const m=Math.abs(M+x);return Math.abs(j)>=f*m?j:-function(t,o,f,p,b,y,h){let M,x,j,m,_,v,w,A,F,O,P,g,k,q,z,B,C,D;const E=t-b,G=f-b,H=o-y,I=p-y;_=(z=(A=E-(w=(v=e*E)-(v-E)))*(O=I-(F=(v=e*I)-(v-I)))-((q=E*I)-w*F-A*F-w*O))-(P=z-(C=(A=H-(w=(v=e*H)-(v-H)))*(O=G-(F=(v=e*G)-(v-G)))-((B=H*G)-w*F-A*F-w*O))),c[0]=z-(P+_)+(_-C),_=(k=q-((g=q+P)-(_=g-q))+(P-_))-(P=k-B),c[1]=k-(P+_)+(_-B),_=(D=g+P)-g,c[2]=g-(D-_)+(P-_),c[3]=D;let J=function(t,e){let n=e[0];for(let r=1;r<t;r++)n+=e[r];return n}(4,c),K=i*h;if(J>=K||-J>=K)return J;if(M=t-(E+(_=t-E))+(_-b),j=f-(G+(_=f-G))+(_-b),x=o-(H+(_=o-H))+(_-y),m=p-(I+(_=p-I))+(_-y),0===M&&0===x&&0===j&&0===m)return J;if(K=u*h+n*Math.abs(J),(J+=E*m+I*M-(H*j+G*x))>=K||-J>=K)return J;_=(z=(A=M-(w=(v=e*M)-(v-M)))*(O=I-(F=(v=e*I)-(v-I)))-((q=M*I)-w*F-A*F-w*O))-(P=z-(C=(A=x-(w=(v=e*x)-(v-x)))*(O=G-(F=(v=e*G)-(v-G)))-((B=x*G)-w*F-A*F-w*O))),l[0]=z-(P+_)+(_-C),_=(k=q-((g=q+P)-(_=g-q))+(P-_))-(P=k-B),l[1]=k-(P+_)+(_-B),_=(D=g+P)-g,l[2]=g-(D-_)+(P-_),l[3]=D;const L=r(4,c,4,l,s);_=(z=(A=E-(w=(v=e*E)-(v-E)))*(O=m-(F=(v=e*m)-(v-m)))-((q=E*m)-w*F-A*F-w*O))-(P=z-(C=(A=H-(w=(v=e*H)-(v-H)))*(O=j-(F=(v=e*j)-(v-j)))-((B=H*j)-w*F-A*F-w*O))),l[0]=z-(P+_)+(_-C),_=(k=q-((g=q+P)-(_=g-q))+(P-_))-(P=k-B),l[1]=k-(P+_)+(_-B),_=(D=g+P)-g,l[2]=g-(D-_)+(P-_),l[3]=D;const N=r(L,s,4,l,a);_=(z=(A=M-(w=(v=e*M)-(v-M)))*(O=m-(F=(v=e*m)-(v-m)))-((q=M*m)-w*F-A*F-w*O))-(P=z-(C=(A=x-(w=(v=e*x)-(v-x)))*(O=j-(F=(v=e*j)-(v-j)))-((B=x*j)-w*F-A*F-w*O))),l[0]=z-(P+_)+(_-C),_=(k=q-((g=q+P)-(_=g-q))+(P-_))-(P=k-B),l[1]=k-(P+_)+(_-B),_=(D=g+P)-g,l[2]=g-(D-_)+(P-_),l[3]=D;const Q=r(N,a,4,l,d);return d[Q-1]}(t,o,p,b,y,h,m)},t.orient2dfast=function(t,e,n,r,o,f){return (e-f)*(n-o)-(t-o)*(r-f)},Object.defineProperty(t,"__esModule",{value:true});});
    });

    unwrapExports(orient2d_min);

    var Queue = TinyQueue;

    var orient = orient2d_min.orient2d;

    // Fix for require issue in webpack https://github.com/mapbox/concaveman/issues/18
    if (Queue.default) {
        Queue = Queue.default;
    }

    var concaveman_1 = concaveman;
    var default_1 = concaveman;

    function concaveman(points, concavity, lengthThreshold) {
        // a relative measure of concavity; higher value means simpler hull
        concavity = Math.max(0, concavity === undefined ? 2 : concavity);

        // when a segment goes below this length threshold, it won't be drilled down further
        lengthThreshold = lengthThreshold || 0;

        // start with a convex hull of the points
        var hull = fastConvexHull(points);

        // index the points with an R-tree
        var tree = new RBush(16);
        tree.toBBox = function (a) {
            return {
                minX: a[0],
                minY: a[1],
                maxX: a[0],
                maxY: a[1]
            };
        };
        tree.compareMinX = function (a, b) { return a[0] - b[0]; };
        tree.compareMinY = function (a, b) { return a[1] - b[1]; };

        tree.load(points);

        // turn the convex hull into a linked list and populate the initial edge queue with the nodes
        var queue = [];
        for (var i = 0, last; i < hull.length; i++) {
            var p = hull[i];
            tree.remove(p);
            last = insertNode(p, last);
            queue.push(last);
        }

        // index the segments with an R-tree (for intersection checks)
        var segTree = new RBush(16);
        for (i = 0; i < queue.length; i++) segTree.insert(updateBBox(queue[i]));

        var sqConcavity = concavity * concavity;
        var sqLenThreshold = lengthThreshold * lengthThreshold;

        // process edges one by one
        while (queue.length) {
            var node = queue.shift();
            var a = node.p;
            var b = node.next.p;

            // skip the edge if it's already short enough
            var sqLen = getSqDist(a, b);
            if (sqLen < sqLenThreshold) continue;

            var maxSqLen = sqLen / sqConcavity;

            // find the best connection point for the current edge to flex inward to
            p = findCandidate(tree, node.prev.p, a, b, node.next.next.p, maxSqLen, segTree);

            // if we found a connection and it satisfies our concavity measure
            if (p && Math.min(getSqDist(p, a), getSqDist(p, b)) <= maxSqLen) {
                // connect the edge endpoints through this point and add 2 new edges to the queue
                queue.push(node);
                queue.push(insertNode(p, node));

                // update point and segment indexes
                tree.remove(p);
                segTree.remove(node);
                segTree.insert(updateBBox(node));
                segTree.insert(updateBBox(node.next));
            }
        }

        // convert the resulting hull linked list to an array of points
        node = last;
        var concave = [];
        do {
            concave.push(node.p);
            node = node.next;
        } while (node !== last);

        concave.push(node.p);

        return concave;
    }

    function findCandidate(tree, a, b, c, d, maxDist, segTree) {
        var queue = new Queue([], compareDist);
        var node = tree.data;

        // search through the point R-tree with a depth-first search using a priority queue
        // in the order of distance to the edge (b, c)
        while (node) {
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];

                var dist = node.leaf ? sqSegDist(child, b, c) : sqSegBoxDist(b, c, child);
                if (dist > maxDist) continue; // skip the node if it's farther than we ever need

                queue.push({
                    node: child,
                    dist: dist
                });
            }

            while (queue.length && !queue.peek().node.children) {
                var item = queue.pop();
                var p = item.node;

                // skip all points that are as close to adjacent edges (a,b) and (c,d),
                // and points that would introduce self-intersections when connected
                var d0 = sqSegDist(p, a, b);
                var d1 = sqSegDist(p, c, d);
                if (item.dist < d0 && item.dist < d1 &&
                    noIntersections(b, p, segTree) &&
                    noIntersections(c, p, segTree)) return p;
            }

            node = queue.pop();
            if (node) node = node.node;
        }

        return null;
    }

    function compareDist(a, b) {
        return a.dist - b.dist;
    }

    // square distance from a segment bounding box to the given one
    function sqSegBoxDist(a, b, bbox) {
        if (inside(a, bbox) || inside(b, bbox)) return 0;
        var d1 = sqSegSegDist(a[0], a[1], b[0], b[1], bbox.minX, bbox.minY, bbox.maxX, bbox.minY);
        if (d1 === 0) return 0;
        var d2 = sqSegSegDist(a[0], a[1], b[0], b[1], bbox.minX, bbox.minY, bbox.minX, bbox.maxY);
        if (d2 === 0) return 0;
        var d3 = sqSegSegDist(a[0], a[1], b[0], b[1], bbox.maxX, bbox.minY, bbox.maxX, bbox.maxY);
        if (d3 === 0) return 0;
        var d4 = sqSegSegDist(a[0], a[1], b[0], b[1], bbox.minX, bbox.maxY, bbox.maxX, bbox.maxY);
        if (d4 === 0) return 0;
        return Math.min(d1, d2, d3, d4);
    }

    function inside(a, bbox) {
        return a[0] >= bbox.minX &&
               a[0] <= bbox.maxX &&
               a[1] >= bbox.minY &&
               a[1] <= bbox.maxY;
    }

    // check if the edge (a,b) doesn't intersect any other edges
    function noIntersections(a, b, segTree) {
        var minX = Math.min(a[0], b[0]);
        var minY = Math.min(a[1], b[1]);
        var maxX = Math.max(a[0], b[0]);
        var maxY = Math.max(a[1], b[1]);

        var edges = segTree.search({minX: minX, minY: minY, maxX: maxX, maxY: maxY});
        for (var i = 0; i < edges.length; i++) {
            if (intersects(edges[i].p, edges[i].next.p, a, b)) return false;
        }
        return true;
    }

    function cross(p1, p2, p3) {
        return orient(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
    }

    // check if the edges (p1,q1) and (p2,q2) intersect
    function intersects(p1, q1, p2, q2) {
        return p1 !== q2 && q1 !== p2 &&
            cross(p1, q1, p2) > 0 !== cross(p1, q1, q2) > 0 &&
            cross(p2, q2, p1) > 0 !== cross(p2, q2, q1) > 0;
    }

    // update the bounding box of a node's edge
    function updateBBox(node) {
        var p1 = node.p;
        var p2 = node.next.p;
        node.minX = Math.min(p1[0], p2[0]);
        node.minY = Math.min(p1[1], p2[1]);
        node.maxX = Math.max(p1[0], p2[0]);
        node.maxY = Math.max(p1[1], p2[1]);
        return node;
    }

    // speed up convex hull by filtering out points inside quadrilateral formed by 4 extreme points
    function fastConvexHull(points) {
        var left = points[0];
        var top = points[0];
        var right = points[0];
        var bottom = points[0];

        // find the leftmost, rightmost, topmost and bottommost points
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (p[0] < left[0]) left = p;
            if (p[0] > right[0]) right = p;
            if (p[1] < top[1]) top = p;
            if (p[1] > bottom[1]) bottom = p;
        }

        // filter out points that are inside the resulting quadrilateral
        var cull = [left, top, right, bottom];
        var filtered = cull.slice();
        for (i = 0; i < points.length; i++) {
            if (!pointInPolygon(points[i], cull)) filtered.push(points[i]);
        }

        // get convex hull around the filtered points
        return convexHull(filtered);
    }

    // create a new node in a doubly linked list
    function insertNode(p, prev) {
        var node = {
            p: p,
            prev: null,
            next: null,
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0
        };

        if (!prev) {
            node.prev = node;
            node.next = node;

        } else {
            node.next = prev.next;
            node.prev = prev;
            prev.next.prev = node;
            prev.next = node;
        }
        return node;
    }

    // square distance between 2 points
    function getSqDist(p1, p2) {

        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1];

        return dx * dx + dy * dy;
    }

    // square distance from a point to a segment
    function sqSegDist(p, p1, p2) {

        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y;

        if (dx !== 0 || dy !== 0) {

            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2[0];
                y = p2[1];

            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p[0] - x;
        dy = p[1] - y;

        return dx * dx + dy * dy;
    }

    // segment to segment distance, ported from http://geomalgorithms.com/a07-_distance.html by Dan Sunday
    function sqSegSegDist(x0, y0, x1, y1, x2, y2, x3, y3) {
        var ux = x1 - x0;
        var uy = y1 - y0;
        var vx = x3 - x2;
        var vy = y3 - y2;
        var wx = x0 - x2;
        var wy = y0 - y2;
        var a = ux * ux + uy * uy;
        var b = ux * vx + uy * vy;
        var c = vx * vx + vy * vy;
        var d = ux * wx + uy * wy;
        var e = vx * wx + vy * wy;
        var D = a * c - b * b;

        var sc, sN, tc, tN;
        var sD = D;
        var tD = D;

        if (D === 0) {
            sN = 0;
            sD = 1;
            tN = e;
            tD = c;
        } else {
            sN = b * e - c * d;
            tN = a * e - b * d;
            if (sN < 0) {
                sN = 0;
                tN = e;
                tD = c;
            } else if (sN > sD) {
                sN = sD;
                tN = e + b;
                tD = c;
            }
        }

        if (tN < 0.0) {
            tN = 0.0;
            if (-d < 0.0) sN = 0.0;
            else if (-d > a) sN = sD;
            else {
                sN = -d;
                sD = a;
            }
        } else if (tN > tD) {
            tN = tD;
            if ((-d + b) < 0.0) sN = 0;
            else if (-d + b > a) sN = sD;
            else {
                sN = -d + b;
                sD = a;
            }
        }

        sc = sN === 0 ? 0 : sN / sD;
        tc = tN === 0 ? 0 : tN / tD;

        var cx = (1 - sc) * x0 + sc * x1;
        var cy = (1 - sc) * y0 + sc * y1;
        var cx2 = (1 - tc) * x2 + tc * x3;
        var cy2 = (1 - tc) * y2 + tc * y3;
        var dx = cx2 - cx;
        var dy = cy2 - cy;

        return dx * dx + dy * dy;
    }

    function compareByX(a, b) {
        return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
    }

    function convexHull(points) {
        points.sort(compareByX);

        var lower = [];
        for (var i = 0; i < points.length; i++) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
                lower.pop();
            }
            lower.push(points[i]);
        }

        var upper = [];
        for (var ii = points.length - 1; ii >= 0; ii--) {
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[ii]) <= 0) {
                upper.pop();
            }
            upper.push(points[ii]);
        }

        upper.pop();
        lower.pop();
        return lower.concat(upper);
    }
    concaveman_1.default = default_1;

    return concaveman_1;

}));
