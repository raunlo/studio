'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';

interface Task {
  id: string;
  content: string;
}

export default function DndDemoPage() {
  const [todo, setTodo] = useState<Task[]>([]);
  const [done, setDone] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/dnd-demo')
      .then((res) => res.json())
      .then((data: { todo: Task[]; done: Task[] }) => {
        setTodo(data.todo);
        setDone(data.done);
      });
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId !== destination.droppableId) return; // block cross-list moves

    const list = source.droppableId === 'todo' ? Array.from(todo) : Array.from(done);
    const [moved] = list.splice(source.index, 1);
    list.splice(destination.index, 0, moved);

    if (source.droppableId === 'todo') {
      setTodo(list);
    } else {
      setDone(list);
    }
  };

  const renderList = (droppableId: 'todo' | 'done', items: Task[]) => (
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-muted p-4 rounded min-h-[120px] flex-1"
        >
          {items.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(prov) => (
                <div
                  ref={prov.innerRef}
                  {...prov.draggableProps}
                  {...prov.dragHandleProps}
                  className="mb-2 p-2 bg-card border rounded"
                >
                  {task.content}
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

