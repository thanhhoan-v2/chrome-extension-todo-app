"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, ListTodo, Sparkles } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  status: "all" | "done";
}

function SortableTodoItem({
  todo,
  orderIndex,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  orderIndex: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-move"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0 mt-0.5">
        {orderIndex}
      </div>
      <span
        className={`flex-1 min-w-0 text-sm transition-all duration-200 break-words ${todo.completed
          ? "text-muted-foreground line-through"
          : "text-card-foreground"
          }`}
      >
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive pointer-events-auto"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function DroppableSection({
  id,
  title,
  todos,
  onToggle,
  onDelete,
}: {
  id: string;
  title: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-1 flex flex-col min-h-[200px]">
      <h2 className="text-sm font-semibold mb-2 px-1 text-foreground/70">
        {title} ({todos.length})
      </h2>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 pr-1 rounded-lg border-2 border-dashed p-2 transition-colors ${isOver
          ? "border-primary/40 bg-primary/5"
          : "border-border"
          }`}
      >
        <SortableContext items={todos.map((todo) => todo.id)}>
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-2">
              <Sparkles className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                {id === "all-section" ? "No tasks in this section" : "No completed tasks"}
              </p>
            </div>
          ) : (
            todos.map((todo, index) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
                orderIndex={index + 1}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function TodoPopup() {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  React.useEffect(() => {
    // Load todos from Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["todos"], (result) => {
        if (result.todos) {
          // Migrate old todos to include status field
          const migratedTodos = result.todos.map((todo: Todo) => ({
            ...todo,
            status: todo.status || "all",
          }));
          setTodos(migratedTodos);
          // Save migrated todos back to storage
          chrome.storage.local.set({ todos: migratedTodos });
        }
      });
    }
  }, []);

  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ todos: newTodos });
    }
  };

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputValue,
        completed: false,
        status: "all",
      };
      saveTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        const newCompleted = !todo.completed;
        const newStatus: "all" | "done" = newCompleted ? "done" : "all";
        return { ...todo, completed: newCompleted, status: newStatus };
      }
      return todo;
    });
    saveTodos(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    saveTodos(newTodos);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTodo = todos.find((t) => t.id === activeId);
    const overTodo = todos.find((t) => t.id === overId);

    if (!activeTodo) return;

    // Case 1: Dropped on a section container
    if (overId === "all-section" || overId === "done-section") {
      const newStatus: "all" | "done" = overId === "all-section" ? "all" : "done";
      const newCompleted = newStatus === "done";

      if (activeTodo.status !== newStatus) {
        const newTodos = todos.map((todo) =>
          todo.id === activeId ? { ...todo, status: newStatus, completed: newCompleted } : todo
        );
        saveTodos(newTodos);
      }
      return;
    }

    // Case 2: Dropped on another todo item
    if (overTodo) {
      const activeStatus = activeTodo.status;
      const overStatus = overTodo.status;

      // Reordering within same section
      if (activeStatus === overStatus) {
        const sectionTodos = todos.filter((t) => t.status === activeStatus);
        const oldIndex = sectionTodos.findIndex((t) => t.id === activeId);
        const newIndex = sectionTodos.findIndex((t) => t.id === overId);

        if (oldIndex !== newIndex) {
          const reorderedSection = arrayMove(sectionTodos, oldIndex, newIndex);
          const otherTodos = todos.filter((t) => t.status !== activeStatus);
          const newTodos = [...otherTodos, ...reorderedSection];
          saveTodos(newTodos);
        }
      }
      // Moving to different section
      else {
        const newStatus = overStatus;
        const newCompleted = newStatus === "done";
        const newTodos = todos.map((todo) =>
          todo.id === activeId ? { ...todo, status: newStatus, completed: newCompleted } : todo
        );
        saveTodos(newTodos);
      }
    }
  };

  const allTodos = todos.filter((todo) => todo.status === "all");
  const doneTodos = todos.filter((todo) => todo.status === "done");
  const activeTodo = todos.find((todo) => todo.id === activeId);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="dark w-[500px] h-[700px] bg-background">
      <div className="h-full flex flex-col p-4">
        <Card className="flex-1 flex flex-col shadow-xl border-border">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary rounded-lg shadow-md">
                  <ListTodo className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    My Tasks
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Stay organized & productive
                  </p>
                </div>
              </div>
              {totalCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="What needs to be done?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTodo()}
                  className="pr-4 h-11 border-input focus-visible:ring-ring"
                />
              </div>
              <Button
                onClick={addTodo}
                size="lg"
                className="h-11 px-4 bg-primary hover:bg-primary/90 shadow-md"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pb-4">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <DroppableSection
                  id="all-section"
                  title="All"
                  todos={allTodos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
                <DroppableSection
                  id="done-section"
                  title="Done"
                  todos={doneTodos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              </div>

              <DragOverlay>
                {activeId && activeTodo ? (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card shadow-lg max-w-[460px]">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0 mt-0.5">
                      {(activeTodo.status === "all" ? allTodos : doneTodos).findIndex((t) => t.id === activeId) + 1}
                    </div>
                    {/* <Checkbox checked={activeTodo.completed} className="pointer-events-none flex-shrink-0 mt-0.5" /> */}
                    <span className="flex-1 min-w-0 text-sm text-card-foreground break-words">{activeTodo.text}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
