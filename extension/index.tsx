import React from "react";
import { createRoot } from "react-dom/client";
import TodoPopup from "./popup";
import "../app/globals.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<TodoPopup />);
}
