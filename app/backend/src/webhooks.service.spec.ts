import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { SessionService } from './session/session.service';
import { PrismaService } from './prisma/prisma.service';
import {
  AiVerificationPayloadDto,
  VerificationStatus,
} from './ai-verification.dto';
import {
  AppException,
  INTEGRATION_ERROR_CODES,
} from './common/constants/integration-error-codes';

jest.mock('@prisma/client', () => {
  return {
    ...jest.requireActual('@prisma/client'),
    SessionStatus: {
      pending: 'pending',
      approved: 'approved',
      disbursed: 'disbursed',
    },
    StepStatus: {
      pending: 'pending',
      in_progress: 'in_progress',
      completed: 'completed',
      failed: 'failed',
    },
  };
});

type MockPrismaService = {
  webhookEvent: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('WebhooksService', () => {
  let service: WebhooksService;
  let sessionService: SessionService;

  const mockPrisma = {
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation(callback => callback(mockPrisma)),
  } as unknown as MockPrismaService;

  const mockSessionServiceObj = {
    getSession: jest.fn(),
    submitToStep: jest.fn(),
  };

  const payload: AiVerificationPayloadDto = {
    eventId: 'evt_123',
    sessionId: 'sess_456',
    status: VerificationStatus.VERIFIED,
    details: { score: 0.9 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrisma as unknown as PrismaService,
        },
        { provide: SessionService, useValue: mockSessionServiceObj },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    sessionService = module.get<SessionService>(SessionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAiVerification', () => {
    it('should throw AppException(WEBHOOK_DUPLICATE_EVENT) if event is already processed', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        service.processAiVerification(payload),
      ).rejects.toMatchObject({
        errorCode: INTEGRATION_ERROR_CODES.WEBHOOK_DUPLICATE_EVENT,
        statusCode: 409,
      });
    });

    it('should be an AppException instance for duplicate event', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue({ id: '1' });

      let caught: unknown;
      try {
        await service.processAiVerification(payload);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      const ex = caught as AppException;
      expect(ex.errorCode).toBe(
        INTEGRATION_ERROR_CODES.WEBHOOK_DUPLICATE_EVENT,
      );
      expect(ex.statusCode).toBe(409);
      expect(ex.details).toMatchObject({ eventId: payload.eventId });
    });

    it('should throw AppException(WEBHOOK_SESSION_NOT_FOUND) if session is missing', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
      mockSessionServiceObj.getSession.mockResolvedValue(null);

      await expect(
        service.processAiVerification(payload),
      ).rejects.toMatchObject({
        errorCode: INTEGRATION_ERROR_CODES.WEBHOOK_SESSION_NOT_FOUND,
        statusCode: 404,
      });
    });

    it('should throw AppException(WEBHOOK_SESSION_NOT_FOUND) if session is not pending', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
      mockSessionServiceObj.getSession.mockResolvedValue({
        id: 'sess_456',
        status: 'approved',
        steps: [],
      });

      await expect(
        service.processAiVerification(payload),
      ).rejects.toMatchObject({
        errorCode: INTEGRATION_ERROR_CODES.WEBHOOK_SESSION_NOT_FOUND,
        statusCode: 404,
      });
    });

    it('should throw AppException(WEBHOOK_STEP_NOT_FOUND) if no matching step exists', async () => {
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
      mockSessionServiceObj.getSession.mockResolvedValue({
        id: 'sess_456',
        status: 'pending',
        steps: [{ stepName: 'other_step', status: 'pending' }],
      });

      await expect(
        service.processAiVerification(payload),
      ).rejects.toMatchObject({
        errorCode: INTEGRATION_ERROR_CODES.WEBHOOK_STEP_NOT_FOUND,
        statusCode: 404,
      });
    });

    it('should process the webhook successfully', async () => {
      const stepId = 'step_789';
      mockPrisma.webhookEvent.findUnique.mockResolvedValue(null);
      mockSessionServiceObj.getSession.mockResolvedValue({
        id: 'sess_456',
        status: 'pending',
        steps: [
          {
            id: stepId,
            stepName: 'identity_verification',
            status: 'in_progress',
          },
        ],
      });

      const result = await service.processAiVerification(payload);

      expect(mockPrisma.webhookEvent.create).toHaveBeenCalled();
      expect(sessionService.submitToStep).toHaveBeenCalledWith(
        payload.sessionId,
        stepId,
        {
          submissionKey: payload.eventId,
          payload: { status: payload.status, details: payload.details },
        },
      );
      expect(result).toEqual({ status: 'success', eventId: payload.eventId });
    });
  });
});
