import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  // GET /admin/dashboard - Get dashboard statistics
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ==================== USER MANAGEMENT ====================

  // GET /admin/users - List all users
  @Get('users')
  getUsers(
    @Query('role') role?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getUsers({ role, kycStatus, search, limit, offset });
  }

  // GET /admin/users/:userId - Get user details
  @Get('users/:userId')
  getUser(@Param('userId') userId: string) {
    return this.adminService.getUser(userId);
  }

  // PUT /admin/users/:userId/role - Update user role
  @Put('users/:userId/role')
  updateUserRole(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() body: { role: 'user' | 'admin' },
  ) {
    return this.adminService.updateUserRole(admin.id, userId, body.role);
  }

  // POST /admin/users/:userId/suspend - Suspend user
  @Post('users/:userId/suspend')
  suspendUser(
    @CurrentUser() admin: any,
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.suspendUser(admin.id, userId, body.reason);
  }

  // POST /admin/users/:userId/unsuspend - Unsuspend user
  @Post('users/:userId/unsuspend')
  unsuspendUser(@CurrentUser() admin: any, @Param('userId') userId: string) {
    return this.adminService.unsuspendUser(admin.id, userId);
  }

  // ==================== KYC MANAGEMENT ====================

  // GET /admin/kyc/pending - List pending KYC documents
  @Get('kyc/pending')
  getPendingKyc(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getPendingKyc(limit, offset);
  }

  // POST /admin/kyc/:documentId/approve - Approve KYC document
  @Post('kyc/:documentId/approve')
  approveKyc(@CurrentUser() admin: any, @Param('documentId') documentId: string) {
    return this.adminService.approveKyc(admin.id, documentId);
  }

  // POST /admin/kyc/:documentId/reject - Reject KYC document
  @Post('kyc/:documentId/reject')
  rejectKyc(
    @CurrentUser() admin: any,
    @Param('documentId') documentId: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.rejectKyc(admin.id, documentId, body.reason);
  }

  // ==================== TRANSACTION MANAGEMENT ====================

  // GET /admin/transactions - List all transactions
  @Get('transactions')
  getTransactions(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getAllTransactions({
      userId, type, status, from, to, minAmount, maxAmount, limit, offset,
    });
  }

  // GET /admin/transfers/pending - List pending transfers
  @Get('transfers/pending')
  getPendingTransfers(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getPendingTransfers(limit, offset);
  }

  // POST /admin/transfers/:transferId/approve - Approve transfer
  @Post('transfers/:transferId/approve')
  approveTransfer(@CurrentUser() admin: any, @Param('transferId') transferId: string) {
    return this.adminService.approveTransfer(admin.id, transferId);
  }

  // POST /admin/transfers/:transferId/reject - Reject transfer
  @Post('transfers/:transferId/reject')
  rejectTransfer(
    @CurrentUser() admin: any,
    @Param('transferId') transferId: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.rejectTransfer(admin.id, transferId, body.reason);
  }

  // ==================== NOTIFICATIONS ====================

  // POST /admin/notifications/send - Send notification to specific user
  @Post('notifications/send')
  sendNotification(
    @CurrentUser() admin: any,
    @Body() body: { userId: string; type: string; title: string; message: string },
  ) {
    return this.adminService.sendNotificationToUser(admin.id, body.userId, {
      type: body.type,
      title: body.title,
      message: body.message,
    });
  }

  // POST /admin/notifications/broadcast - Broadcast notification to all users
  @Post('notifications/broadcast')
  broadcastNotification(
    @CurrentUser() admin: any,
    @Body() body: { type: string; title: string; message: string; targetRole?: 'user' | 'admin' | 'all' },
  ) {
    return this.adminService.sendBroadcastNotification(admin.id, body);
  }

  // ==================== AUDIT LOGS ====================

  // GET /admin/audit-logs - Get audit logs
  @Get('audit-logs')
  getAuditLogs(
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getAuditLogs({
      adminId, action, targetType, from, to, limit, offset,
    });
  }
}
