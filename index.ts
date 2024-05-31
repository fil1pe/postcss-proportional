import { AtRule, ChildNode, Plugin, Processor, Rule } from 'postcss'

function round(mode: RoundingMode) {
  switch (mode) {
    case RoundingMode.Round:
      return Math.round
    case RoundingMode.Floor:
      return Math.floor
    case RoundingMode.Ceil:
      return Math.ceil
    default:
      return (value: number) => value
  }
}

function processProportionalRule(
  rule: Rule,
  rootNodes: ChildNode[],
  firstIndex: number,
  lastIndex: number
) {
  let scale = 1
  let roundingMode = RoundingMode.None
  for (const node of rule.nodes) {
    if (node.type === 'decl' && node.prop === 'scale')
      scale = Number(node.value)
    else if (node.type === 'decl' && node.prop === 'rounding')
      roundingMode = node.value as RoundingMode
  }

  if (scale !== 1 && !isNaN(scale)) {
    let skipNode = false
    for (let i = firstIndex; i < lastIndex; i++) {
      const node = rootNodes[i]

      if (node.type === 'rule' && !skipNode) {
        const nodeCloned = node.clone()

        let skip = false
        nodeCloned.nodes = nodeCloned.nodes.filter((node) => {
          if (node.type === 'decl' && !skip) {
            const value = node.value
            node.value = node.value.replaceAll(
              /((\d*\.)?\d+)px/g,
              (value) =>
                round(roundingMode)(Number(value.slice(0, -2)) * scale) + 'px'
            )
            if (node.value === value) return false
            return true
          } else if (
            node.type === 'comment' &&
            node.text.includes('@proportional-skip')
          )
            skip = true
          else skip = false
          return false
        })

        if (nodeCloned.nodes.length) rule.before(nodeCloned)
      } else if (
        node.type === 'comment' &&
        node.text.includes('@proportional-skip')
      )
        skipNode = true
      else skipNode = false
    }
  }

  rule.remove()
}

const plugin: () => Plugin | Processor = () => {
  return {
    postcssPlugin: 'postcss-proportional',

    Once(root, { AtRule }) {
      const rootNodes = [...root.nodes]

      const intervals: number[] = []

      let firstIndex = 0
      let firstIndexTmp = -1
      for (let i = 0; i < rootNodes.length; i++) {
        let node = rootNodes[i]
        if (node.type === 'atrule')
          node = node.nodes.findLast(
            ({ selector }: Rule) => selector === 'proportional'
          )

        if (node && node.type === 'rule' && node.selector === 'proportional') {
          if (firstIndexTmp !== -1) firstIndex = firstIndexTmp
          else firstIndexTmp = firstIndex

          const params =
            rootNodes[i].type === 'atrule' && (rootNodes[i] as AtRule).params

          for (const interval of intervals) {
            let nodeCloned = rootNodes[i].clone()
            rootNodes[i].before(nodeCloned)
            processProportionalRule(
              (nodeCloned.type === 'atrule'
                ? nodeCloned.nodes.findLast(
                    ({ selector }: Rule) => selector === 'proportional'
                  )
                : nodeCloned) as typeof node,
              rootNodes,
              firstIndex,
              interval
            )

            nodeCloned = node.clone()
            const atrule = rootNodes[interval] as AtRule
            const newAtrule = new AtRule({
              name: atrule.name,
              params: atrule.params + (params ? ` and ${params}` : ''),
            })
            newAtrule.append(nodeCloned)
            rootNodes[i].before(newAtrule)
            processProportionalRule(
              nodeCloned,
              atrule.nodes,
              0,
              atrule.nodes.length
            )
            firstIndex = interval + 1
          }

          processProportionalRule(node, rootNodes, firstIndex, i)
          if (
            rootNodes[i].type === 'atrule' &&
            !(rootNodes[i] as AtRule).nodes.length
          )
            rootNodes[i].remove()

          firstIndex = i + 1
          intervals.splice(0, intervals.length)
        } else if (
          rootNodes[i].type === 'atrule' &&
          (rootNodes[i] as AtRule).name === 'media'
        ) {
          firstIndexTmp = -1
          intervals.push(i)
        } else firstIndexTmp = -1
      }
    },
  }
}

module.exports = plugin

module.exports.postcss = true

enum RoundingMode {
  None = 'none',
  Round = 'round',
  Floor = 'floor',
  Ceil = 'ceil',
}
