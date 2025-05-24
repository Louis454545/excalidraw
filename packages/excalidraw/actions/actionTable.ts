import { register } from "./register";
import type { Action } from "./types";
import { newTableElement } from "@excalidraw/element";
import { viewportCoordsToSceneCoords } from "../utils";
import { DEFAULT_ELEMENT_PROPS } from "@excalidraw/common";

const tableIcon = (
  <svg viewBox="0 0 16 16" width="16" height="16">
    <path
      d="M1 1h14v14h-14z M1 5h14 M1 9h14 M1 13h14 M5 1v14 M9 1v14 M13 1v14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

export const actionTable: Action = register({
  name: "table",
  label: "toolBar.table", // Assuming i18n key
  icon: tableIcon,
  trackEvent: { category: "toolbar" },
  perform: (elements, appState, formData, app) => {
    const dimensionsString = window.prompt(
      "Enter table dimensions (rows,columns):",
      "3,3",
    );
    if (!dimensionsString) {
      return false; // User cancelled
    }

    const parts = dimensionsString.split(",");
    let rows = parseInt(parts[0], 10);
    let columns = parseInt(parts[1], 10);

    if (isNaN(rows) || rows <= 0) {
      rows = 3;
    }
    if (isNaN(columns) || columns <= 0) {
      columns = 3;
    }

    // Default size for a new table, can be adjusted
    const tableWidth = columns * 100; // 100px per column
    const tableHeight = rows * 40; // 40px per row

    const { x, y } = مرکزViewportCoordsToSceneCoords(appState, app);

    const tableElement = newTableElement({
      x: x - tableWidth / 2,
      y: y - tableHeight / 2,
      width: tableWidth,
      height: tableHeight,
      rows,
      columns,
      strokeColor: appState.currentItemStrokeColor,
      backgroundColor: appState.currentItemBackgroundColor,
      fillStyle: appState.currentItemFillStyle,
      strokeWidth: appState.currentItemStrokeWidth,
      strokeStyle: appState.currentItemStrokeStyle,
      roughness: appState.currentItemRoughness,
      opacity: appState.currentItemOpacity,
      roundness: null, // Tables typically don't have roundness by default
      locked: false,
      // Seed should be randomized by newElementBase
    });

    return {
      elements: [tableElement],
      appState: {
        ...appState,
        elementType: "table", // Ensure this matches the ActionName
        activeTool: { ...appState.activeTool, type: "table" },
        selectedElementIds: { [tableElement.id]: true },
      },
      captureUpdate: true,
    };
  },
  checked: (appState) => appState.activeTool.type === "table",
});
