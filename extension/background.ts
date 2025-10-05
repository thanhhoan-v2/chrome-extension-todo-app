// Background service worker for Chrome extension

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// Update badge when todos change
function updateBadge() {
  chrome.storage.local.get(["todos"], (result) => {
    const todos: Todo[] = result.todos || [];
    const incompleteCount = todos.filter((todo) => !todo.completed).length;

    if (incompleteCount > 0) {
      chrome.action.setBadgeText({ text: incompleteCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1" }); // Indigo color
    } else {
      chrome.action.setBadgeText({ text: "" }); // Clear badge when no incomplete tasks
    }
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.todos) {
    updateBadge();
  }
});

// Update badge on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Initial badge update
updateBadge();
