import React, { useState, useRef, useEffect } from 'react';
import type { TreeNode as TreeNodeType, TreeContextType } from '../../types/tree';
import styles from './Tree.module.css';
import { ChevronDown, ChevronRight, Plus, Edit2, GripVertical, Trash2 } from 'lucide-react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

interface TreeNodeProps {
    node: TreeNodeType;
    depth: number;
    context: TreeContextType;
    parentId: string | null;
    isLast?: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, context, parentId}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(node.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: node.id, data: { type: 'node', node, parentId } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [isAdding, setIsAdding] = useState(false);
    const [newChildName, setNewChildName] = useState('');
    const newChildInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        if (isAdding && newChildInputRef.current) {
            newChildInputRef.current.focus();
        }
    }, [isAdding]);

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        context.toggleNode(node.id);
    };

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAdding(true);
        if (!node.isExpanded) {
            context.toggleNode(node.id);
        }
    };

    const submitAdd = () => {
        if (newChildName.trim()) {
            context.addNode(node.id, newChildName);
            setNewChildName('');
        }
        setIsAdding(false);
    };

    const handleAddKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') submitAdd();
        if (e.key === 'Escape') {
            setNewChildName('');
            setIsAdding(false);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        context.removeNode(node.id);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const submitEdit = () => {
        if (editName.trim()) {
            context.updateNodeName(node.id, editName);
        } else {
            setEditName(node.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') submitEdit();
        if (e.key === 'Escape') {
            setEditName(node.name);
            setIsEditing(false);
        }
    };

    const getLevelChar = (d: number) => {
        return String.fromCharCode(65 + (d % 26));
    };

    return (
        <div className={styles.nodeWrapper} ref={setNodeRef} style={style}>
            {depth > 0 && (
                <div className={styles.lineAcross}></div>
            )}



            <div className={styles.nodeContent} onClick={handleExpand}>
                <div {...attributes} {...listeners} className="mr-2 cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={16} />
                </div>

                <div className={styles.nodeHeader}>
                    <div className={clsx(styles.nodeIcon, {
                        [styles.levelB]: depth === 1,
                        [styles.levelC]: depth >= 2
                    })}>
                        {getLevelChar(depth)}
                    </div>

                    {isEditing ? (
                        <input
                            ref={inputRef}
                            className={styles.inputField}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={submitEdit}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={styles.nodeLabel}>{node.name}</span>
                    )}
                </div>

                <div className={styles.controls}>
                    {!isEditing && (
                        <button className={styles.iconButton} onClick={handleEdit} title="Edit">
                            <Edit2 size={14} />
                        </button>
                    )}
                    <button className={styles.iconButton} onClick={handleAdd} title="Add Child">
                        <Plus size={14} />
                    </button>
                    <button className={clsx(styles.iconButton, styles.delete)} onClick={handleRemove} title="Delete">
                        <Trash2 size={14} />
                    </button>
                    {(node.hasChildren || (node.children && node.children.length > 0) || isAdding) && (
                        <div className="ml-2">
                            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                    )}
                </div>
            </div>


            {(node.isExpanded || (isAdding && !node.isExpanded)) && (
                <div className={styles.treeNodeChildren}>
                    <div className={styles.lineDown}></div>


                    {node.children && (
                        <SortableContext items={node.children.map(n => n.id)} strategy={verticalListSortingStrategy}>
                            {node.children.map((child, index) => (
                                <TreeNode
                                    key={child.id}
                                    node={child}
                                    depth={depth + 1}
                                    context={context}
                                    parentId={node.id}
                                    isLast={index === (node.children?.length || 0) - 1 && !isAdding}
                                />
                            ))}
                        </SortableContext>
                    )}

                    {isAdding && (
                        <div className={styles.nodeWrapper}>
                            <div className={styles.lineAcross}></div>
                            <div className={styles.nodeContent} style={{ cursor: 'default' }}>
                                <div className={styles.nodeHeader}>
                                    <div className={clsx(styles.nodeIcon, {
                                        [styles.childLevel]: (depth + 1) > 0
                                    })}>
                                        {getLevelChar(depth + 1)}
                                    </div>
                                    <input
                                        ref={newChildInputRef}
                                        className={styles.inputField}
                                        placeholder="Enter node name..."
                                        value={newChildName}
                                        onChange={(e) => setNewChildName(e.target.value)}
                                        onBlur={submitAdd}
                                        onKeyDown={handleAddKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};
