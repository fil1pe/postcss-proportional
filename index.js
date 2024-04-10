"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function proportionalRule(rule, rootNodes, firstIndex, lastIndex) {
    let scale = 1;
    for (const node of rule.nodes)
        if (node.type === 'decl' && node.prop === 'scale')
            scale = Number(node.value);
    if (scale !== 1 && !isNaN(scale)) {
        let skipNode = false;
        for (let i = firstIndex; i < lastIndex; i++) {
            const node = rootNodes[i];
            if (node.type === 'rule' && !skipNode) {
                const nodeCloned = node.clone();
                let skip = false;
                nodeCloned.nodes = nodeCloned.nodes.filter((node) => {
                    if (node.type === 'decl' && !skip) {
                        const value = node.value;
                        node.value = node.value.replaceAll(/((\d*\.)?\d+)px/g, (value) => Number(value.slice(0, -2)) * scale + 'px');
                        if (node.value === value)
                            return false;
                        return true;
                    }
                    else if (node.type === 'comment' &&
                        node.text.includes('@proportional-skip'))
                        skip = true;
                    else
                        skip = false;
                    return false;
                });
                if (nodeCloned.nodes.length)
                    rule.before(nodeCloned);
            }
            else if (node.type === 'comment' &&
                node.text.includes('@proportional-skip'))
                skipNode = true;
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
            for (let i = 0; i < rootNodes.length; i++) {
                let node = rootNodes[i];
                if (node.type === 'atrule')
                    node = node.nodes.findLast(({ selector }) => selector === 'proportional');
                if (node && node.type === 'rule' && node.selector === 'proportional') {
                    const params = rootNodes[i].type === 'atrule' && rootNodes[i].params;
                    for (const interval of intervals) {
                        let nodeCloned = rootNodes[i].clone();
                        rootNodes[i].before(nodeCloned);
                        proportionalRule((nodeCloned.type === 'atrule'
                            ? nodeCloned.nodes.findLast(({ selector }) => selector === 'proportional')
                            : nodeCloned), rootNodes, firstIndex, interval);
                        nodeCloned = node.clone();
                        const atrule = rootNodes[interval];
                        const newAtrule = new AtRule({
                            name: atrule.name,
                            params: atrule.params + (params ? ` and ${params}` : ''),
                        });
                        newAtrule.append(nodeCloned);
                        rootNodes[i].before(newAtrule);
                        proportionalRule(nodeCloned, atrule.nodes, 0, atrule.nodes.length);
                        firstIndex = interval + 1;
                    }
                    proportionalRule(node, rootNodes, firstIndex, i);
                    if (rootNodes[i].type === 'atrule' &&
                        !rootNodes[i].nodes.length)
                        rootNodes[i].remove();
                    firstIndex = i + 1;
                    intervals.splice(0, intervals.length);
                }
                else if (rootNodes[i].type === 'atrule')
                    intervals.push(i);
            }
        },
    };
};
module.exports = plugin;
module.exports.postcss = true;
