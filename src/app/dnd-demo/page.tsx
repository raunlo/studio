'use client';

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useChecklist } from '@/hooks/use-checklist';
import { ChecklistItem } from '@/components/shared/types';

export default function DndDemoPage() {
  const { items, reorderItem } = useChecklist(1);
  const todo = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.droppableId !== destination.droppableId) {
      return;
    }

    const from =
      source.droppableId === 'todo'
        ? source.index
        : todo.length + source.index;
    const to =
      destination.droppableId === 'todo'
        ? destination.index
        : todo.length + destination.index;

    await reorderItem(from, to);
  };

  const renderList = (
    droppableId: 'todo' | 'done',
    list: ChecklistItem[],
  ) => (
    <Droppable droppableId={droppableId} type={droppableId}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-muted p-4 rounded min-h-[120px] flex-1"
        >
          {list.map((task, index) => (
            <Draggable
              key={String(task.id ?? index)}
              draggableId={String(task.id ?? `temp-${index}`)}
              index={index}
            >
              {(prov) => (
                <div
                  ref={prov.innerRef}
                  {...prov.draggableProps}
                  {...prov.dragHandleProps}
                  className="mb-2 p-2 bg-card border rounded"
                >
                  {task.name}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Drag & Drop Demo</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4">
          {renderList('todo', todo)}
          {renderList('done', done)}
        </div>
      </DragDropContext>
    </div>
  );
}

