import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TreeNode as TreeNodeComponent } from './TreeNode';
import styles from './Tree.module.css';
import type { TreeNode, TreeContextType } from '../../types/tree';

const MOCK_DATA: TreeNode[] = [
    {
        id: 'root-1',
        name: 'Level A',
        isExpanded: true,
        hasChildren: true,
        children: [
            {
                id: 'node-b-1',
                name: 'Level B',
                isExpanded: true,
                hasChildren: true,
                children: [
                    { id: 'node-c-1', name: 'Level C', hasChildren: false },
                    { id: 'node-c-2', name: 'Level C', hasChildren: false },
                ]
            },
            {
                id: 'node-b-2',
                name: 'Level B',
                hasChildren: false,
            }
        ]
    }
];

export const TreeView: React.FC = () => {
    const [nodes, setNodes] = useState<TreeNode[]>(MOCK_DATA);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeNode, setActiveNode] = useState<TreeNode | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Actions ---

    const findNode = (id: string, list: TreeNode[]): TreeNode | undefined => {
        for (const node of list) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(id, node.children);
                if (found) return found;
            }
        }
        return undefined;
    };

    const updateTree = (list: TreeNode[], id: string, updater: (node: TreeNode) => TreeNode): TreeNode[] => {
        return list.map(node => {
            if (node.id === id) return updater(node);
            if (node.children) {
                return { ...node, children: updateTree(node.children, id, updater) };
            }
            return node;
        });
    };

    const addNode = (parentId: string | null, name: string) => {
        const newNode: TreeNode = { id: uuidv4(), name, hasChildren: false };
        if (!parentId) {
            setNodes(prev => [...prev, newNode]);
            return;
        }
        setNodes(prev => updateTree(prev, parentId, (node) => ({
            ...node,
            isExpanded: true,
            hasChildren: true,
            children: [...(node.children || []), newNode]
        })));
    };

    const removeNodeRecursive = (list: TreeNode[], id: string): TreeNode[] => {
        return list.filter(node => node.id !== id).map(node => ({
            ...node,
            children: node.children ? removeNodeRecursive(node.children, id) : undefined
        }));
    };

    const removeNode = (id: string) => {
        setNodes(prev => removeNodeRecursive(prev, id));
    };

    const updateNodeName = (id: string, newName: string) => {
        setNodes(prev => updateTree(prev, id, node => ({ ...node, name: newName })));
    };

    const toggleNode = (id: string) => {
        setNodes(prev => updateTree(prev, id, node => {
            if (!node.isExpanded && !node.children && node.hasChildren) {

                return {
                    ...node,
                    isExpanded: true,
                    children: [{ id: uuidv4(), name: 'Loaded Node', hasChildren: false }]
                };
            }
            return { ...node, isExpanded: !node.isExpanded };
        }));
    };





    const moveNode = (activeId: string, overId: string) => {
        console.log('Moving', activeId, overId);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveNode(findNode(active.id as string, nodes) || null);
    };


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveNode(null);

        if (!over) return;
        if (active.id === over.id) return;

        const findParent = (nodesList: TreeNode[], id: string): { parent: TreeNode | null, items: TreeNode[], index: number } | null => {
            const index = nodesList.findIndex(n => n.id === id);
            if (index !== -1) return { parent: null, items: nodesList, index };

            for (const node of nodesList) {
                if (node.children) {
                    const res = findParent(node.children, id);
                    if (res) {
                        if (res.parent === null) {
                            return { ...res, parent: node };
                        }
                        return res;
                    }
                }
            }
            return null;
        };

        setNodes((prevNodes) => {
            const activeInfo = findParent(prevNodes, active.id as string);
            const overInfo = findParent(prevNodes, over.id as string);

            if (!activeInfo || !overInfo) return prevNodes;

            if (activeInfo.items === overInfo.items) {
              

                const newTree = JSON.parse(JSON.stringify(prevNodes));

                const activeRes = findParent(newTree, active.id as string);
                const overRes = findParent(newTree, over.id as string);

                if (activeRes && overRes && activeRes.items === overRes.items) {
                    activeRes.items.splice(activeRes.index, 1);
                    activeRes.items.splice(overRes.index, 0, activeInfo.items[activeInfo.index]);
                    return newTree;
                }
            }



            const newTree = JSON.parse(JSON.stringify(prevNodes));
            const activeRes = findParent(newTree, active.id as string);
            const overRes = findParent(newTree, over.id as string);

            if (activeRes && overRes) {
                const [movedItem] = activeRes.items.splice(activeRes.index, 1);
                overRes.items.splice(overRes.index, 0, movedItem);
                return newTree;
            }

            return prevNodes;
        });
    };

    const contextValue: TreeContextType = {
        nodes,
        addNode,
        removeNode,
        updateNodeName,
        toggleNode,
        moveNode
    };

    return (
        <div className={styles.treeContainer}>
            <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 'bold', color: '#333' }}>
                Visual Tree Editor
            </h2>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                //  onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                    {nodes.map((node, index) => (
                        <TreeNodeComponent
                            key={node.id}
                            node={node}
                            depth={0}
                            context={contextValue}
                            parentId={null}
                            isLast={index === nodes.length - 1}
                        />
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeId && activeNode ? (
                        <div className={styles.nodeContent} style={{ opacity: 0.8, background: '#fff' }}>
                            <span className={styles.nodeLabel}>{activeNode.name}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
