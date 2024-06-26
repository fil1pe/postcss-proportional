"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function round(mode) {
    switch (mode) {
        case RoundingMode.Round:
            return Math.round;
        case RoundingMode.Floor:
            return Math.floor;
        case RoundingMode.Ceil:
            return Math.ceil;
        default:
            return (value) => value;
    }
}
function processProportionalRule(rule, rootNodes, firstIndex, lastIndex, nodesToRemove) {
    let scale = 1;
    let roundingMode = RoundingMode.None;
    for (const node of rule.nodes) {
        if (node.type === 'decl' && node.prop === 'scale')
            scale = Number(node.value);
        else if (node.type === 'decl' && node.prop === 'rounding')
            roundingMode = node.value;
    }
    if (scale !== 1 && !isNaN(scale)) {
        let skipNode = false;
        for (let i = firstIndex; i < lastIndex; i++) {
            const node = rootNodes[i];
            if (node.type === 'rule' && skipNode !== true) {
                const nodeCloned = node.clone();
                let skip = false;
                let currRoundingMode = roundingMode;
                const nodeIndexesToRemove = [];
                nodeCloned.nodes = nodeCloned.nodes.filter((node, index) => {
                    if (node.type === 'decl' &&
                        node.prop === 'proportional' &&
                        node.value === 'skip') {
                        skip = true;
                        nodeIndexesToRemove.push(index);
                    }
                    else if (node.type === 'decl' &&
                        node.prop === 'proportional' &&
                        node.value === 'keep') {
                        skip = 'keep';
                        nodeIndexesToRemove.push(index);
                    }
                    else if (node.type === 'decl' &&
                        node.prop === 'proportional' &&
                        node.value.startsWith('rounding-')) {
                        currRoundingMode = node.value.slice(9);
                        nodeIndexesToRemove.push(index);
                    }
                    else if (node.type === 'decl' && skip !== true) {
                        const value = node.value;
                        node.value = node.value.replaceAll(/((\d*\.)?\d+)px/g, (value) => round(currRoundingMode)(Number(value.slice(0, -2)) * scale) +
                            'px');
                        let ret = true;
                        if (node.value === value && skip !== 'keep' && skipNode !== 'keep')
                            ret = false;
                        skip = false;
                        currRoundingMode = roundingMode;
                        return ret;
                    }
                    else if (node.type === 'comment' &&
                        node.text.includes('@proportional-skip'))
                        skip = true;
                    else if (node.type === 'comment' &&
                        node.text.includes('@proportional-keep'))
                        skip = 'keep';
                    else
                        skip = false;
                    return false;
                });
                nodeIndexesToRemove.forEach((index) => nodesToRemove.push(node.nodes[index]));
                if (nodeCloned.nodes.length)
                    rule.before(nodeCloned);
                skipNode = false;
            }
            else if (node.type === 'comment' &&
                node.text.includes('@proportional-skip'))
                skipNode = true;
            else if (node.type === 'comment' &&
                node.text.includes('@proportional-keep'))
                skipNode = 'keep';
            else
                skipNode = false;
        }
    }
    rule.remove();
}
const plugin = () => {
    return {
        postcssPlugin: 'postcss-proportional',
        Once(root, { AtRule }) {
            const rootNodes = [...root.nodes];
            const intervals = [];
            let firstIndex = 0;
            let firstIndexTmp = -1;
            const nodesToRemove = [];
            for (let i = 0; i < rootNodes.length; i++) {
                let node = rootNodes[i];
                if (node.type === 'atrule')
                    node = node.nodes.findLast(({ selector }) => selector === 'proportional');
                if (node && node.type === 'rule' && node.selector === 'proportional') {
                    if (firstIndexTmp !== -1)
                        firstIndex = firstIndexTmp;
                    else
                        firstIndexTmp = firstIndex;
                    const params = rootNodes[i].type === 'atrule' && rootNodes[i].params;
                    for (const interval of intervals) {
                        let nodeCloned = rootNodes[i].clone();
                        rootNodes[i].before(nodeCloned);
                        processProportionalRule((nodeCloned.type === 'atrule'
                            ? nodeCloned.nodes.findLast(({ selector }) => selector === 'proportional')
                            : nodeCloned), rootNodes, firstIndex, interval, nodesToRemove);
                        nodeCloned = node.clone();
                        const atrule = rootNodes[interval];
                        const newAtrule = new AtRule({
                            name: atrule.name,
                            params: atrule.params + (params ? ` and ${params}` : ''),
                        });
                        newAtrule.append(nodeCloned);
                        rootNodes[i].before(newAtrule);
                        processProportionalRule(nodeCloned, atrule.nodes, 0, atrule.nodes.length, nodesToRemove);
                        firstIndex = interval + 1;
                    }
                    processProportionalRule(node, rootNodes, firstIndex, i, nodesToRemove);
                    if (rootNodes[i].type === 'atrule' &&
                        !rootNodes[i].nodes.length)
                        rootNodes[i].remove();
                    firstIndex = i + 1;
                    intervals.splice(0, intervals.length);
                }
                else if (rootNodes[i].type === 'atrule' &&
                    rootNodes[i].name === 'media') {
                    firstIndexTmp = -1;
                    intervals.push(i);
                }
                else
                    firstIndexTmp = -1;
            }
            for (const node of nodesToRemove)
                node.remove();
        },
    };
};
module.exports = plugin;
module.exports.postcss = true;
var RoundingMode;
(function (RoundingMode) {
    RoundingMode["None"] = "none";
    RoundingMode["Round"] = "round";
    RoundingMode["Floor"] = "floor";
    RoundingMode["Ceil"] = "ceil";
})(RoundingMode || (RoundingMode = {}));
