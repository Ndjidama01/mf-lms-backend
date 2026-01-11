import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    return next.handle().pipe(
      tap(async (response) => {
        // Only audit certain actions
        if (this.shouldAudit(method, url)) {
          try {
            const action = this.mapMethodToAction(method);
            const entityInfo = this.extractEntityInfo(url, body, response);

            if (user && entityInfo.entityType) {
              await this.prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action,
                  entityType: entityInfo.entityType,
                  entityId: entityInfo.entityId || 'N/A',
                  description: `${method} ${url}`,
                  newValues: method !== 'GET' ? body : undefined,
                  ipAddress: ip,
                  userAgent,
                },
              });
            }
          } catch (error) {
            this.logger.error('Failed to create audit log', error);
          }
        }
      }),
    );
  }

  private shouldAudit(method: string, url: string): boolean {
    // Don't audit GET requests or health checks
    if (method === 'GET' || url.includes('/health')) {
      return false;
    }
    return true;
  }

  private mapMethodToAction(method: string): AuditAction {
    const actionMap: Record<string, AuditAction> = {
      POST: AuditAction.CREATE,
      PUT: AuditAction.UPDATE,
      PATCH: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
      GET: AuditAction.VIEW,
    };
    return actionMap[method] || AuditAction.VIEW;
  }

  private extractEntityInfo(
    url: string,
    body: any,
    response: any,
  ): { entityType: string; entityId: string } {
    // Extract entity type from URL
    let entityType = 'Unknown';
    let entityId = '';

    if (url.includes('/customers')) {
      entityType = 'Customer';
      entityId = body?.id || response?.id || '';
    } else if (url.includes('/loans')) {
      entityType = 'Loan';
      entityId = body?.id || response?.id || '';
    } else if (url.includes('/users')) {
      entityType = 'User';
      entityId = body?.id || response?.id || '';
    } else if (url.includes('/documents')) {
      entityType = 'Document';
      entityId = body?.id || response?.id || '';
    }

    return { entityType, entityId };
  }
}
