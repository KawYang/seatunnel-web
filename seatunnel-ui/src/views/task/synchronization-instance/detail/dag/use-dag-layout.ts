/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DagreLayout } from '@antv/layout'
import _ from 'lodash'
import { DagEdgeName, DagNodeName } from './dag-setting'

const updateParentNodePosition = (nodes: any, node: any) => {
  if (node.children && node.children.length) {
    const children = node.children
    const childNodes = nodes.filter((n: any) => children.includes(n.id));
    if (childNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    childNodes.forEach((child: any) => {
        const childX = child.x;
        const childY = child.y;
        const childWidth = child.size?.width || 180;
        const childHeight = child.size?.height || 44;

        minX = Math.min(minX, childX);
        minY = Math.min(minY, childY);
        maxX = Math.max(maxX, childX + childWidth);
        maxY = Math.max(maxY, childY + childHeight);
    });

    const padding = 40;

    node.x = minX - padding;
    node.y = minY - padding;
    node.size = {
      width: (maxX - minX) + (2 * padding),
      height: (maxY - minY) + (2 * padding)
    };
  }
}

const useDagLayout = (graph: any) => {
  const layoutConfig = {
    nodesep: 50,
    padding: 50,
    ranksep: 30
  }

  if (!graph) {
    return
  }

  graph.cleanSelection()

  const layoutFunc = new DagreLayout({
    type: 'dagre',
    rankdir: 'LR',
    align: 'UL',
    // Calculate the node spacing based on the edge label length
    ranksepFunc: (d) => {
      const edges = graph.getOutgoingEdges(d.id)
      let max = 0
      if (edges && edges.length > 0) {
        edges.forEach((edge: any) => {
          const edgeView = graph.findViewByCell(edge)
          const labelView = edgeView?.findAttr(
            'width',
            _.get(edgeView, ['labelSelectors', '0', 'body'], null)
          )
          const labelWidth = labelView ? +labelView : 0
          max = Math.max(max, labelWidth)
        })
      }
      return layoutConfig.ranksep + max
    },
    nodesep: layoutConfig.nodesep,
    controlPoints: true
  })

  const json = graph.toJSON()
  const groups = json.cells
    .filter((cell: any) => cell.shape === 'rect')
    .map((item: any) => {
      return {
        ...item,
        // sort by code aesc
        _index: -(item.id as string)
      }
    })
  const nodes = json.cells
    .filter((cell: any) => cell.shape === DagNodeName)
    .map((item: any) => {
      return {
        ...item,
        // sort by code aesc
        _index: -(item.id as string)
      }
    })
  const edges = json.cells.filter((cell: any) => cell.shape === DagEdgeName)

  const newModel: any = layoutFunc?.layout({
    nodes: [...nodes, ...groups],
    edges
  } as any)

  newModel.nodes.map((node: any) => updateParentNodePosition(nodes, node))
  graph.fromJSON(newModel)
}

export { useDagLayout }
