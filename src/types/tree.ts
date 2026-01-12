export interface TreeNode {
    id: string;
    name: string;
    children?: TreeNode[];
    hasChildren?: boolean; // For lazy loading indicator or leaf status
    isExpanded?: boolean;
}

export interface TreeContextType {
    nodes: TreeNode[];
    addNode: (parentId: string | null, name: string) => void;
    removeNode: (id: string) => void;
    updateNodeName: (id: string, newName: string) => void;
    toggleNode: (id: string) => void;
    moveNode: (activeId: string, overId: string) => void;
}
