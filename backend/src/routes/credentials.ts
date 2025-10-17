import { Response, Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import { AppError } from "../utils/errors";
import {
  credentialCreateSchema,
  credentialUpdateSchema,
} from "../utils/validation";

const router = Router();

// Use global credential service instance (shared with NodeLoader)
const getCredentialService = () => {
  if (!global.credentialService) {
    throw new Error("CredentialService not initialized");
  }
  return global.credentialService;
};

// Get all credentials for the authenticated user
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type } = req.query;

    const credentials = await getCredentialService().getCredentials(
      req.user!.id,
      type as string
    );

    res.json({
      success: true,
      data: credentials,
    });
  })
);

// Get available credential types
router.get(
  "/types",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const credentialTypes = getCredentialService().getCredentialTypes();

    res.json({
      success: true,
      data: credentialTypes,
    });
  })
);

// Get expiring credentials
router.get(
  "/expiring/:days?",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const warningDays = parseInt(req.params.days || "7");

    if (isNaN(warningDays) || warningDays < 1) {
      throw new AppError("Warning days must be a positive number", 400);
    }

    const expiringCredentials =
      await getCredentialService().getExpiringCredentials(
        req.user!.id,
        warningDays
      );

    res.json({
      success: true,
      data: expiringCredentials,
    });
  })
);

// Get a specific credential
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const credential = await getCredentialService().getCredential(
      id,
      req.user!.id
    );

    if (!credential) {
      throw new AppError("Credential not found", 404);
    }

    // Don't return decrypted data in GET requests for security
    const { data, ...credentialWithoutData } = credential;

    res.json({
      success: true,
      data: credentialWithoutData,
    });
  })
);

// Get credential for execution (internal endpoint)
router.get(
  "/:id/execution",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const credentialData =
      await getCredentialService().getCredentialForExecution(id, req.user!.id);

    res.json({
      success: true,
      data: credentialData,
    });
  })
);

// Create a new credential
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = credentialCreateSchema.parse(req.body);

    const credential = await getCredentialService().createCredential(
      req.user!.id,
      validatedData.name,
      validatedData.type,
      validatedData.data,
      validatedData.expiresAt
    );

    // Don't return decrypted data
    const { data, ...credentialWithoutData } = credential;

    res.status(201).json({
      success: true,
      data: credentialWithoutData,
    });
  })
);

// Update a credential
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validatedData = credentialUpdateSchema.parse(req.body);

    const credential = await getCredentialService().updateCredential(
      id,
      req.user!.id,
      {
        name: validatedData.name,
        data: validatedData.data,
        expiresAt: validatedData.expiresAt,
      }
    );

    // Don't return decrypted data
    const { data, ...credentialWithoutData } = credential;

    res.json({
      success: true,
      data: credentialWithoutData,
    });
  })
);

// Delete a credential
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await getCredentialService().deleteCredential(id, req.user!.id);

    res.json({
      success: true,
      message: "Credential deleted successfully",
    });
  })
);

// Test a credential
router.post(
  "/test",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, data } = req.body;

    if (!type || !data) {
      throw new AppError("Credential type and data are required", 400);
    }

    const testResult = await getCredentialService().testCredential(type, data);

    res.json({
      success: true,
      data: testResult,
    });
  })
);

// Test a saved credential (for OAuth credentials that don't have tokens in the form)
router.post(
  "/test-saved",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { credentialId } = req.body;

    if (!credentialId) {
      throw new AppError("Credential ID is required", 400);
    }

    // Get the credential from database
    const credential = await getCredentialService().getCredential(
      credentialId,
      req.user!.id
    );

    if (!credential) {
      throw new AppError("Credential not found", 404);
    }

    // Test the credential with its saved data (includes tokens)
    const testResult = await getCredentialService().testCredential(
      credential.type,
      credential.data
    );

    res.json({
      success: true,
      data: testResult,
    });
  })
);

// Rotate a credential
router.post(
  "/:id/rotate",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      throw new AppError("New credential data is required", 400);
    }

    const rotatedCredential = await getCredentialService().rotateCredential(
      id,
      req.user!.id,
      data
    );

    // Don't return decrypted data
    const { data: credentialData, ...credentialWithoutData } =
      rotatedCredential;

    res.json({
      success: true,
      data: credentialWithoutData,
      message: "Credential rotated successfully",
    });
  })
);

export default router;
