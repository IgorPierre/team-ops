"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DropAnimation,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface KanbanContextProps<T> {
  columns: Record<string, T[]>;
  setColumns: (columns: Record<string, T[]>) => void;
  getItemId: (item: T) => string;
  columnIds: string[];
  activeId: UniqueIdentifier | null;
  findContainer: (id: UniqueIdentifier) => string | undefined;
  isColumn: (id: UniqueIdentifier) => boolean;
}

const KanbanContext = createContext<KanbanContextProps<unknown>>({
  columns: {},
  setColumns: () => {},
  getItemId: () => "",
  columnIds: [],
  activeId: null,
  findContainer: () => undefined,
  isColumn: () => false,
});

const ColumnContext = createContext<{
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
  disabled?: boolean;
}>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
});

const ItemContext = createContext<{
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
  disabled?: boolean;
}>({ listeners: undefined });

const IsOverlayContext = createContext(false);

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

const subscribeToNothing = () => () => {};
const getIsMounted = () => true;
const getIsMountedOnServer = () => false;

export interface KanbanCommitMeta<T> {
  kind: "item" | "column";
  previousValue: Record<string, T[]>;
  itemId?: UniqueIdentifier;
}

export interface KanbanRootProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, "onDragEnd"> {
  value: Record<string, T[]>;
  onValueChange: (value: Record<string, T[]>) => void;
  getItemValue: (item: T) => string;
  children: ReactNode;
  onValueCommit?: (value: Record<string, T[]>, meta: KanbanCommitMeta<T>) => void;
}

export function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  className,
  onValueCommit,
  ...props
}: KanbanRootProps<T>) {
  const columns = value;
  const setColumns = onValueChange;
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const valueRef = useRef(value);
  const getItemValueRef = useRef(getItemValue);
  useLayoutEffect(() => {
    valueRef.current = value;
    getItemValueRef.current = getItemValue;
  });
  const originRef = useRef<Record<string, T[]> | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnIds = useMemo(() => Object.keys(columns), [columns]);
  const isColumn = useCallback(
    (id: UniqueIdentifier) => columnIds.includes(id as string),
    [columnIds],
  );
  const findContainer = useCallback(
    (id: UniqueIdentifier) => {
      if (isColumn(id)) return id as string;
      return columnIds.find((key) =>
        columns[key]?.some((item) => getItemValue(item) === id),
      );
    },
    [columnIds, columns, getItemValue, isColumn],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    originRef.current = valueRef.current;
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || isColumn(active.id)) return;
      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);
      if (!activeContainer || !overContainer) return;

      if (activeContainer !== overContainer) {
        const activeItems = columns[activeContainer] ?? [];
        const overItems = columns[overContainer] ?? [];
        const activeIndex = activeItems.findIndex((item) => getItemValue(item) === active.id);
        let overIndex = overItems.findIndex((item) => getItemValue(item) === over.id);
        if (isColumn(over.id)) overIndex = overItems.length;
        const nextActive = [...activeItems];
        const nextOver = [...overItems];
        const [moved] = nextActive.splice(activeIndex, 1);
        nextOver.splice(overIndex, 0, moved);
        setColumns({ ...columns, [activeContainer]: nextActive, [overContainer]: nextOver });
        return;
      }
      const items = columns[activeContainer] ?? [];
      const activeIndex = items.findIndex((item) => getItemValue(item) === active.id);
      const overIndex = items.findIndex((item) => getItemValue(item) === over.id);
      if (activeIndex !== overIndex && overIndex !== -1) {
        setColumns({
          ...columns,
          [activeContainer]: arrayMove(items, activeIndex, overIndex),
        });
      }
    },
    [columns, findContainer, getItemValue, isColumn, setColumns],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      if (originRef.current && onValueCommit) {
        onValueCommit(valueRef.current, {
          kind: "item",
          previousValue: originRef.current,
          itemId: event.active.id,
        });
      }
      originRef.current = null;
    },
    [onValueCommit],
  );

  const contextValue = useMemo(
    () => ({
      columns,
      setColumns,
      getItemId: getItemValue,
      columnIds,
      activeId,
      findContainer,
      isColumn,
    }),
    [activeId, columnIds, columns, findContainer, getItemValue, isColumn, setColumns],
  );

  return (
    <KanbanContext.Provider value={contextValue as KanbanContextProps<unknown>}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          if (originRef.current) setColumns(originRef.current);
          originRef.current = null;
          setActiveId(null);
        }}
      >
        <div className={cn(className)} {...props}>
          {children}
        </div>
      </DndContext>
    </KanbanContext.Provider>
  );
}

export function KanbanBoard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { columnIds } = useContext(KanbanContext);
  return (
    <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </SortableContext>
  );
}

export function KanbanColumn({
  value,
  className,
  disabled,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }) {
  const isOverlay = useContext(IsOverlayContext);
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id: value,
    disabled: disabled || isOverlay,
  });
  const style = { transform: CSS.Transform.toString(transform), transition } as CSSProperties;
  return (
    <ColumnContext.Provider value={{ attributes, listeners, isDragging, disabled }}>
      <div
        ref={isOverlay ? undefined : setNodeRef}
        style={isOverlay ? undefined : style}
        className={cn(isDragging && !isOverlay && "opacity-40", className)}
        {...props}
      >
        {children}
      </div>
    </ColumnContext.Provider>
  );
}

export function KanbanColumnHandle({
  className,
  children,
  render,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  render?: (props: Record<string, unknown>) => ReactNode;
}) {
  const { attributes, listeners, disabled } = useContext(ColumnContext);
  const handleProps = { ...attributes, ...listeners, disabled };
  if (render) return render(handleProps);
  return (
    <div className={cn(className)} {...handleProps} {...props}>
      {children}
    </div>
  );
}

export function KanbanColumnContent({
  value,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { columns, getItemId } = useContext(KanbanContext);
  const items = (columns[value] ?? []).map(getItemId);
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </SortableContext>
  );
}

export function KanbanItem({
  value,
  className,
  disabled,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }) {
  const isOverlay = useContext(IsOverlayContext);
  const { setNodeRef, transform, transition, listeners, isDragging, attributes } = useSortable({
    id: value,
    disabled: disabled || isOverlay,
  });
  const style = { transform: CSS.Transform.toString(transform), transition } as CSSProperties;
  return (
    <ItemContext.Provider value={{ listeners, isDragging, disabled }}>
      <div
        ref={isOverlay ? undefined : setNodeRef}
        style={isOverlay ? undefined : style}
        className={cn(isDragging && !isOverlay && "opacity-40", className)}
        {...attributes}
        {...props}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export function KanbanItemHandle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { listeners, disabled } = useContext(ItemContext);
  return (
    <div className={cn(disabled ? "cursor-default" : "cursor-grab", className)} {...listeners} {...props}>
      {children}
    </div>
  );
}

export function KanbanOverlay({
  children,
  className,
}: {
  className?: string;
  children?:
    | ReactNode
    | ((params: { value: UniqueIdentifier; variant: "column" | "item" }) => ReactNode);
}) {
  const { activeId, isColumn } = useContext(KanbanContext);
  const mounted = useSyncExternalStore(subscribeToNothing, getIsMounted, getIsMountedOnServer);
  if (!mounted || !activeId) return null;
  const variant = isColumn(activeId) ? "column" : "item";
  const content =
    typeof children === "function" ? children({ value: activeId, variant }) : children;
  return createPortal(
    <DragOverlay dropAnimation={dropAnimationConfig} className={className}>
      <IsOverlayContext.Provider value={true}>{content}</IsOverlayContext.Provider>
    </DragOverlay>,
    document.body,
  );
}
