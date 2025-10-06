"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2, Sparkles, Github } from "lucide-react";
import { Streamdown } from "streamdown";
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
  onToggle,
  onDelete,
}: {
  todo: Todo;
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
    borderRadius: '14px',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onToggle(todo.id)}
      className={`group flex items-center gap-3 p-3 border bg-card hover:shadow-md transition-all duration-200 cursor-move ${todo.completed
        ? "border-green-500 hover:border-green-600"
        : "hover:border-primary/30"
        }`}
    >
      <div
        className={`flex-1 min-w-0 text-sm transition-all duration-200 break-words ${todo.completed ? "text-muted-foreground" : "text-card-foreground"
          }`}
      >
        <Streamdown>{todo.text}</Streamdown>
      </div>
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
  todos,
  onToggle,
  onDelete,
}: {
  id: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-1 flex flex-col">
      <div
        ref={setNodeRef}
        className={`overflow-y-auto space-y-2 border-2 border-dashed p-3 transition-colors ${isOver
          ? "border-primary/40 bg-primary/5"
          : "border-border"
          }`}
        style={{ borderRadius: '24px' }}
      >
        <SortableContext items={todos.map((todo) => todo.id)}>
          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-2">
              <Sparkles className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                No tasks yet
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const pasteCurrentUrl = async () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url && tab.id) {
        const url = tab.url;
        const prMatch = url.match(/\/pull\/(\d+)/);
        if (prMatch) {
          const prNumber = prMatch[1];
          try {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                const titleElement = document.querySelector('.js-issue-title.markdown-title');
                return titleElement?.textContent?.trim() || null;
              }
            });
            const title = result?.result;
            if (title) {
              setInputValue(`[PR #${prNumber}: ${title}](${url})`);
            } else {
              setInputValue(`[PR #${prNumber}](${url})`);
            }
          } catch (error) {
            setInputValue(`[PR #${prNumber}](${url})`);
          }
        } else {
          setInputValue(url);
        }
      }
    }
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
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

    const oldIndex = todos.findIndex((t) => t.id === activeId);
    const newIndex = todos.findIndex((t) => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      saveTodos(newTodos);
    }
  };

  const activeTodo = todos.find((todo) => todo.id === activeId);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="dark w-[500px] h-[500px] bg-background">
      <div className="h-full flex flex-col p-4">
        <Card className="flex-1 flex flex-col shadow-xl border-border">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-lg shadow-md">
                  <span className="text-sm font-bold text-primary-foreground">{totalCount}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Keep it simple as fuck
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={pasteCurrentUrl}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary"
              >
                <Github className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-[380px]">
                <Textarea
                  ref={textareaRef}
                  placeholder="What needs to be done?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && addTodo()}
                  className="pr-4 min-h-[44px] max-h-[120px] resize-none border-input focus-visible:ring-ring overflow-y-auto scrollbar-hide"
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
              <div className="flex-1 flex flex-col overflow-hidden">
                <DroppableSection
                  id="main-section"
                  todos={todos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              </div>

              <DragOverlay>
                {activeId && activeTodo ? (
                  <div className="flex items-center gap-3 p-3 border-input bg-card shadow-lg max-w-[460px]" style={{ borderRadius: '14px' }}>
                    <div className="flex-1 min-w-0 text-sm text-card-foreground break-words">
                      <Streamdown>{activeTodo.text}</Streamdown>
                    </div>
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
