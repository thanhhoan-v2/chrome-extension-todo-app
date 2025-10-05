"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, ListTodo, Sparkles } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function TodoPopup() {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    // Load todos from Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["todos"], (result) => {
        if (result.todos) {
          setTodos(result.todos);
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
      };
      saveTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    saveTodos(newTodos);
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="w-[420px] h-[600px] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="h-full flex flex-col p-4">
        <Card className="flex-1 flex flex-col shadow-xl border-indigo-100 dark:border-indigo-900">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                  <ListTodo className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    My Tasks
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Stay organized & productive
                  </p>
                </div>
              </div>
              {totalCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 rounded-full border border-indigo-200 dark:border-indigo-800">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col space-y-4 pb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="What needs to be done?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTodo()}
                  className="pr-4 h-11 border-indigo-200 focus-visible:ring-indigo-500 dark:border-indigo-800"
                />
              </div>
              <Button
                onClick={addTodo}
                size="lg"
                className="h-11 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {todos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    All clear!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    No tasks yet. Add your first task above to get started.
                  </p>
                </div>
              ) : (
                todos.map((todo, index) => (
                  <div
                    key={todo.id}
                    className="group flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-950 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="border-2 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-600 data-[state=checked]:border-transparent"
                    />
                    <span
                      className={`flex-1 text-sm transition-all duration-200 ${
                        todo.completed
                          ? "line-through text-muted-foreground"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {todo.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
