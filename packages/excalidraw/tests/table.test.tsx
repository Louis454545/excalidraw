import { initializeExcalidrawTestHook } from "./helpers/api";
import { initializeExcalidrawElements } from "@excalidraw/element";
import { DEFAULT_ELEMENT_PROPS } from "@excalidraw/common";
import { newTableElement } from "@excalidraw/element";
import { ExcalidrawTableElement } from "@excalidraw/element";
import { resizeSingleElement } from "@excalidraw/element";
import { viewportCoordsToSceneCoords } from "../utils";
import { pointRotateRads, pointFrom } from "@excalidraw/math";
import type { AppState } from "../types";
import { isTableElement } from "@excalidraw/element";

// Mock an App-like structure for testing handleCanvasDoubleClick logic if needed
// This is a simplified mock. In a real scenario, you'd use more of the test setup from Excalidraw.
const mockApp = {
  state: {
    zoom: { value: 1 },
    scrollX: 0,
    scrollY: 0,
    width: 1000,
    height: 800,
    editingTableModel: null,
    selectedElementIds: {},
  } as AppState,
  scene: {
    getElementsIncludingDeleted: () => [],
    getNonDeletedElementsMap: () => new Map(),
    getElement: (id: string) => null, // Needs to be implemented if getElementAtPosition relies on it
  },
  setState: function (updater: any) {
    if (typeof updater === "function") {
      this.state = { ...this.state, ...updater(this.state) };
    } else {
      this.state = { ...this.state, ...updater };
    }
  },
  getElementAtPosition: (x: number, y: number) => {
    // Simplified: in a real test, this would check actual elements
    // For this test, we'll have the test case directly provide the element
    // if needed, or assume the element being tested is the one "hit".
    return mockApp.state.currentTestTableElement || null;
  },
  // Placeholder for current element being tested in a click scenario
  currentTestTableElement: null as ExcalidrawTableElement | null,
};

describe("ExcalidrawTableElement", () => {
  beforeEach(() => {
    initializeExcalidrawTestHook();
    // Reset mockApp state before each test
    mockApp.state = {
      zoom: { value: 1 },
      scrollX: 0,
      scrollY: 0,
      width: 1000,
      height: 800,
      editingTableModel: null,
      selectedElementIds: {},
    } as AppState;
    mockApp.currentTestTableElement = null;
  });

  describe("newTableElement", () => {
    it("should create a table with correct type, rows, columns, and default properties", () => {
      const table = newTableElement({
        x: 10,
        y: 20,
        rows: 3,
        columns: 4,
      });

      expect(table.type).toBe("table");
      expect(table.rows).toBe(3);
      expect(table.columns).toBe(4);
      expect(table.x).toBe(10);
      expect(table.y).toBe(20);

      // Check default properties
      expect(table.strokeColor).toBe(DEFAULT_ELEMENT_PROPS.strokeColor);
      expect(table.backgroundColor).toBe(
        DEFAULT_ELEMENT_PROPS.backgroundColor,
      );
      expect(table.fillStyle).toBe(DEFAULT_ELEMENT_PROPS.fillStyle);
      expect(table.strokeWidth).toBe(DEFAULT_ELEMENT_PROPS.strokeWidth);
      expect(table.strokeStyle).toBe(DEFAULT_ELEMENT_PROPS.strokeStyle);
      expect(table.roughness).toBe(DEFAULT_ELEMENT_PROPS.roughness);
      expect(table.opacity).toBe(DEFAULT_ELEMENT_PROPS.opacity);
      expect(table.locked).toBe(false);
    });

    it("should initialize cells correctly with empty strings and right dimensions", () => {
      const table = newTableElement({
        rows: 2,
        columns: 5,
      });

      expect(table.cells).toBeInstanceOf(Array);
      expect(table.cells.length).toBe(2); // Number of rows
      table.cells.forEach((row) => {
        expect(row).toBeInstanceOf(Array);
        expect(row.length).toBe(5); // Number of columns
        row.forEach((cell) => {
          expect(cell).toBe("");
        });
      });
    });

     it("should apply custom properties if provided", () => {
      const customProps = {
        x: 50,
        y: 60,
        rows: 1,
        columns: 1,
        strokeColor: "#FF0000",
        backgroundColor: "#00FF00",
        width: 200,
        height: 100,
      };
      const table = newTableElement(customProps);

      expect(table.x).toBe(customProps.x);
      expect(table.y).toBe(customProps.y);
      expect(table.rows).toBe(customProps.rows);
      expect(table.columns).toBe(customProps.columns);
      expect(table.strokeColor).toBe(customProps.strokeColor);
      expect(table.backgroundColor).toBe(customProps.backgroundColor);
      expect(table.width).toBe(customProps.width);
      expect(table.height).toBe(customProps.height);
    });
  });

  describe("Table Resizing", () => {
    it("should update width and height on resizeSingleElement", () => {
      const origTable = newTableElement({
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        rows: 2,
        columns: 2,
      });

      // Mock necessary parts for resizeSingleElement
      const mockScene = {
        getNonDeletedElementsMap: () => new Map([[origTable.id, origTable]]),
        mutateElement: (element: ExcalidrawTableElement, updates: Partial<ExcalidrawTableElement>) => {
          // In a real scenario, this would update the scene. For the test, we can update a local copy.
          Object.assign(element, updates);
        },
      };
      
      const newWidth = 200;
      const newHeight = 150;

      // Create a copy for originalElementsMap
      const originalElementsMap = new Map();
      originalElementsMap.set(origTable.id, {...origTable});


      resizeSingleElement(
        newWidth,
        newHeight,
        origTable, // latestElement
        {...origTable}, // origElement (from originalElements map)
        originalElementsMap, // originalElementsMap
        mockScene as any, // scene
        "se", // handleDirection (south-east)
        {
          shouldMaintainAspectRatio: false,
          shouldResizeFromCenter: false,
        },
      );
      
      expect(origTable.width).toBe(newWidth);
      expect(origTable.height).toBe(newHeight);
    });
  });

  describe("Cell Identification for Editing (handleCanvasDoubleClick logic)", () => {
    // This is a simplified stand-in for handleCanvasDoubleClick
    // It focuses on the cell identification logic part
    const getEditingTableModelForClick = (
      tableElement: ExcalidrawTableElement,
      clickSceneX: number,
      clickSceneY: number,
      appState: AppState,
    ) => {
      if (!isTableElement(tableElement) || tableElement.locked) {
        return null;
      }

      const tableCenterX = tableElement.x + tableElement.width / 2;
      const tableCenterY = tableElement.y + tableElement.height / 2;

      const rotatedClickPoint = pointRotateRads(
        pointFrom(clickSceneX, clickSceneY),
        pointFrom(tableCenterX, tableCenterY),
        -tableElement.angle as any, // Radians type
      );

      const relativeX = rotatedClickPoint.x - tableElement.x;
      const relativeY = rotatedClickPoint.y - tableElement.y;

      const cellWidth = tableElement.width / tableElement.columns;
      const cellHeight = tableElement.height / tableElement.rows;

      const col = Math.floor(relativeX / cellWidth);
      const row = Math.floor(relativeY / cellHeight);

      if (
        row >= 0 &&
        row < tableElement.rows &&
        col >= 0 &&
        col < tableElement.columns
      ) {
        return { elementId: tableElement.id, cell: { row, col } };
      }
      return null;
    };

    it("should correctly identify cell [0,0] when clicking in its top-left area (no rotation)", () => {
      const table = newTableElement({
        x: 100,
        y: 100,
        width: 300,
        height: 150,
        rows: 3,
        columns: 3,
        angle: 0, // No rotation
      });
      mockApp.currentTestTableElement = table;

      // Click slightly inside cell [0,0]
      const clickSceneX = 105;
      const clickSceneY = 105;
      
      const editingModel = getEditingTableModelForClick(table, clickSceneX, clickSceneY, mockApp.state);
      mockApp.setState({ editingTableModel: editingModel });


      expect(mockApp.state.editingTableModel).toEqual({
        elementId: table.id,
        cell: { row: 0, col: 0 },
      });
    });

    it("should correctly identify cell [1,1] (center cell for 3x3) (no rotation)", () => {
      const table = newTableElement({
        x: 100,
        y: 100,
        width: 300, // cellWidth = 100
        height: 150, // cellHeight = 50
        rows: 3,
        columns: 3,
        angle: 0,
      });
      mockApp.currentTestTableElement = table;

      // Click in the middle of cell [1,1]
      // cell [1,1] starts at x: 100+100=200, y: 100+50=150
      const clickSceneX = 250; // Middle of 200-300 range
      const clickSceneY = 175; // Middle of 150-200 range

      const editingModel = getEditingTableModelForClick(table, clickSceneX, clickSceneY, mockApp.state);
      mockApp.setState({ editingTableModel: editingModel });

      expect(mockApp.state.editingTableModel).toEqual({
        elementId: table.id,
        cell: { row: 1, col: 1 },
      });
    });
    
    it("should return null if click is outside table bounds", () => {
      const table = newTableElement({
        x: 100,
        y: 100,
        width: 300,
        height: 150,
        rows: 3,
        columns: 3,
        angle: 0,
      });
      mockApp.currentTestTableElement = table;

      const clickSceneX = 50; // Outside left
      const clickSceneY = 50; // Outside top

      const editingModel = getEditingTableModelForClick(table, clickSceneX, clickSceneY, mockApp.state);
      mockApp.setState({ editingTableModel: editingModel });

      expect(mockApp.state.editingTableModel).toBeNull();
    });

    it("should correctly identify cell [0,0] when table is rotated 90 degrees", () => {
      const table = newTableElement({
        x: 100, // Original top-left
        y: 100,
        width: 200, // cellWidth = 100
        height: 100, // cellHeight = 50
        rows: 2,
        columns: 2,
        angle: Math.PI / 2, // 90 degrees clockwise
      });
      mockApp.currentTestTableElement = table;

      // Original center of the table: (100 + 200/2, 100 + 100/2) = (200, 150)
      // Click point for original cell [0,0]'s top-left area (e.g., 105,105 if unrotated)
      // After 90 deg rotation around (200,150), (105,105) becomes:
      // newX = centerX + (oldY - centerY) = 200 + (105 - 150) = 200 - 45 = 155
      // newY = centerY - (oldX - centerX) = 150 - (105 - 200) = 150 + 95 = 245
      const clickSceneX = 155; 
      const clickSceneY = 245;

      const editingModel = getEditingTableModelForClick(table, clickSceneX, clickSceneY, mockApp.state);
      mockApp.setState({ editingTableModel: editingModel });
      
      expect(mockApp.state.editingTableModel).toEqual({
        elementId: table.id,
        cell: { row: 0, col: 0 },
      });
    });
  });
});
