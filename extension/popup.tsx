"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2, Sparkles, Github, Download, Pencil, Check, X, Flag, Copy, ArrowLeft, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Priority = "low" | "medium" | "high";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  status: "all" | "done";
  createdAt: number;
  priority: Priority;
}

const priorityConfig = {
  low: { label: "Low", color: "border-blue-500", hoverColor: "hover:border-blue-600", order: 3 },
  medium: { label: "Medium", color: "border-yellow-500", hoverColor: "hover:border-yellow-600", order: 2 },
  high: { label: "High", color: "border-red-500", hoverColor: "hover:border-red-600", order: 1 },
};

function sortTodosByPriority(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    // Completed tasks go to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Sort by priority (high -> medium -> low)
    const priorityDiff = priorityConfig[a.priority].order - priorityConfig[b.priority].order;
    if (priorityDiff !== 0) return priorityDiff;
    // If same priority, maintain creation order (newer first)
    return b.createdAt - a.createdAt;
  });
}

function getRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function formatFullDate(timestamp: number): string {
  const date = new Date(timestamp);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${dayName}, ${month} ${day}`;
}

function SortableTodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onPriorityChange,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(todo.text);
  const editTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderRadius: '14px',
  };

  React.useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onEdit(todo.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(todo.text);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group flex items-center gap-2 p-3 border bg-card hover:shadow-md transition-all duration-200 border-primary/50"
      >
        <Textarea
          ref={editTextareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSaveEdit();
            } else if (e.key === "Escape") {
              handleCancelEdit();
            }
          }}
          className="flex-1 min-h-[32px] max-h-[120px] resize-none text-sm p-2 scrollbar-hide"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveEdit}
          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancelEdit}
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const getBorderColor = () => {
    if (todo.completed) return "border-green-500 hover:border-green-600";
    return `${priorityConfig[todo.priority].color} ${priorityConfig[todo.priority].hoverColor}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onToggle(todo.id)}
      className={`group flex items-center gap-3 p-3 border-2 bg-card hover:shadow-md transition-all duration-200 cursor-move ${getBorderColor()}`}
    >
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm transition-all duration-200 break-words ${todo.completed ? "text-muted-foreground" : "text-card-foreground"
            }`}
        >
          <Streamdown>{todo.text}</Streamdown>
        </div>
        <div className="text-xs text-muted-foreground/60 mt-1">
          {getRelativeDate(todo.createdAt)}, {formatFullDate(todo.createdAt)}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-accent pointer-events-auto"
          >
            <Flag className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPriorityChange(todo.id, "low");
            }}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Low
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPriorityChange(todo.id, "medium");
            }}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              Medium
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPriorityChange(todo.id, "high");
            }}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              High
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary pointer-events-auto"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive pointer-edges-auto"
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
  onEdit,
  onPriorityChange,
}: {
  id: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-1 flex flex-col">
      <div
        ref={setNodeRef}
        className={`overflow-y-auto scrollbar-hide space-y-2 transition-colors ${isOver
          ? "border-primary/40 bg-primary/5"
          : "border-border"
          }`}
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
                onEdit={onEdit}
                onPriorityChange={onPriorityChange}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

const availableCommands = [
  { name: "clear", description: "Clear all tasks" },
  { name: "markdown", description: "Export tasks to markdown" },
];

export default function TodoPopup() {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isExportView, setIsExportView] = React.useState(false);
  const [isCommandMode, setIsCommandMode] = React.useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = React.useState(0);
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
          // Migrate old todos to include status, createdAt, and priority fields
          const migratedTodos = result.todos.map((todo: Todo) => ({
            ...todo,
            status: todo.status || "all",
            createdAt: todo.createdAt || Date.now(),
            priority: todo.priority || "low",
          }));
          const sortedTodos = sortTodosByPriority(migratedTodos);
          setTodos(sortedTodos);
          // Save migrated todos back to storage
          chrome.storage.local.set({ todos: sortedTodos });
        }
      });
    }

    // Auto-focus input field when popup opens
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const saveTodos = (newTodos: Todo[]) => {
    const sortedTodos = sortTodosByPriority(newTodos);
    setTodos(sortedTodos);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ todos: sortedTodos });
    }
  };

  const executeCommand = (command: string) => {
    const cmd = command.toLowerCase();

    if (cmd === "clear") {
      saveTodos([]);
    } else if (cmd === "markdown" || cmd === "export") {
      setIsExportView(true);
    }

    setInputValue("");
    setIsCommandMode(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const addTodo = () => {
    if (inputValue.trim()) {
      // If in command mode, execute command instead
      if (isCommandMode) {
        executeCommand(inputValue.trim());
        return;
      }

      const text = inputValue.trim();

      const now = Date.now();

      // Detect priority from input
      let priority: Priority = "low";
      let cleanText = text;

      if (cleanText.includes("/high")) {
        priority = "high";
        cleanText = cleanText.replace(/\/high/g, "").trim();
      } else if (cleanText.includes("/medium")) {
        priority = "medium";
        cleanText = cleanText.replace(/\/medium/g, "").trim();
      } else if (cleanText.includes("/low")) {
        priority = "low";
        cleanText = cleanText.replace(/\/low/g, "").trim();
      }

      const newTodo: Todo = {
        id: now.toString(),
        text: cleanText,
        completed: false,
        status: "all",
        createdAt: now,
        priority: priority,
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

  const exportToMarkdown = async () => {
    const markdown = todos.map((todo) => `- ${todo.text}`).join("\n");

    try {
      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
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

  const editTodo = (id: string, newText: string) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, text: newText };
      }
      return todo;
    });
    saveTodos(newTodos);
  };

  const changePriority = (id: string, priority: Priority) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, priority };
      }
      return todo;
    });
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

  const generateMarkdown = () => {
    return todos.map((todo) => `- ${todo.text}`).join("\n");
  };

  const copyMarkdown = async () => {
    const markdown = generateMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  React.useEffect(() => {
    if (isExportView) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          setIsExportView(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    } else if (!isExportView && textareaRef.current) {
      // Auto-focus input when returning from markdown view
      textareaRef.current.focus();
    }
  }, [isExportView]);

  if (isExportView) {
    return (
      <div className="dark w-[500px] h-[500px] bg-background">
        <div className="h-full flex flex-col p-4">
          <Card className="flex-1 flex flex-col shadow-xl border-border">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExportView(false)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyMarkdown}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto scrollbar-hide">
              <pre className="text-xs text-card-foreground whitespace-pre-wrap font-mono">
                {generateMarkdown()}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dark w-[500px] h-[500px] bg-transparent">
      <div className="h-full flex flex-col p-4">
        <Card className="flex-1 flex flex-col shadow-xl border-border">
          <CardHeader className="space-y-2">
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportToMarkdown}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pasteCurrentUrl}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary"
                >
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center w-[420px] gap-2">
              <div className={`relative transition-all duration-200 ${isCommandMode ? "w-full" : "w-[380px]"}`}>
                <Textarea
                  ref={textareaRef}
                  placeholder={isCommandMode ? "Enter command..." : "What needs to be done?"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === ":") {
                      e.preventDefault();
                      setIsCommandMode(!isCommandMode);
                      setInputValue("");
                      setSelectedCommandIndex(0);
                      return;
                    }

                    if (e.key === "Escape" && isCommandMode) {
                      e.preventDefault();
                      setIsCommandMode(false);
                      setInputValue("");
                      setSelectedCommandIndex(0);
                      return;
                    }

                    if (isCommandMode && e.ctrlKey && e.key === "n") {
                      e.preventDefault();
                      const nextIndex = (selectedCommandIndex + 1) % availableCommands.length;
                      setSelectedCommandIndex(nextIndex);
                      setInputValue(availableCommands[nextIndex].name);
                      return;
                    }

                    if (isCommandMode && e.ctrlKey && e.key === "p") {
                      e.preventDefault();
                      const prevIndex = (selectedCommandIndex - 1 + availableCommands.length) % availableCommands.length;
                      setSelectedCommandIndex(prevIndex);
                      setInputValue(availableCommands[prevIndex].name);
                      return;
                    }

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (isCommandMode && !inputValue && availableCommands[selectedCommandIndex]) {
                        // If in command mode with no input, select the highlighted command
                        setInputValue(availableCommands[selectedCommandIndex].name);
                      } else {
                        // Execute the command or add todo
                        addTodo();
                      }
                    }
                  }}
                  className={`pr-4 min-h-[44px] max-h-[120px] resize-none border-2 bg-card/50 focus-visible:ring-2 overflow-y-auto scrollbar-hide transition-all duration-200 rounded-xl ${isCommandMode
                    ? "border-yellow-500 focus-visible:border-yellow-500 focus-visible:ring-yellow-500/20"
                    : "border-border focus-visible:border-primary focus-visible:ring-primary/20"
                    }`}
                />
                {isCommandMode && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-yellow-500/30 rounded-lg shadow-lg p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    {availableCommands.map((cmd, index) => (
                      <div
                        key={cmd.name}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                          index === selectedCommandIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => setInputValue(cmd.name)}
                      >
                        <span className="text-xs font-mono text-yellow-500">{cmd.name}</span>
                        <span className="text-xs text-muted-foreground">- {cmd.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!isCommandMode && (
                <Button
                  onClick={addTodo}
                  size="lg"
                  className="h-11 bg-primary hover:bg-primary/90 shadow-md rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              )}
            </div>
          </CardHeader>

          <div className="px-6 relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-[2px] bg-border" />
            <div className="relative bg-background px-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <CardContent className="flex-1 flex flex-col pb-4 transition-all duration-200">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex-1 flex flex-col overflow-hidden transition-all duration-200">
                <DroppableSection
                  id="main-section"
                  todos={todos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                  onPriorityChange={changePriority}
                />
              </div>

              <DragOverlay>
                {activeId && activeTodo ? (
                  <div className="flex items-center gap-3 p-3 border-input bg-card shadow-lg max-w-[460px]" style={{ borderRadius: '14px' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-card-foreground break-words">
                        <Streamdown>{activeTodo.text}</Streamdown>
                      </div>
                      <div className="text-xs text-muted-foreground/60 mt-1">
                        {getRelativeDate(activeTodo.createdAt)}, {formatFullDate(activeTodo.createdAt)}
                      </div>
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
