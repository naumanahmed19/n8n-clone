import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import multer from "multer";
import path from "path";
import { authenticateToken } from "../middleware/auth";
import { CustomNodeUploadHandler } from "../services/CustomNodeUploadHandler";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), "temp/uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/zip" ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/node-types
 * Get all node types from the database
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { group } = req.query;

    const whereClause = group ? { group: { has: group as string } } : {};

    const nodeTypes = await prisma.nodeType.findMany({
      where: whereClause,
      orderBy: [{ active: "desc" }, { displayName: "asc" }],
    });

    res.json({
      success: true,
      data: nodeTypes,
      count: nodeTypes.length,
    });
  } catch (error) {
    logger.error("Failed to get node types", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get node types",
    });
  }
});

/**
 * GET /api/node-types/:type
 * Get a specific node type by type identifier
 */
router.get("/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    const nodeType = await prisma.nodeType.findUnique({
      where: { type },
    });

    if (!nodeType) {
      return res.status(404).json({
        success: false,
        error: "Node type not found",
      });
    }

    res.json({
      success: true,
      data: nodeType,
    });
  } catch (error) {
    logger.error("Failed to get node type", { error, type: req.params.type });
    res.status(500).json({
      success: false,
      error: "Failed to get node type",
    });
  }
});

/**
 * POST /api/node-types/upload
 * Upload a ZIP file containing custom nodes
 */
router.post(
  "/upload",
  upload.single("nodes"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const uploadHandler = new CustomNodeUploadHandler();
      const result = await uploadHandler.processUpload(
        req.file.path,
        req.file.originalname
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            nodes: result.nodes,
            extractedPath: result.extractedPath,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Upload processing failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      logger.error("Failed to process upload", { error });
      res.status(500).json({
        success: false,
        error: "Failed to process upload",
      });
    }
  }
);

/**
 * PATCH /api/node-types/:type
 * Update a node type's properties (e.g., active status)
 */
router.patch("/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const updateData = req.body;

    // Log the update request for debugging
    logger.info("Updating node type", { type, updateData });

    const nodeType = await prisma.nodeType.update({
      where: { type },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    logger.info("Node type updated successfully", {
      type,
      active: nodeType.active,
    });

    res.json({
      success: true,
      data: nodeType,
      message: "Node type updated successfully",
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Node type not found",
      });
    }

    logger.error("Failed to update node type", {
      error,
      type: req.params.type,
      updateData: req.body,
    });
    res.status(500).json({
      success: false,
      error: "Failed to update node type",
    });
  }
});

/**
 * DELETE /api/node-types/:type
 * Delete a custom node type
 */
router.delete("/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    await prisma.nodeType.delete({
      where: { type },
    });

    res.json({
      success: true,
      message: `Node type ${type} deleted successfully`,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Node type not found",
      });
    }

    logger.error("Failed to delete node type", {
      error,
      type: req.params.type,
    });
    res.status(500).json({
      success: false,
      error: "Failed to delete node type",
    });
  }
});

/**
 * GET /api/node-types/groups/list
 * Get all unique groups from node types
 */
router.get("/groups/list", async (req: Request, res: Response) => {
  try {
    const nodeTypes = await prisma.nodeType.findMany({
      select: { group: true },
    });

    const allGroups = nodeTypes.flatMap((nt) => nt.group);
    const uniqueGroups = [...new Set(allGroups)].sort();

    res.json({
      success: true,
      data: uniqueGroups,
      count: uniqueGroups.length,
    });
  } catch (error) {
    logger.error("Failed to get node groups", { error });
    res.status(500).json({
      success: false,
      error: "Failed to get node groups",
    });
  }
});

export { router as nodeTypeRoutes };
